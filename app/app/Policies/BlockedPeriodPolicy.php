<?php

namespace App\Policies;

use App\Models\BlockedPeriod;
use App\Models\User;

class BlockedPeriodPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    public function delete(User $user, BlockedPeriod $blockedPeriod): bool
    {
        return $user->isStaff();
    }
}
