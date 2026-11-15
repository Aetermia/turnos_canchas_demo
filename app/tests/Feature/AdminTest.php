<?php

namespace Tests\Feature;

use App\Models\BlockedPeriod;
use App\Models\Booking;
use App\Models\Court;
use App\Models\EstablishmentSetting;
use App\Models\PricingRule;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-10 09:00:00'));
        $this->admin = User::factory()->admin()->create();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function schedules(string $opens = '08:00', string $closes = '23:00'): array
    {
        return collect(range(1, 7))->map(fn (int $weekday) => [
            'weekday' => $weekday,
            'is_open' => true,
            'opens_at' => $opens,
            'closes_at' => $closes,
        ])->all();
    }

    private function courtPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Cancha Norte',
            'sport' => 'Pádel',
            'surface' => 'Césped sintético',
            'description' => 'Cancha techada',
            'slot_minutes' => 60,
            'buffer_minutes' => 10,
            'sort_order' => 1,
            'is_active' => true,
            'schedules' => $this->schedules(),
            'pricing' => [
                ['weekday' => null, 'starts_at' => '08:00', 'ends_at' => '18:00', 'amount' => 22000],
                ['weekday' => 6, 'starts_at' => '09:00', 'ends_at' => '13:00', 'amount' => 30000],
            ],
        ], $overrides);
    }

    public function test_admin_creates_a_court_with_its_schedule_and_rates(): void
    {
        $this->actingAs($this->admin)
            ->post('/panel/canchas', $this->courtPayload())
            ->assertRedirect('/panel/canchas');

        $court = Court::query()->firstOrFail();

        $this->assertSame('cancha-norte', $court->slug);
        $this->assertSame(7, $court->schedules()->count());
        $this->assertSame(2, $court->pricingRules()->count());
        // Price arrives in pesos and is stored in cents.
        $this->assertSame(2_200_000, (int) $court->pricingRules()->orderBy('id')->first()->amount_cents);
    }

    public function test_court_form_rejects_a_closing_time_before_opening(): void
    {
        $this->actingAs($this->admin)
            ->from('/panel/canchas/nueva')
            ->post('/panel/canchas', $this->courtPayload(['schedules' => $this->schedules('20:00', '09:00')]))
            ->assertSessionHasErrors('schedules');

        $this->assertSame(0, Court::query()->count());
    }

    public function test_receptionist_cannot_manage_courts_or_settings(): void
    {
        $receptionist = User::factory()->receptionist()->create();

        $this->actingAs($receptionist)->get('/panel/canchas')->assertForbidden();
        $this->actingAs($receptionist)->get('/panel/configuracion')->assertForbidden();
        $this->actingAs($receptionist)->post('/panel/canchas', $this->courtPayload())->assertForbidden();
    }

    public function test_staff_books_for_a_customer_from_the_panel(): void
    {
        $court = Court::factory()->configured()->create();
        $customer = User::factory()->create();
        $receptionist = User::factory()->receptionist()->create();

        $this->actingAs($receptionist)
            ->post('/panel/reservas', [
                'court_id' => $court->id,
                'user_id' => $customer->id,
                'date' => '2026-03-11',
                'time' => '15:00',
                'duration_minutes' => 60,
                'notes' => 'Reserva telefónica',
            ])
            ->assertRedirect();

        $booking = Booking::query()->firstOrFail();

        $this->assertSame($customer->id, $booking->user_id);
        $this->assertSame($receptionist->id, $booking->created_by);
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking.created', 'user_id' => $receptionist->id]);
    }

    public function test_manual_booking_overlap_is_rejected_with_a_message(): void
    {
        $court = Court::factory()->configured()->create();
        $customer = User::factory()->create();

        $payload = [
            'court_id' => $court->id,
            'user_id' => $customer->id,
            'date' => '2026-03-11',
            'time' => '15:00',
            'duration_minutes' => 60,
        ];

        $this->actingAs($this->admin)->post('/panel/reservas', $payload);
        $this->actingAs($this->admin)
            ->from('/panel/reservas/nueva')
            ->post('/panel/reservas', $payload)
            ->assertSessionHas('error');

        $this->assertSame(1, Booking::query()->count());
    }

    public function test_customer_list_contains_only_customers(): void
    {
        User::factory()->receptionist()->create();
        $customer = User::factory()->create(['name' => 'Ana Cliente']);

        $this->actingAs($this->admin)
            ->get('/panel/clientes')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Customers/Index')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Ana Cliente'));

        $this->assertSame($customer->id, User::query()->where('role', 'customer')->first()?->id);
    }

    public function test_block_removes_slots_and_deleting_it_restores_them(): void
    {
        $court = Court::factory()->configured()->create();

        $this->actingAs($this->admin)->post('/panel/bloqueos', [
            'court_id' => $court->id,
            'date' => '2026-03-11',
            'starts_at' => '10:00',
            'ends_at' => '12:00',
            'reason' => 'Mantenimiento del césped',
        ])->assertSessionHasNoErrors();

        $block = BlockedPeriod::query()->firstOrFail();
        $availability = AvailabilityService::make();
        $slots = collect($availability->slots($court, CarbonImmutable::parse('2026-03-11')));

        $at = fn (string $clock) => $slots->firstWhere(fn ($slot) => str_contains($slot['start'], 'T'.$clock));

        $this->assertFalse($at('10:00')['available']);
        $this->assertFalse($at('11:00')['available']);
        $this->assertTrue($at('13:00')['available']);

        $this->actingAs($this->admin)->delete("/panel/bloqueos/{$block->id}")->assertSessionHasNoErrors();

        $this->assertSame(0, BlockedPeriod::query()->count());
        $restored = collect($availability->slots($court->fresh(), CarbonImmutable::parse('2026-03-11')))
            ->first(fn ($slot) => str_contains($slot['start'], 'T10:00'));

        $this->assertTrue($restored['available']);
    }

    public function test_settings_update_is_persisted_and_reaches_the_brand(): void
    {
        $this->actingAs($this->admin)->patch('/panel/configuracion', [
            'name' => 'Complejo Nuevo',
            'tagline' => 'Pádel todo el año',
            'about' => null,
            'accent_color' => '#123456',
            'phone' => '11 4000 0000',
            'whatsapp' => null,
            'email' => null,
            'address' => null,
            'city' => 'San Isidro',
            'maps_url' => null,
            'auto_confirm' => false,
            'pending_blocks_slot' => true,
            'min_advance_minutes' => 30,
            'max_advance_days' => 15,
            'cancellation_hours' => 6,
        ])->assertSessionHasNoErrors();

        $settings = EstablishmentSetting::current();
        $this->assertSame('#123456', $settings->accent_color);
        $this->assertFalse($settings->auto_confirm);
        $this->assertSame(15, $settings->max_advance_days);

        $this->actingAs($this->admin)
            ->get('/panel')
            ->assertInertia(fn (Assert $page) => $page->where('brand.accent', '#123456'));
    }

    public function test_calendar_lists_bookings_of_the_day(): void
    {
        $court = Court::factory()->configured()->create();
        $customer = User::factory()->create(['name' => 'Juan Jugador']);
        Booking::create([
            'code' => 'BK-CAL001',
            'user_id' => $customer->id,
            'court_id' => $court->id,
            'starts_at' => '2026-03-10 18:00:00',
            'ends_at' => '2026-03-10 19:00:00',
            'duration_minutes' => 60,
            'price_cents' => 3_000_000,
            'status' => 'confirmed',
        ]);

        $this->actingAs($this->admin)
            ->get('/panel/calendario?date=2026-03-10')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Calendar')
                ->has('columns', 1)
                ->has('items', 1)
                ->where('items.0.title', 'Juan Jugador')
                ->where('items.0.kind', 'booking'));
    }

    public function test_staff_cannot_be_edited_as_a_customer(): void
    {
        $other = User::factory()->receptionist()->create();

        $this->actingAs($this->admin)
            ->patch("/panel/clientes/{$other->id}", [
                'name' => 'Intento',
                'email' => $other->email,
                'is_active' => false,
            ])
            ->assertNotFound();
    }

    public function test_customers_page_shows_their_own_bookings(): void
    {
        $court = Court::factory()->configured()->create();
        $customer = User::factory()->create();
        Booking::create([
            'code' => 'BK-HIST01',
            'user_id' => $customer->id,
            'court_id' => $court->id,
            'starts_at' => '2026-03-12 10:00:00',
            'ends_at' => '2026-03-12 11:00:00',
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'confirmed',
        ]);

        $this->actingAs($this->admin)
            ->get("/panel/clientes/{$customer->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Customers/Show')
                ->where('stats.total', 1)
                ->has('bookings', 1));
    }
}
