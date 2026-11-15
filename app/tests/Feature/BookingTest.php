<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Exceptions\BookingException;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Court;
use App\Models\EstablishmentSetting;
use App\Models\PricingRule;
use App\Models\User;
use App\Services\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private Court $court;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-10 09:00:00'));

        $this->court = Court::factory()->configured()->create();
        $this->customer = User::factory()->create();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function at(string $time, string $date = '2026-03-11'): CarbonImmutable
    {
        return CarbonImmutable::parse($date.' '.$time);
    }

    private function book(string $time = '10:00', int $duration = 60, ?User $customer = null, string $date = '2026-03-11'): Booking
    {
        return BookingService::make()->create($this->court, $customer ?? $this->customer, $this->at($time, $date), $duration);
    }

    public function test_booking_is_confirmed_and_priced_when_auto_confirm_is_on(): void
    {
        $booking = $this->book();

        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(2_000_000, $booking->price_cents);
        $this->assertSame(60, $booking->duration_minutes);
        $this->assertNotNull($booking->confirmed_at);
        $this->assertMatchesRegularExpression('/^BK-[A-Z0-9]{6}$/', $booking->code);
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking.created', 'subject_id' => $booking->id]);
    }

    public function test_booking_is_pending_when_auto_confirm_is_off(): void
    {
        EstablishmentSetting::current()->update(['auto_confirm' => false]);

        $booking = $this->book();

        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertNull($booking->confirmed_at);
    }

    public function test_same_slot_cannot_be_booked_twice(): void
    {
        $this->book('10:00');

        $this->expectException(BookingException::class);
        $this->expectExceptionMessage('Ese horario ya está reservado o bloqueado.');

        $this->book('10:00', 60, User::factory()->create());
    }

    public function test_partially_overlapping_booking_is_rejected(): void
    {
        $this->book('10:00', 120);

        $this->expectException(BookingException::class);

        $this->book('11:00');
    }

    public function test_overlap_is_detected_by_the_database_and_not_only_the_ui(): void
    {
        // A booking inserted behind the service's back must still be seen by the next attempt.
        Booking::create([
            'code' => 'BK-INSERT',
            'user_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'starts_at' => '2026-03-11 10:00:00',
            'ends_at' => '2026-03-11 11:00:00',
            'duration_minutes' => 60,
            'price_cents' => 2_000_000,
            'status' => 'confirmed',
        ]);

        $this->expectException(BookingException::class);

        $this->book('10:00');
    }

    public function test_times_outside_the_schedule_are_rejected(): void
    {
        $this->expectException(BookingException::class);
        $this->expectExceptionMessage('El horario elegido está fuera del horario de atención de la cancha.');

        $this->book('23:00');
    }

    public function test_unaligned_start_times_are_rejected(): void
    {
        $this->expectException(BookingException::class);

        $this->book('10:30');
    }

    public function test_bookings_inside_the_lead_time_are_rejected(): void
    {
        $this->expectException(BookingException::class);
        $this->expectExceptionMessage('Las reservas se hacen con al menos 60 minutos de anticipación.');

        $this->book('09:30', 60, null, '2026-03-10');
    }

    public function test_bookings_beyond_the_window_are_rejected(): void
    {
        $this->expectException(BookingException::class);

        $this->book('10:00', 60, null, '2026-06-01');
    }

    public function test_inactive_court_cannot_be_booked(): void
    {
        $this->court->update(['is_active' => false]);

        $this->expectException(BookingException::class);
        $this->expectExceptionMessage('La cancha no está disponible para reservas.');

        $this->book();
    }

    public function test_price_is_frozen_in_the_booking_when_the_rate_changes(): void
    {
        $booking = $this->book();

        PricingRule::query()->where('court_id', $this->court->id)->update(['amount_cents' => 9_000_000]);

        $this->assertSame(2_000_000, $booking->fresh()->price_cents);
    }

    public function test_cancelling_frees_the_slot(): void
    {
        $booking = $this->book('10:00');
        $staff = User::factory()->receptionist()->create();

        BookingService::make()->cancel($booking, $staff, 'Se suspendió por lluvia');

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking.cancelled', 'subject_id' => $booking->id]);

        $again = $this->book('10:00', 60, User::factory()->create());
        $this->assertSame(BookingStatus::Confirmed, $again->status);
    }

    public function test_customer_can_cancel_inside_the_policy(): void
    {
        $booking = $this->book('10:00', 60, null, '2026-03-12');

        BookingService::make()->cancel($booking, $this->customer);

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
    }

    public function test_customer_cannot_cancel_after_the_deadline(): void
    {
        // 24 hour policy, booking today at 20:00, now 2026-03-10 09:00.
        $booking = $this->book('20:00', 60, null, '2026-03-10');

        $this->expectException(BookingException::class);
        $this->expectExceptionMessage('Las cancelaciones se aceptan hasta 24 horas antes del turno. Contactá al establecimiento.');

        BookingService::make()->cancel($booking, $this->customer);
    }

    public function test_staff_can_cancel_after_the_deadline(): void
    {
        $booking = $this->book('10:00');
        $admin = User::factory()->admin()->create();

        BookingService::make()->cancel($booking, $admin, 'Cliente avisó por teléfono');

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
    }

    public function test_cancelled_bookings_cannot_be_cancelled_again(): void
    {
        $booking = $this->book();
        $staff = User::factory()->receptionist()->create();
        BookingService::make()->cancel($booking, $staff);

        $this->expectException(BookingException::class);

        BookingService::make()->cancel($booking->fresh(), $staff);
    }

    public function test_reschedule_revalidates_availability(): void
    {
        $first = $this->book('10:00');
        $this->book('12:00', 60, User::factory()->create());
        $staff = User::factory()->receptionist()->create();

        BookingService::make()->reschedule($first, $this->court, $this->at('14:00'), 60, $staff);

        $this->assertSame('14:00', $first->fresh()->starts_at->format('H:i'));
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking.rescheduled', 'subject_id' => $first->id]);

        $this->expectException(BookingException::class);
        BookingService::make()->reschedule($first->fresh(), $this->court, $this->at('12:00'), 60, $staff);
    }

    public function test_pending_booking_can_be_confirmed(): void
    {
        EstablishmentSetting::current()->update(['auto_confirm' => false]);
        $booking = $this->book();
        $staff = User::factory()->receptionist()->create();

        BookingService::make()->confirm($booking, $staff);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking.confirmed', 'subject_id' => $booking->id]);
    }

    public function test_closing_a_booking_records_the_final_status(): void
    {
        $booking = $this->book();
        $staff = User::factory()->receptionist()->create();

        BookingService::make()->close($booking, $staff, BookingStatus::NoShow);

        $this->assertSame(BookingStatus::NoShow, $booking->fresh()->status);
    }

    public function test_settings_are_needed_only_once_per_installation(): void
    {
        $first = EstablishmentSetting::current();
        $second = EstablishmentSetting::current();

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, EstablishmentSetting::query()->count());
    }

    public function test_audit_log_keeps_the_former_status_of_a_cancellation(): void
    {
        $booking = $this->book();
        BookingService::make()->cancel($booking, User::factory()->admin()->create());

        $log = AuditLog::query()->where('action', 'booking.cancelled')->firstOrFail();

        $this->assertSame('confirmed', $log->meta['from']);
    }
}
