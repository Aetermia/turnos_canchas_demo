<?php

namespace Tests\Feature;

use App\Models\BlockedPeriod;
use App\Models\Booking;
use App\Models\Court;
use App\Models\EstablishmentSetting;
use App\Models\PricingRule;
use App\Services\AvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Tuesday 10 March 2026, 09:00 in Buenos Aires.
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-10 09:00:00'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function service(): AvailabilityService
    {
        return AvailabilityService::make();
    }

    private function day(string $date = '2026-03-10'): CarbonImmutable
    {
        return CarbonImmutable::parse($date.' 00:00:00');
    }

    public function test_slots_follow_schedule_and_price_bands(): void
    {
        $court = Court::factory()->configured()->create();
        $slots = $this->service()->slots($court, $this->day());

        // 08:00 to 23:00 hourly minus the slots before the 60 minute lead time.
        $this->assertCount(13, $slots);
        $this->assertSame('10:00', CarbonImmutable::parse($slots[0]['start'])->format('H:i'));
        $this->assertSame('22:00', CarbonImmutable::parse($slots[12]['start'])->format('H:i'));

        $this->assertSame(2_000_000, $slots[0]['price_cents']);

        $evening = collect($slots)->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '18:00');
        $this->assertSame(3_000_000, $evening['price_cents']);
    }

    public function test_weekday_rule_beats_the_all_week_rule(): void
    {
        $court = Court::factory()->configured()->create();

        PricingRule::create([
            'court_id' => $court->id,
            'weekday' => 6,
            'starts_at' => '08:00:00',
            'ends_at' => '23:00:00',
            'amount_cents' => 5_000_000,
        ]);

        $saturday = $this->service()->slots($court, $this->day('2026-03-14'));

        $this->assertNotEmpty($saturday);
        $this->assertSame(5_000_000, $saturday[0]['price_cents']);
    }

    public function test_closed_weekday_has_no_slots(): void
    {
        $court = Court::factory()->configured()->create();
        $court->schedules()->where('weekday', 2)->update(['is_open' => false]);
        $court->load('schedules');

        $this->assertSame([], $this->service()->slots($court, $this->day()));
    }

    public function test_inactive_court_has_no_slots(): void
    {
        $court = Court::factory()->configured()->inactive()->create();

        $this->assertSame([], $this->service()->slots($court, $this->day()));
    }

    public function test_booked_slot_is_not_available(): void
    {
        $court = Court::factory()->configured()->create();
        Booking::create([
            'code' => 'BK-TEST01',
            'user_id' => \App\Models\User::factory()->create()->id,
            'court_id' => $court->id,
            'starts_at' => '2026-03-10 11:00:00',
            'ends_at' => '2026-03-10 12:00:00',
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'confirmed',
        ]);

        $slots = collect($this->service()->slots($court, $this->day()));
        $eleven = $slots->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '11:00');

        $this->assertFalse($eleven['available']);
        $this->assertSame('Ocupado', $eleven['reason']);
    }

    public function test_establishment_wide_block_removes_slots_from_every_court(): void
    {
        $court = Court::factory()->configured()->create();
        $other = Court::factory()->configured()->create();

        BlockedPeriod::create([
            'court_id' => null,
            'starts_at' => '2026-03-10 15:00:00',
            'ends_at' => '2026-03-10 17:00:00',
            'reason' => 'Feriado',
        ]);

        foreach ([$court, $other] as $c) {
            $fifteen = collect($this->service()->slots($c, $this->day()))
                ->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '15:00');

            $this->assertFalse($fifteen['available']);
        }
    }

    public function test_buffer_minutes_keep_a_gap_after_a_booking(): void
    {
        $court = Court::factory()->configured()->create();
        $court->update(['buffer_minutes' => 15]);

        Booking::create([
            'code' => 'BK-TEST02',
            'user_id' => \App\Models\User::factory()->create()->id,
            'court_id' => $court->id,
            'starts_at' => '2026-03-10 12:00:00',
            'ends_at' => '2026-03-10 13:00:00',
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'confirmed',
        ]);

        $slots = collect($this->service()->slots($court->fresh(), $this->day()));

        $this->assertFalse($slots->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '11:00')['available']);
        $this->assertTrue($slots->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '14:00')['available']);
    }

    public function test_pending_bookings_block_only_when_configured(): void
    {
        $court = Court::factory()->configured()->create();

        Booking::create([
            'code' => 'BK-TEST03',
            'user_id' => \App\Models\User::factory()->create()->id,
            'court_id' => $court->id,
            'starts_at' => '2026-03-10 12:00:00',
            'ends_at' => '2026-03-10 13:00:00',
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'pending',
        ]);

        $noon = fn () => collect($this->service()->slots($court, $this->day()))
            ->first(fn ($s) => CarbonImmutable::parse($s['start'])->format('H:i') === '12:00');

        $this->assertFalse($noon()['available']);

        EstablishmentSetting::current()->update(['pending_blocks_slot' => false]);

        $this->assertTrue($noon()['available']);
    }

    public function test_dates_beyond_the_booking_window_have_no_slots(): void
    {
        $court = Court::factory()->configured()->create();

        $this->assertSame([], $this->service()->slots($court, $this->day('2026-06-01')));
    }

    public function test_multi_slot_booking_is_priced_per_unit(): void
    {
        $court = Court::factory()->configured()->create();
        $start = CarbonImmutable::parse('2026-03-10 17:00:00');

        // 17:00 (day band) + 18:00 (evening band).
        $this->assertSame(5_000_000, $this->service()->priceFor($court, $start, 120));
    }
}
