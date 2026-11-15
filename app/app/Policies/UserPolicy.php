<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function view(User $user, User $target): bool
    {
        return $user->isStaff() || $user->id === $target->id;
    }

    public function update(User $user, User $target): bool
    {
        return $user->isStaff();
    }

    public function delete(User $user, User $target): bool
    {
        return false;
    }
}
