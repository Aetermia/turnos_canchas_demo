<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

/**
 * Admins bypass every policy through Gate::before in AppServiceProvider.
 * What is written here is what a receptionist or a customer may do.
 */
class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        // Customers see their own list; staff see all of it.
        return true;
    }

    public function view(User $user, Booking $booking): bool
    {
        return $user->isStaff() || $booking->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function reschedule(User $user, Booking $booking): bool
    {
        return $user->isStaff();
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $user->isStaff() || $booking->user_id === $user->id;
    }

    public function confirm(User $user, Booking $booking): bool
    {
        return $user->isStaff();
    }

    public function close(User $user, Booking $booking): bool
    {
        return $user->isStaff();
    }
}
