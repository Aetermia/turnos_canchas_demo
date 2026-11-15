<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Exceptions\BookingException;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
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
    public function index(Request $request): Response
    {
        $filters = [
            'q' => trim($request->string('q')->value()),
            'court' => $request->integer('court') ?: null,
            'status' => $request->string('status')->value(),
            'date' => $request->string('date')->value(),
        ];

        $bookings = Booking::query()
            ->with('court:id,name', 'user:id,name,phone')
            ->when($filters['q'] !== '', function ($query) use ($filters) {
                $term = '%'.$filters['q'].'%';
                $query->where(fn ($q) => $q
                    ->where('code', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('phone', 'like', $term)));
            })
            ->when($filters['court'], fn ($q, $court) => $q->where('court_id', $court))
            ->when($filters['status'], fn ($q, $status) => $q->where('status', $status))
            ->when($filters['date'], function ($q, $date) {
                $q->where('starts_at', '>=', $date.' 00:00:00')->where('starts_at', '<=', $date.' 23:59:59');
            })
            ->orderByDesc('starts_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Booking $booking) => [
                'id' => $booking->id,
                'code' => $booking->code,
                'starts_at' => $booking->starts_at->toIso8601String(),
                'ends_at' => $booking->ends_at->toIso8601String(),
                'status' => $booking->status->value,
                'price_cents' => $booking->price_cents,
                'court' => $booking->court->name,
                'customer' => $booking->user->name,
                'phone' => $booking->user->phone,
            ]);

        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => $bookings,
            'filters' => $filters,
            'courts' => Court::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => collect(BookingStatus::cases())->map(fn ($status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function create(Request $request, AvailabilityService $availability): Response
    {
        $courts = Court::query()->orderBy('sort_order')->orderBy('name')->get();
        $court = $courts->firstWhere('id', (int) $request->integer('court')) ?? $courts->first();
        $date = $request->string('date')->value() ?: CarbonImmutable::now()->toDateString();

        return Inertia::render('Admin/Bookings/Create', [
            'courts' => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'sport' => $court->sport,
                'slot_minutes' => $court->slot_minutes,
            ])->values(),
            'selected_court' => $court?->id,
            'date' => $date,
            'slots' => $court ? $availability->slots($court, CarbonImmutable::parse($date)) : [],
            'customers' => $this->customerOptions($request),
            'prefill_time' => $request->string('time')->value(),
        ]);
    }

    public function store(Request $request, BookingService $bookings): RedirectResponse
    {
        $data = $request->validate([
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $court = Court::query()->findOrFail($data['court_id']);
        $customer = User::query()->findOrFail($data['user_id']);
        $start = CarbonImmutable::parse($data['date'].' '.$data['time']);

        try {
            $booking = $bookings->create($court, $customer, $start, (int) $data['duration_minutes'], $request->user(), $data['notes'] ?? null);
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }

        return redirect()->route('admin.bookings.show', $booking)->with('success', 'Reserva creada: '.$booking->code);
    }

    public function show(Booking $booking): Response
    {
        Gate::authorize('view', $booking);

        $booking->load('court', 'user', 'createdBy', 'cancelledBy');

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => [
                'id' => $booking->id,
                'code' => $booking->code,
                'starts_at' => $booking->starts_at->toIso8601String(),
                'ends_at' => $booking->ends_at->toIso8601String(),
                'duration_minutes' => $booking->duration_minutes,
                'price_cents' => $booking->price_cents,
                'status' => $booking->status->value,
                'notes' => $booking->notes,
                'cancellation_reason' => $booking->cancellation_reason,
                'court' => ['id' => $booking->court->id, 'name' => $booking->court->name, 'sport' => $booking->court->sport],
                'customer' => [
                    'id' => $booking->user->id,
                    'name' => $booking->user->name,
                    'phone' => $booking->user->phone,
                    'email' => $booking->user->email,
                ],
                'created_by' => $booking->createdBy?->name,
            ],
            'logs' => AuditLog::query()
                ->with('user:id,name')
                ->where('subject_type', Booking::class)
                ->where('subject_id', $booking->id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user' => $log->user?->name,
                    'meta' => $log->meta,
                    'created_at' => $log->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function confirm(Request $request, Booking $booking, BookingService $bookings): RedirectResponse
    {
        Gate::authorize('confirm', $booking);

        try {
            $bookings->confirm($booking, $request->user());
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Reserva confirmada.');
    }

    public function cancel(Request $request, Booking $booking, BookingService $bookings): RedirectResponse
    {
        Gate::authorize('cancel', $booking);

        try {
            $bookings->cancel($booking, $request->user(), $request->string('reason')->value() ?: null);
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Reserva cancelada y horario liberado.');
    }

    public function close(Request $request, Booking $booking, BookingService $bookings): RedirectResponse
    {
        Gate::authorize('close', $booking);

        $status = $request->string('status')->value() === BookingStatus::NoShow->value
            ? BookingStatus::NoShow
            : BookingStatus::Completed;

        try {
            $bookings->close($booking, $request->user(), $status);
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Reserva cerrada como '.$status->label().'.');
    }

    public function reschedule(Request $request, Booking $booking, BookingService $bookings): RedirectResponse
    {
        Gate::authorize('reschedule', $booking);

        $data = $request->validate([
            'court_id' => ['required', 'integer', 'exists:courts,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
        ]);

        $court = Court::query()->findOrFail($data['court_id']);

        try {
            $bookings->reschedule($booking, $court, CarbonImmutable::parse($data['date'].' '.$data['time']), (int) $data['duration_minutes'], $request->user());
        } catch (BookingException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Reserva reprogramada.');
    }

    private function customerOptions(Request $request): array
    {
        $term = trim($request->string('customer_q')->value());

        return User::query()
            ->where('role', 'customer')
            ->when($term !== '', fn ($q) => $q->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")))
            ->orderBy('name')
            ->limit(25)
            ->get(['id', 'name', 'phone', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
            ])->all();
    }
}
