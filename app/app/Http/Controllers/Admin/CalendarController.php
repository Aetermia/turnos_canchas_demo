<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\BlockedPeriod;
use App\Models\Booking;
use App\Models\Court;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Day view: one column per court. Week view: one column per day for a single court.
 * Both share the same vertical time axis so the grid component is reused.
 */
class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $view = $request->string('view')->value() === 'week' ? 'week' : 'day';
        $date = $this->date($request);
        $courts = Court::query()->orderBy('sort_order')->orderBy('name')->get();
        $courtId = (int) $request->integer('court') ?: $courts->first()?->id;

        [$from, $to] = $view === 'day'
            ? [$date, $date->addDay()]
            : [$date->startOfWeek(CarbonImmutable::MONDAY), $date->startOfWeek(CarbonImmutable::MONDAY)->addWeek()];

        $bookings = Booking::query()
            ->with('court:id,name', 'user:id,name,phone')
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from)
            ->whereNot('status', BookingStatus::Cancelled)
            ->orderBy('starts_at')
            ->get();

        $blocks = BlockedPeriod::query()
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from)
            ->get();

        $items = $bookings->map(fn (Booking $booking) => [
            'kind' => 'booking',
            'id' => $booking->id,
            'column' => $view === 'day' ? (string) $booking->court_id : $booking->starts_at->toDateString(),
            'starts_at' => $booking->starts_at->toIso8601String(),
            'ends_at' => $booking->ends_at->toIso8601String(),
            'status' => $booking->status->value,
            'title' => $booking->user->name,
            'subtitle' => $booking->court->name.' · '.$booking->code,
            'price_cents' => $booking->price_cents,
            'phone' => $booking->user->phone,
        ])->concat($blocks->map(fn (BlockedPeriod $block) => [
            'kind' => 'block',
            'id' => $block->id,
            'column' => $block->court_id === null ? null : ($view === 'day' ? (string) $block->court_id : $block->starts_at->toDateString()),
            'starts_at' => $block->starts_at->toIso8601String(),
            'ends_at' => $block->ends_at->toIso8601String(),
            'status' => 'blocked',
            'title' => $block->reason,
            'subtitle' => $block->court_id === null ? 'Todo el establecimiento' : 'Bloqueo',
            'price_cents' => null,
            'phone' => null,
        ]))->values();

        $columns = $view === 'day'
            ? $courts->map(fn (Court $court) => [
                'key' => (string) $court->id,
                'label' => $court->name,
                'hint' => $court->sport,
            ])->values()
            : collect(range(0, 6))->map(function (int $offset) use ($date) {
                $day = $date->startOfWeek(CarbonImmutable::MONDAY)->addDays($offset);

                return [
                    'key' => $day->toDateString(),
                    'label' => $day->isoFormat('ddd D'),
                    'hint' => $day->isoFormat('MMM'),
                ];
            })->values();

        return Inertia::render('Admin/Calendar', [
            'view' => $view,
            'date' => $date->toDateString(),
            'courts' => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'is_active' => $court->is_active,
            ])->values(),
            'selected_court' => $courtId,
            'columns' => $columns,
            'items' => $items,
            'axis' => $this->axis($courts, $view, $courtId),
        ]);
    }

    private function date(Request $request): CarbonImmutable
    {
        $value = $request->string('date')->value();

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)
            ? CarbonImmutable::parse($value)->startOfDay()
            : CarbonImmutable::now()->startOfDay();
    }

    /**
     * Grid bounds come from the schedules in play, so a club open 09:00 to 01:00
     * still renders its real hours.
     */
    private function axis($courts, string $view, int $courtId): array
    {
        $relevant = $view === 'day'
            ? $courts
            : $courts->where('id', $courtId);

        $opens = $relevant->flatMap(fn (Court $court) => $court->schedules()->where('is_open', true)->pluck('opens_at'));
        $closes = $relevant->flatMap(fn (Court $court) => $court->schedules()->where('is_open', true)->pluck('closes_at'));

        $start = $opens->min() ? substr($opens->min(), 0, 5) : '08:00';
        $end = $closes->max() ? substr($closes->max(), 0, 5) : '23:00';

        if ($end <= $start) {
            $end = '23:59';
        }

        return ['start' => $start, 'end' => $end];
    }
}
