<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = CarbonImmutable::now()->startOfDay();
        $tomorrow = $today->addDay();

        $todayBookings = Booking::query()
            ->with('court:id,name', 'user:id,name')
            ->where('starts_at', '>=', $today)
            ->where('starts_at', '<', $tomorrow)
            ->whereNot('status', BookingStatus::Cancelled)
            ->orderBy('starts_at')
            ->get();

        $courts = Court::query()->active()->count();

        return Inertia::render('Admin/Dashboard', [
            'today' => $today->toDateString(),
            'bookings' => $todayBookings->map(fn (Booking $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'starts_at' => $b->starts_at->toIso8601String(),
                'court' => $b->court->name,
                'customer' => $b->user->name,
                'status' => $b->status->value,
                'price_cents' => $b->price_cents,
            ])->values(),
            'stats' => [
                'bookings_today' => $todayBookings->count(),
                'pending' => Booking::query()->where('status', BookingStatus::Pending)->count(),
                'courts_active' => $courts,
                'customers' => User::query()->where('role', 'customer')->count(),
            ],
        ]);
    }
}
