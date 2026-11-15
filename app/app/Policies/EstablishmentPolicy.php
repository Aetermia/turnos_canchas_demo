<?php

namespace App\Policies;

use App\Models\User;

/**
 * Establishment configuration, courts and staff management are admin only.
 * Admins bypass this policy; everyone else is refused here.
 */
class EstablishmentPolicy
{
    public function manage(User $user): bool
    {
        return false;
    }
}
