<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Exceptions\BookingException;
use App\Models\Booking;
use App\Models\Court;
use App\Models\EstablishmentSetting;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function create(Request $request, AvailabilityService $availability): Response
    {
        $settings = EstablishmentSetting::current();
        $courts = Court::query()->active()->orderBy('sort_order')->orderBy('name')->get();

        $court = $courts->firstWhere('id', (int) $request->integer('court')) ?? $courts->first();
        $date = $this->requestedDate($request);

        return Inertia::render('Booking/Create', [
            'courts' => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'sport' => $court->sport,
                'surface' => $court->surface,
                'slot_minutes' => $court->slot_minutes,
            ])->values(),
            'selected_court' => $court?->id,
            'date' => $date,
            'slots' => $court ? $availability->slots($court, CarbonImmutable::parse($date)) : [],
            // The board sends the slot the visitor clicked, so they land on it.
            'preselected_start' => $this->preselectedStart($request, $court, $date),
            'days' => $this->nextDays($settings->max_advance_days),
            'max_advance_days' => $settings->max_advance_days,
            'min_advance_minutes' => $settings->min_advance_minutes,
            'cancellation_hours' => $settings->cancellation_hours,
            'auto_confirm' => $settings->auto_confirm,
        ]);
    }

    public function store(Request $request, BookingService $bookings): RedirectResponse
    {
        $data = $request->validate([
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'starts_at' => ['required', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $court = Court::query()->findOrFail($data['court_id']);

        try {
            $booking = $bookings->create(
                $court,
                $request->user(),
                CarbonImmutable::parse($data['starts_at']),
                (int) $data['duration_minutes'],
                $request->user(),
                $data['notes'] ?? null,
            );
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        $message = $booking->status === BookingStatus::Confirmed
            ? 'Reserva confirmada. Te esperamos.'
            : 'Reserva recibida. El establecimiento la confirma a la brevedad.';

        return redirect()->route('bookings.mine')->with('success', $message);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $bookings = Booking::query()
            ->with('court:id,name,sport')
            ->where('user_id', $user->id)
            ->orderByDesc('starts_at')
            ->get();

        return Inertia::render('Booking/Mine', [
            'upcoming' => $bookings
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed])
                ->filter(fn (Booking $b) => $b->ends_at->isFuture())
                ->sortBy('starts_at')
                ->values()
                ->map(fn (Booking $b) => $this->row($b)),
            'history' => $bookings
                ->reject(fn (Booking $b) => $b->ends_at->isFuture() && $b->status->isActive())
                ->values()
                ->map(fn (Booking $b) => $this->row($b)),
            'cancellation_hours' => EstablishmentSetting::current()->cancellation_hours,
        ]);
    }

    public function cancel(Request $request, Booking $booking, BookingService $bookings): RedirectResponse
    {
        Gate::authorize('cancel', $booking);

        try {
            $bookings->cancel($booking, $request->user(), $request->string('reason')->value() ?: null);
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'La reserva quedó cancelada y el horario se liberó.');
    }

    /**
     * "HH:mm" as clicked on the public board, resolved to this court and day.
     */
    private function preselectedStart(Request $request, ?Court $court, string $date): ?string
    {
        $start = $request->query('start');

        if ($court === null || ! is_string($start) || preg_match('/^\d{2}:\d{2}$/', $start) !== 1) {
            return null;
        }

        return CarbonImmutable::parse($date.' '.$start.':00')->toIso8601String();
    }

    private function requestedDate(Request $request): string
    {
        $date = $request->string('date')->value();
        $today = CarbonImmutable::now()->startOfDay();

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $today->toDateString();
        }

        $parsed = CarbonImmutable::parse($date)->startOfDay();
        $max = $today->addDays(EstablishmentSetting::current()->max_advance_days);

        return $parsed->lessThan($today) || $parsed->greaterThan($max)
            ? $today->toDateString()
            : $parsed->toDateString();
    }

    private function nextDays(int $maxAdvanceDays): array
    {
        $today = CarbonImmutable::now()->startOfDay();
        $days = [];

        for ($i = 0; $i <= min($maxAdvanceDays, 13); $i++) {
            $day = $today->addDays($i);
            $days[] = [
                'date' => $day->toDateString(),
                'label' => $day->isoFormat('ddd D'),
            ];
        }

        return $days;
    }

    private function row(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'code' => $booking->code,
            'starts_at' => $booking->starts_at->toIso8601String(),
            'ends_at' => $booking->ends_at->toIso8601String(),
            'status' => $booking->status->value,
            'price_cents' => $booking->price_cents,
            'court' => [
                'id' => $booking->court->id,
                'name' => $booking->court->name,
                'sport' => $booking->court->sport,
            ],
            'can_cancel' => $booking->status->isActive() && $booking->canBeCancelledByCustomer(),
        ];
    }
}
