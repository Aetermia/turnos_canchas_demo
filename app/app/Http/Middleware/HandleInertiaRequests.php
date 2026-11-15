<?php

namespace App\Http\Middleware;

use App\Models\EstablishmentSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /**
     * Only what every page needs: the viewer, one flash message and the brand skin.
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role->value,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'brand' => fn () => $this->brand(),
        ];
    }

    private function brand(): array
    {
        $settings = EstablishmentSetting::current();

        return [
            'name' => $settings->name,
            'accent' => $settings->accent_color,
            'logo' => $settings->logo_path,
        ];
    }
}
