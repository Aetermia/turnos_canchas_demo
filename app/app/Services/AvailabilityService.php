<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Exceptions\BookingException;
use App\Models\BlockedPeriod;
use App\Models\Booking;
use App\Models\Court;
use App\Models\EstablishmentSetting;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * The single source of truth for "what can be booked, and for how much".
 * Everything here reads configuration; nothing trusts client input.
 */
class AvailabilityService
{
    public function __construct(private readonly EstablishmentSetting $settings) {}

    public static function make(): self
    {
        return new self(EstablishmentSetting::current());
    }

    public function settings(): EstablishmentSetting
    {
        return $this->settings;
    }

    /**
     * Bookable start times for one court on one day, already priced.
     *
     * @return array<int, array{start: string, end: string, price_cents: int|null, available: bool, reason: string|null}>
     */
    public function slots(Court $court, CarbonImmutable $day): array
    {
        if (! $court->is_active) {
            return [];
        }

        $day = $day->startOfDay();
        $window = $this->openingWindow($court, $day);

        if ($window === null) {
            return [];
        }

        [$opensAt, $closesAt] = $window;
        $step = $court->slot_minutes;
        $duration = $step;

        if ($this->exceedsMaxAdvance($day)) {
            return [];
        }

        $from = $day;
        $to = $day->addDay();

        $busy = $this->busyBookings($court, $from, $to);
        $blocks = $this->blocksIn($court, $from, $to);
        $earliest = CarbonImmutable::now()->addMinutes($this->settings->min_advance_minutes);

        $slots = [];

        for ($start = $opensAt; $start->addMinutes($duration)->lessThanOrEqualTo($closesAt); $start = $start->addMinutes($step)) {
            $end = $start->addMinutes($duration);
            $price = null;
            $reason = null;

            try {
                $price = $this->priceFor($court, $start, $duration);
            } catch (BookingException $e) {
                $reason = $e->getMessage();
            }

            if ($reason === null) {
                $reason = match (true) {
                    $start->lessThan($earliest) => 'Fuera del plazo de reserva',
                    $this->hasConflict($court, $start, $end, null, $busy, $blocks) => 'Ocupado',
                    default => null,
                };
            }

            if ($start->lessThan($earliest)) {
                continue;
            }

            $slots[] = [
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
                'price_cents' => $price,
                'available' => $reason === null,
                'reason' => $reason,
            ];
        }

        return $slots;
    }

    /**
     * Opening window for a court on a day, or null when closed that weekday.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}|null
     */
    public function openingWindow(Court $court, CarbonImmutable $day): ?array
    {
        $schedule = $court->schedules->firstWhere('weekday', $day->isoWeekday());

        if (! $schedule || ! $schedule->is_open) {
            return null;
        }

        $opensAt = $day->startOfDay()->setTimeFromTimeString($schedule->opens_at);
        $closesAt = $day->startOfDay()->setTimeFromTimeString($schedule->closes_at);

        // Overnight windows are rejected in the admin form, so a closed window means misconfiguration.
        if ($closesAt->lessThanOrEqualTo($opensAt)) {
            return null;
        }

        return [$opensAt, $closesAt];
    }

    /**
     * Sum of the unit prices covered by the booking. A unit is one court slot,
     * so a 120 minute reservation on a 60 minute court costs two units.
     */
    public function priceFor(Court $court, CarbonImmutable $start, int $durationMinutes): int
    {
        $step = $court->slot_minutes;

        if ($durationMinutes < $step || $durationMinutes % $step !== 0) {
            throw new BookingException("La duración debe ser múltiplo de {$step} minutos.");
        }

        $total = 0;

        for ($offset = 0; $offset < $durationMinutes; $offset += $step) {
            $total += $this->unitPrice($court, $start->addMinutes($offset));
        }

        return $total;
    }

    private function unitPrice(Court $court, CarbonImmutable $unitStart): int
    {
        $weekday = $unitStart->isoWeekday();
        $time = $unitStart->format('H:i:s');

        $matching = $court->pricingRules
            ->filter(fn ($rule) => $rule->starts_at <= $time && $rule->ends_at > $time);

        // A rule for this weekday beats the generic "all week" rule.
        $rule = $matching->firstWhere('weekday', $weekday)
            ?? $matching->first(fn ($r) => $r->weekday === null);

        if ($rule === null) {
            throw new BookingException('La cancha no tiene tarifa configurada para ese horario.');
        }

        return $rule->amount_cents;
    }

    public function exceedsMaxAdvance(CarbonImmutable $date): bool
    {
        return $date->startOfDay()->greaterThan(
            CarbonImmutable::now()->startOfDay()->addDays($this->settings->max_advance_days)
        );
    }

    public function isWithinSchedule(Court $court, CarbonImmutable $start, int $durationMinutes): bool
    {
        $window = $this->openingWindow($court, $start);

        if ($window === null) {
            return false;
        }

        [$opensAt, $closesAt] = $window;

        return $start->greaterThanOrEqualTo($opensAt)
            && $start->addMinutes($durationMinutes)->lessThanOrEqualTo($closesAt);
    }

    /**
     * Returns a human readable reason when the window cannot be booked, or null when it is free.
     */
    public function conflict(Court $court, CarbonImmutable $start, CarbonImmutable $end, ?int $ignoreBookingId = null): ?string
    {
        $busy = $this->busyBookings($court, $start, $end, $ignoreBookingId);
        $blocks = $this->blocksIn($court, $start, $end);

        if ($this->hasConflict($court, $start, $end, $ignoreBookingId, $busy, $blocks)) {
            return 'Ese horario ya está reservado o bloqueado.';
        }

        return null;
    }

    /**
     * @param  Collection<int, Booking>  $busy
     * @param  Collection<int, BlockedPeriod>  $blocks
     */
    private function hasConflict(
        Court $court,
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $ignoreBookingId,
        Collection $busy,
        Collection $blocks,
    ): bool {
        $buffer = $court->buffer_minutes;

        foreach ($busy as $booking) {
            if ($ignoreBookingId !== null && $booking->id === $ignoreBookingId) {
                continue;
            }

            if ($start->lessThan($booking->ends_at->addMinutes($buffer))
                && $end->addMinutes($buffer)->greaterThan($booking->starts_at)) {
                return true;
            }
        }

        foreach ($blocks as $block) {
            if ($start->lessThan($block->ends_at) && $end->greaterThan($block->starts_at)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return Collection<int, Booking>
     */
    private function busyBookings(Court $court, CarbonImmutable $from, CarbonImmutable $to, ?int $ignoreBookingId = null): Collection
    {
        return Booking::query()
            ->overlapping($court->id, $from->format('Y-m-d H:i:s'), $to->addMinutes($court->buffer_minutes)->format('Y-m-d H:i:s'))
            ->occupying($this->settings->pending_blocks_slot)
            ->when($ignoreBookingId, fn ($q) => $q->whereKeyNot($ignoreBookingId))
            ->get();
    }

    /**
     * @return Collection<int, BlockedPeriod>
     */
    private function blocksIn(Court $court, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return BlockedPeriod::query()
            ->overlapping($court->id, $from->format('Y-m-d H:i:s'), $to->format('Y-m-d H:i:s'))
            ->get();
    }

    /** Status labels used by the calendar and lists, in one place. */
    public static function statusColors(): array
    {
        return [
            BookingStatus::Pending->value => 'amber',
            BookingStatus::Confirmed->value => 'green',
            BookingStatus::Cancelled->value => 'red',
            BookingStatus::Completed->value => 'slate',
            BookingStatus::NoShow->value => 'zinc',
        ];
    }
}
