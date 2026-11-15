<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\EstablishmentSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        Gate::authorize('manage', EstablishmentSetting::class);

        $settings = EstablishmentSetting::current();

        return Inertia::render('Admin/Settings/Edit', [
            'settings' => [
                'name' => $settings->name,
                'tagline' => $settings->tagline,
                'about' => $settings->about,
                'accent_color' => $settings->accent_color,
                'phone' => $settings->phone,
                'whatsapp' => $settings->whatsapp,
                'email' => $settings->email,
                'address' => $settings->address,
                'city' => $settings->city,
                'maps_url' => $settings->maps_url,
                'auto_confirm' => $settings->auto_confirm,
                'pending_blocks_slot' => $settings->pending_blocks_slot,
                'min_advance_minutes' => $settings->min_advance_minutes,
                'max_advance_days' => $settings->max_advance_days,
                'cancellation_hours' => $settings->cancellation_hours,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage', EstablishmentSetting::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:160'],
            'about' => ['nullable', 'string', 'max:600'],
            'accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'phone' => ['nullable', 'string', 'max:30'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:190'],
            'address' => ['nullable', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:80'],
            'maps_url' => ['nullable', 'url', 'max:255'],
            'auto_confirm' => ['required', 'boolean'],
            'pending_blocks_slot' => ['required', 'boolean'],
            'min_advance_minutes' => ['required', 'integer', 'min:0', 'max:10080'],
            'max_advance_days' => ['required', 'integer', 'min:1', 'max:365'],
            'cancellation_hours' => ['required', 'integer', 'min:0', 'max:720'],
        ]);

        $settings = EstablishmentSetting::current();
        $settings->update($data);

        AuditLog::record('settings.updated', $settings, $request->user(), [
            'name' => $settings->name,
            'auto_confirm' => $settings->auto_confirm,
        ]);

        return back()->with('success', 'Configuración guardada. Los cambios se ven en el sitio al instante.');
    }
}
