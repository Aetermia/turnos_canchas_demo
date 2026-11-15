<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Carbon::setLocale('es');
        CarbonImmutable::setLocale('es');

        // Admins have full access by definition; the policies describe everyone else.
        Gate::before(fn (User $user) => $user->isAdmin() ? true : null);

        PasswordRule::defaults(fn () => PasswordRule::min(8));

        Vite::useAggressivePrefetching();
    }
}
