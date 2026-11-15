<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Exceptions\BookingException;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * All write paths for bookings go through here so availability is re-checked
 * inside a transaction while the court row is locked.
 *
 * The lock is what makes two simultaneous confirms safe: the second transaction
 * waits for the first to commit, then sees its booking and refuses the overlap.
 * Requires InnoDB (MySQL). SQLite ignores row locks, which is why the concurrency
 * guarantee is verified on MySQL and only the rules are verified locally.
 */
class BookingService
{
    public function __construct(private readonly AvailabilityService $availability) {}

    public static function make(): self
    {
        return new self(AvailabilityService::make());
    }

    public function create(
        Court $court,
        User $customer,
        CarbonImmutable $start,
        int $durationMinutes,
        ?User $actor = null,
        ?string $notes = null,
    ): Booking {
        return DB::transaction(function () use ($court, $customer, $start, $durationMinutes, $actor, $notes) {
            $court = $this->lockCourt($court);
            $this->assertBookable($court, $start, $durationMinutes);

            $price = $this->availability->priceFor($court, $start, $durationMinutes);
            $status = $this->availability->settings()->auto_confirm
                ? BookingStatus::Confirmed
                : BookingStatus::Pending;

            $booking = Booking::create([
                'code' => Booking::generateCode(),
                'user_id' => $customer->id,
                'court_id' => $court->id,
                'created_by' => $actor?->id,
                'starts_at' => $start,
                'ends_at' => $start->addMinutes($durationMinutes),
                'duration_minutes' => $durationMinutes,
                'price_cents' => $price,
                'status' => $status,
                'notes' => $notes,
                'confirmed_at' => $status === BookingStatus::Confirmed ? now() : null,
            ]);

            AuditLog::record('booking.created', $booking, $actor ?? $customer, [
                'status' => $status->value,
                'price_cents' => $price,
                'court' => $court->name,
            ]);

            return $booking;
        }, 3);
    }

    public function reschedule(Booking $booking, Court $court, CarbonImmutable $start, int $durationMinutes, User $actor): Booking
    {
        return DB::transaction(function () use ($booking, $court, $start, $durationMinutes, $actor) {
            $court = $this->lockCourt($court);
            $booking = Booking::query()->whereKey($booking->getKey())->lockForUpdate()->firstOrFail();

            if (! $booking->status->isActive()) {
                throw new BookingException('Solo se pueden reprogramar reservas activas.');
            }

            $this->assertBookable($court, $start, $durationMinutes, $booking->id);

            $price = $this->availability->priceFor($court, $start, $durationMinutes);
            $previous = $booking->only(['starts_at', 'ends_at', 'duration_minutes', 'price_cents', 'court_id']);

            $booking->update([
                'court_id' => $court->id,
                'starts_at' => $start,
                'ends_at' => $start->addMinutes($durationMinutes),
                'duration_minutes' => $durationMinutes,
                'price_cents' => $price,
            ]);

            AuditLog::record('booking.rescheduled', $booking, $actor, ['from' => $previous, 'to' => $start->format('Y-m-d H:i')]);

            return $booking;
        }, 3);
    }

    public function cancel(Booking $booking, User $actor, ?string $reason = null): Booking
    {
        return DB::transaction(function () use ($booking, $actor, $reason) {
            $booking = Booking::query()->whereKey($booking->getKey())->lockForUpdate()->firstOrFail();
            $previous = $booking->status;

            if (! $previous->isActive()) {
                throw new BookingException('Esta reserva ya no se puede cancelar.');
            }

            if (! $actor->isStaff() && ! $booking->canBeCancelledByCustomer()) {
                $hours = $this->availability->settings()->cancellation_hours;

                throw new BookingException("Las cancelaciones se aceptan hasta {$hours} horas antes del turno. Contactá al establecimiento.");
            }

            $booking->update([
                'status' => BookingStatus::Cancelled,
                'cancelled_at' => now(),
                'cancelled_by' => $actor->id,
                'cancellation_reason' => $reason,
            ]);

            AuditLog::record('booking.cancelled', $booking, $actor, [
                'from' => $previous->value,
                'reason' => $reason,
            ]);

            return $booking;
        }, 3);
    }

    public function confirm(Booking $booking, User $actor): Booking
    {
        return DB::transaction(function () use ($booking, $actor) {
            $booking = Booking::query()->whereKey($booking->getKey())->lockForUpdate()->firstOrFail();

            if ($booking->status !== BookingStatus::Pending) {
                throw new BookingException('Solo las reservas pendientes se pueden confirmar.');
            }

            // The slot may have been taken by a manual booking while this one waited.
            $court = $this->lockCourt($booking->court);
            $this->assertBookable($court, CarbonImmutable::parse($booking->starts_at), $booking->duration_minutes, $booking->id);

            $booking->update([
                'status' => BookingStatus::Confirmed,
                'confirmed_at' => now(),
            ]);

            AuditLog::record('booking.confirmed', $booking, $actor);

            return $booking;
        }, 3);
    }

    public function close(Booking $booking, User $actor, BookingStatus $status): Booking
    {
        if (! in_array($status, [BookingStatus::Completed, BookingStatus::NoShow], true)) {
            throw new BookingException('Estado final inválido.');
        }

        return DB::transaction(function () use ($booking, $actor, $status) {
            $booking = Booking::query()->whereKey($booking->getKey())->lockForUpdate()->firstOrFail();

            if (! $booking->status->isActive()) {
                throw new BookingException('Solo se pueden cerrar reservas activas.');
            }

            $booking->update(['status' => $status]);

            AuditLog::record('booking.status_changed', $booking, $actor, ['to' => $status->value]);

            return $booking;
        }, 3);
    }

    private function lockCourt(Court $court): Court
    {
        $locked = Court::query()->whereKey($court->getKey())->lockForUpdate()->first();

        if ($locked === null) {
            throw new BookingException('La cancha ya no existe.');
        }

        return $locked->load('schedules', 'pricingRules');
    }

    private function assertBookable(Court $court, CarbonImmutable $start, int $durationMinutes, ?int $ignoreBookingId = null): void
    {
        $settings = $this->availability->settings();

        if (! $court->is_active) {
            throw new BookingException('La cancha no está disponible para reservas.');
        }

        $earliest = CarbonImmutable::now()->addMinutes($settings->min_advance_minutes);

        if ($start->lessThan($earliest)) {
            $minutes = $settings->min_advance_minutes;

            throw new BookingException("Las reservas se hacen con al menos {$minutes} minutos de anticipación.");
        }

        if ($this->availability->exceedsMaxAdvance($start)) {
            throw new BookingException("Solo se puede reservar hasta {$settings->max_advance_days} días de anticipación.");
        }

        if (! $this->availability->isWithinSchedule($court, $start, $durationMinutes)) {
            throw new BookingException('El horario elegido está fuera del horario de atención de la cancha.');
        }

        $window = $this->availability->openingWindow($court, $start);
        $offset = (int) $window[0]->diffInMinutes($start);

        if ($offset % $court->slot_minutes !== 0) {
            throw new BookingException("Los turnos empiezan cada {$court->slot_minutes} minutos.");
        }

        $conflict = $this->availability->conflict($court, $start, $start->addMinutes($durationMinutes), $ignoreBookingId);

        if ($conflict !== null) {
            throw new BookingException($conflict);
        }
    }
}
