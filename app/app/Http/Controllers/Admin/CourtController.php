<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Court;
use App\Models\CourtSchedule;
use App\Models\PricingRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CourtController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Court::class);

        $courts = Court::query()
            ->withCount('bookings')
            ->with('pricingRules')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Courts/Index', [
            'courts' => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'sport' => $court->sport,
                'surface' => $court->surface,
                'is_active' => $court->is_active,
                'slot_minutes' => $court->slot_minutes,
                'buffer_minutes' => $court->buffer_minutes,
                'price_from_cents' => $court->pricingRules->min('amount_cents'),
                'bookings_count' => $court->bookings_count,
            ]),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Court::class);

        return Inertia::render('Admin/Courts/Form', [
            'court' => null,
            'schedules' => $this->defaultSchedules(),
            'pricing' => [
                ['weekday' => null, 'starts_at' => '08:00', 'ends_at' => '18:00', 'amount' => 20000],
                ['weekday' => null, 'starts_at' => '18:00', 'ends_at' => '23:00', 'amount' => 30000],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Court::class);

        $data = $this->validated($request);

        $court = DB::transaction(function () use ($data) {
            $court = Court::create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'sport' => $data['sport'],
                'surface' => $data['surface'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'],
                'slot_minutes' => $data['slot_minutes'],
                'buffer_minutes' => $data['buffer_minutes'],
                'sort_order' => $data['sort_order'],
            ]);

            $this->syncSchedules($court, $data['schedules']);
            $this->syncPricing($court, $data['pricing'] ?? []);

            AuditLog::record('court.created', $court, request()->user(), ['name' => $court->name]);

            return $court;
        });

        return redirect()->route('admin.courts.index')->with('success', 'Cancha creada: '.$court->name);
    }

    public function edit(Court $court): Response
    {
        Gate::authorize('update', $court);

        $court->load('schedules', 'pricingRules');

        $schedules = collect(range(1, 7))->map(function (int $weekday) use ($court) {
            $existing = $court->schedules->firstWhere('weekday', $weekday);

            return [
                'weekday' => $weekday,
                'is_open' => $existing?->is_open ?? true,
                'opens_at' => substr($existing->opens_at ?? '08:00:00', 0, 5),
                'closes_at' => substr($existing->closes_at ?? '23:00:00', 0, 5),
            ];
        });

        return Inertia::render('Admin/Courts/Form', [
            'court' => [
                'id' => $court->id,
                'name' => $court->name,
                'sport' => $court->sport,
                'surface' => $court->surface,
                'description' => $court->description,
                'is_active' => $court->is_active,
                'slot_minutes' => $court->slot_minutes,
                'buffer_minutes' => $court->buffer_minutes,
                'sort_order' => $court->sort_order,
            ],
            'schedules' => $schedules->values(),
            'pricing' => $court->pricingRules
                ->sortBy([['weekday', 'asc'], ['starts_at', 'asc']])
                ->map(fn (PricingRule $rule) => [
                    'weekday' => $rule->weekday,
                    'starts_at' => substr($rule->starts_at, 0, 5),
                    'ends_at' => substr($rule->ends_at, 0, 5),
                    'amount' => $rule->amount_cents / 100,
                ])->values(),
        ]);
    }

    public function update(Request $request, Court $court): RedirectResponse
    {
        Gate::authorize('update', $court);

        $data = $this->validated($request);

        DB::transaction(function () use ($court, $data) {
            $court->update([
                'name' => $data['name'],
                'sport' => $data['sport'],
                'surface' => $data['surface'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'],
                'slot_minutes' => $data['slot_minutes'],
                'buffer_minutes' => $data['buffer_minutes'],
                'sort_order' => $data['sort_order'],
            ]);

            $this->syncSchedules($court, $data['schedules']);
            $this->syncPricing($court, $data['pricing'] ?? []);

            AuditLog::record('court.updated', $court, request()->user(), [
                'slot_minutes' => $court->slot_minutes,
                'is_active' => $court->is_active,
            ]);
        });

        return redirect()->route('admin.courts.index')->with('success', 'Cancha actualizada.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'sport' => ['required', 'string', 'max:40'],
            'surface' => ['nullable', 'string', 'max:40'],
            'description' => ['nullable', 'string', 'max:500'],
            'slot_minutes' => ['required', 'integer', 'in:15,30,45,60,75,90,120,180'],
            'buffer_minutes' => ['required', 'integer', 'min:0', 'max:60'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:99'],
            'is_active' => ['required', 'boolean'],
            'schedules' => ['required', 'array', 'size:7'],
            'schedules.*.weekday' => ['required', 'integer', 'between:1,7'],
            'schedules.*.is_open' => ['required', 'boolean'],
            'schedules.*.opens_at' => ['required', 'date_format:H:i'],
            'schedules.*.closes_at' => ['required', 'date_format:H:i'],
            'pricing' => ['array'],
            'pricing.*.weekday' => ['nullable', 'integer', 'between:1,7'],
            'pricing.*.starts_at' => ['required_with:pricing', 'date_format:H:i'],
            'pricing.*.ends_at' => ['required_with:pricing', 'date_format:H:i'],
            'pricing.*.amount' => ['required_with:pricing', 'numeric', 'min:0', 'max:9999999'],
        ]);

        foreach ($data['schedules'] as $schedule) {
            if ($schedule['is_open'] && $schedule['closes_at'] <= $schedule['opens_at']) {
                throw ValidationException::withMessages([
                    'schedules' => 'La hora de cierre tiene que ser posterior a la de apertura.',
                ]);
            }
        }

        foreach ($data['pricing'] ?? [] as $rule) {
            if ($rule['ends_at'] <= $rule['starts_at']) {
                throw ValidationException::withMessages([
                    'pricing' => 'Cada tarifa tiene que terminar después de empezar.',
                ]);
            }
        }

        return $data;
    }

    private function syncSchedules(Court $court, array $schedules): void
    {
        foreach ($schedules as $schedule) {
            CourtSchedule::updateOrCreate(
                ['court_id' => $court->id, 'weekday' => $schedule['weekday']],
                [
                    'is_open' => $schedule['is_open'],
                    'opens_at' => $schedule['opens_at'].':00',
                    'closes_at' => $schedule['closes_at'].':00',
                ],
            );
        }
    }

    private function syncPricing(Court $court, array $pricing): void
    {
        // Rates are configuration, not history: bookings keep their own frozen price.
        $court->pricingRules()->delete();

        foreach ($pricing as $rule) {
            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => $rule['weekday'] ?? null,
                'starts_at' => $rule['starts_at'].':00',
                'ends_at' => $rule['ends_at'].':00',
                'amount_cents' => (int) round($rule['amount'] * 100),
            ]);
        }
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'cancha';
        $slug = $base;
        $suffix = 2;

        while (Court::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function defaultSchedules(): array
    {
        return collect(range(1, 7))->map(fn (int $weekday) => [
            'weekday' => $weekday,
            'is_open' => true,
            'opens_at' => '08:00',
            'closes_at' => '23:00',
        ])->all();
    }
}
