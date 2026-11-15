<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(AvailabilityService $availability): Response
    {
        $today = CarbonImmutable::now()->startOfDay();
        $tomorrow = $today->addDay();

        $todayBookings = Booking::query()
            ->with('court:id,name', 'user:id,name,phone')
            ->where('starts_at', '>=', $today)
            ->where('starts_at', '<', $tomorrow)
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed, BookingStatus::Completed])
            ->orderBy('starts_at')
            ->get();

        $next = Booking::query()
            ->with('court:id,name', 'user:id,name')
            ->where('starts_at', '>=', now())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed])
            ->orderBy('starts_at')
            ->limit(6)
            ->get();

        $courts = Court::query()->active()->with('schedules')->get();
        $occupancy = $courts->map(function (Court $court) use ($availability, $today) {
            $slots = collect($availability->slots($court, $today));
            $total = $slots->count() + $slots->where('reason', 'Ocupado')->count();

            return [
                'name' => $court->name,
                'booked' => $slots->where('reason', 'Ocupado')->count(),
                'total' => $total,
            ];
        })->values();

        $bookedSlots = $occupancy->sum('booked');
        $totalSlots = $occupancy->sum('total');

        return Inertia::render('Admin/Dashboard', [
            'today' => $today->toIso8601String(),
            'stats' => [
                'bookings_today' => $todayBookings->count(),
                'revenue_today_cents' => $todayBookings->where('status', '!=', BookingStatus::Cancelled)->sum('price_cents'),
                'pending' => Booking::query()->where('status', BookingStatus::Pending)->count(),
                'courts_active' => $courts->count(),
                'courts_total' => Court::query()->count(),
                'customers' => User::query()->where('role', 'customer')->count(),
                'occupancy' => $totalSlots > 0 ? (int) round($bookedSlots / $totalSlots * 100) : 0,
            ],
            'occupancy_by_court' => $occupancy,
            'today_bookings' => $todayBookings->map(fn (Booking $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'starts_at' => $b->starts_at->toIso8601String(),
                'ends_at' => $b->ends_at->toIso8601String(),
                'court' => $b->court->name,
                'customer' => $b->user->name,
                'phone' => $b->user->phone,
                'status' => $b->status->value,
                'price_cents' => $b->price_cents,
            ])->values(),
            'next_bookings' => $next->map(fn (Booking $b) => [
                'id' => $b->id,
                'starts_at' => $b->starts_at->toIso8601String(),
                'court' => $b->court->name,
                'customer' => $b->user->name,
                'status' => $b->status->value,
            ])->values(),
        ]);
    }
}
