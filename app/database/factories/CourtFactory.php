<?php

namespace Database\Factories;

use App\Models\Court;
use App\Models\CourtSchedule;
use App\Models\PricingRule;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Court>
 */
class CourtFactory extends Factory
{
    public function definition(): array
    {
        $sport = fake()->randomElement(['Pádel', 'Fútbol 5', 'Fútbol 7', 'Tenis']);
        $name = $sport.' '.fake()->numberBetween(1, 6);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'sport' => $sport,
            'surface' => fake()->randomElement(['Césped sintético', 'Cemento', 'Polvo de ladrillo']),
            'description' => fake()->sentence(12),
            'is_active' => true,
            'slot_minutes' => 60,
            'buffer_minutes' => 0,
            'sort_order' => 0,
        ];
    }

    /**
     * A court that is actually bookable: open every day plus two price bands.
     */
    public function configured(string $opensAt = '08:00:00', string $closesAt = '23:00:00'): static
    {
        return $this->afterCreating(function (Court $court) use ($opensAt, $closesAt) {
            foreach (range(1, 7) as $weekday) {
                CourtSchedule::create([
                    'court_id' => $court->id,
                    'weekday' => $weekday,
                    'is_open' => true,
                    'opens_at' => $opensAt,
                    'closes_at' => $closesAt,
                ]);
            }

            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => null,
                'starts_at' => $opensAt,
                'ends_at' => '18:00:00',
                'amount_cents' => 2000000,
            ]);

            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => null,
                'starts_at' => '18:00:00',
                'ends_at' => $closesAt,
                'amount_cents' => 3000000,
            ]);
        });
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
