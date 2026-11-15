<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\EstablishmentSetting;
use App\Services\AvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    public function home(AvailabilityService $availability): Response
    {
        $settings = EstablishmentSetting::current();
        $courts = Court::query()
            ->active()
            ->with('schedules', 'pricingRules')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $today = CarbonImmutable::now();

        return Inertia::render('Home', [
            'today' => $today->toIso8601String(),
            'contact' => [
                'phone' => $settings->phone,
                'whatsapp' => $settings->whatsapp,
                'email' => $settings->email,
                'address' => $settings->address,
                'city' => $settings->city,
                'maps_url' => $settings->maps_url,
                'tagline' => $settings->tagline,
                'about' => $settings->about,
            ],
            'policies' => [
                'cancellation_hours' => $settings->cancellation_hours,
                'max_advance_days' => $settings->max_advance_days,
                'auto_confirm' => $settings->auto_confirm,
            ],
            'courts' => $this->courts($courts, $availability, $today),
        ]);
    }

    private function courts(Collection $courts, AvailabilityService $availability, CarbonImmutable $today): array
    {
        return $courts->map(function (Court $court) use ($availability, $today) {
            $slots = collect($availability->slots($court, $today))->where('available', true);

            return [
                'id' => $court->id,
                'name' => $court->name,
                'slug' => $court->slug,
                'sport' => $court->sport,
                'surface' => $court->surface,
                'description' => $court->description,
                'slot_minutes' => $court->slot_minutes,
                'price_from_cents' => $court->pricingRules->min('amount_cents'),
                'schedule' => $this->scheduleSummary($court),
                'next_free' => $slots->first()['start'] ?? null,
                'free_today' => $slots->count(),
                'rates' => $court->pricingRules
                    ->sortBy([['weekday', 'asc'], ['starts_at', 'asc']])
                    ->map(fn ($rule) => [
                        'weekday' => $rule->weekday,
                        'starts_at' => $rule->starts_at,
                        'ends_at' => $rule->ends_at,
                        'amount_cents' => $rule->amount_cents,
                    ])->values(),
            ];
        })->values()->all();
    }

    /**
     * "Lun a vie 08:00 a 18:00 · Sáb y dom 09:00 a 23:00", built from real schedules.
     */
    private function scheduleSummary(Court $court): string
    {
        $names = [1 => 'Lun', 2 => 'Mar', 3 => 'Mié', 4 => 'Jue', 5 => 'Vie', 6 => 'Sáb', 7 => 'Dom'];
        $groups = [];

        foreach ($court->schedules->sortBy('weekday') as $schedule) {
            if (! $schedule->is_open) {
                continue;
            }

            $band = substr($schedule->opens_at, 0, 5).' a '.substr($schedule->closes_at, 0, 5);
            $groups[$band][] = $schedule->weekday;
        }

        if ($groups === []) {
            return 'Sin horarios cargados';
        }

        $parts = [];

        foreach ($groups as $band => $weekdays) {
            $parts[] = $this->dayRange($weekdays, $names).' de '.$band;
        }

        return implode(' · ', $parts);
    }

    private function dayRange(array $weekdays, array $names): string
    {
        sort($weekdays);
        $labels = array_map(fn (int $day) => $names[$day], $weekdays);

        if (count($labels) === 7) {
            return 'Todos los días';
        }

        $consecutive = count($weekdays) > 2 && $weekdays === range($weekdays[0], $weekdays[0] + count($weekdays) - 1);

        if ($consecutive) {
            return $labels[0].' a '.end($labels);
        }

        $last = array_pop($labels);

        return $labels === [] ? $last : implode(', ', $labels).' y '.$last;
    }
}
