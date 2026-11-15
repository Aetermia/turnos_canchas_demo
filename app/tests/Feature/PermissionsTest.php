<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class PermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_the_panel(): void
    {
        $this->get('/panel')->assertRedirect('/ingresar');
    }

    public function test_customer_cannot_enter_the_panel(): void
    {
        $this->actingAs(User::factory()->create())->get('/panel')->assertForbidden();
    }

    public function test_receptionist_and_admin_can_enter_the_panel(): void
    {
        $this->actingAs(User::factory()->receptionist()->create())->get('/panel')->assertOk();
        $this->actingAs(User::factory()->admin()->create())->get('/panel')->assertOk();
    }

    public function test_deactivated_user_loses_an_existing_session(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->actingAs($user)->get('/mi-cuenta')->assertRedirect('/ingresar');
    }

    public function test_customer_can_only_see_his_own_booking(): void
    {
        $court = Court::factory()->configured()->create();
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $booking = $this->bookingFor($court, $owner);

        $this->assertTrue(Gate::forUser($owner)->allows('view', $booking));
        $this->assertFalse(Gate::forUser($other)->allows('view', $booking));
        $this->assertFalse(Gate::forUser($other)->allows('cancel', $booking));
        $this->assertFalse(Gate::forUser($other)->allows('reschedule', $booking));
    }

    public function test_receptionist_cannot_manage_courts_or_settings_but_admin_can(): void
    {
        $court = Court::factory()->create();
        $receptionist = User::factory()->receptionist()->create();
        $admin = User::factory()->admin()->create();

        $this->assertFalse(Gate::forUser($receptionist)->allows('update', $court));
        $this->assertFalse(Gate::forUser($receptionist)->allows('manage', \App\Models\EstablishmentSetting::class));
        $this->assertTrue(Gate::forUser($admin)->allows('update', $court));
        $this->assertTrue(Gate::forUser($admin)->allows('manage', \App\Models\EstablishmentSetting::class));
    }

    public function test_receptionist_can_manage_bookings_and_customers(): void
    {
        $court = Court::factory()->configured()->create();
        $receptionist = User::factory()->receptionist()->create();
        $customer = User::factory()->create();
        $booking = $this->bookingFor($court, $customer);

        $this->assertTrue(Gate::forUser($receptionist)->allows('view', $booking));
        $this->assertTrue(Gate::forUser($receptionist)->allows('cancel', $booking));
        $this->assertTrue(Gate::forUser($receptionist)->allows('reschedule', $booking));
        $this->assertTrue(Gate::forUser($receptionist)->allows('update', $customer));
        $this->assertFalse(Gate::forUser($customer)->allows('update', User::factory()->create()));
    }

    private function bookingFor(Court $court, User $user): Booking
    {
        return Booking::create([
            'code' => 'BK-'.strtoupper(substr(md5((string) $user->id), 0, 6)),
            'user_id' => $user->id,
            'court_id' => $court->id,
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at' => now()->addDay()->setTime(11, 0),
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'confirmed',
        ]);
    }
}
