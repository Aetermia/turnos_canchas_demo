<?php

namespace App\Policies;

use App\Models\Court;
use App\Models\User;

class CourtPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Court $court): bool
    {
        return ! $court->is_active ? ($user?->isStaff() ?? false) : true;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Court $court): bool
    {
        return false;
    }

    public function delete(User $user, Court $court): bool
    {
        return false;
    }
}
