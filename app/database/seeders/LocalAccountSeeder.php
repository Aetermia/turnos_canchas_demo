<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\LocalAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Throwaway accounts to look around while developing: admin/admin sees the
 * staff panel, user/user sees the customer side. They never exist outside
 * APP_ENV=local, so a production database cannot hold them by accident.
 */
class LocalAccountSeeder extends Seeder
{
    public function run(): void
    {
        if (! config('app.local_accounts')) {
            return;
        }

        $accounts = [
            ['username' => 'admin', 'name' => 'Admin local', 'role' => UserRole::Admin],
            ['username' => 'user', 'name' => 'User local', 'role' => UserRole::Customer],
        ];

        foreach ($accounts as $account) {
            User::query()->updateOrCreate(
                ['email' => LocalAccount::email($account['username'])],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['username']),
                    'role' => $account['role'],
                    'phone' => null,
                    'is_active' => true,
                ],
            );
        }
    }
}
