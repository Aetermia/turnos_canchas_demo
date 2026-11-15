<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Court;
use App\Models\CourtSchedule;
use App\Models\EstablishmentSetting;
use App\Models\PricingRule;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo data for the template, not a real club. Every value here is invented on
 * purpose so an installation can be shown before the first client exists.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        EstablishmentSetting::query()->delete();
        EstablishmentSetting::create([
            'name' => 'Complejo Los Álamos',
            'tagline' => 'Pádel y fútbol 5 en Villa Ballester',
            'about' => 'Cinco canchas de pádel y dos de fútbol 5, con vestuarios y buffet. Reservá online y llegá a jugar.',
            'accent_color' => '#a9491f',
            'phone' => '11 4768 2210',
            'whatsapp' => '5491147682210',
            'email' => 'turnos@losalamos.demo',
            'address' => 'Av. San Martín 2450',
            'city' => 'Villa Ballester',
            'maps_url' => null,
            'auto_confirm' => true,
            'pending_blocks_slot' => true,
            'min_advance_minutes' => 60,
            'max_advance_days' => 21,
            'cancellation_hours' => 12,
        ]);
        EstablishmentSetting::forgetCache();

        $admin = User::create([
            'name' => 'Marina Duarte',
            'email' => 'admin@demo.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'phone' => '11 4768 2200',
        ]);

        User::create([
            'name' => 'Nicolás Ferrer',
            'email' => 'recepcion@demo.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Receptionist,
            'phone' => '11 4768 2201',
        ]);

        $problems = User::factory()->count(8)->create();

        $demoCustomer = User::create([
            'name' => 'Sofía Aguirre',
            'email' => 'cliente@demo.test',
            'password' => Hash::make('password'),
            'role' => UserRole::Customer,
            'phone' => '11 5555 1234',
        ]);

        $problems->push($demoCustomer);

        $courts = [
            ['name' => 'Pádel 1', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 90, 'buffer_minutes' => 15, 'day' => 2_200_000, 'night' => 3_200_000, 'opens' => '08:00:00', 'closes' => '23:00:00'],
            ['name' => 'Pádel 2', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 90, 'buffer_minutes' => 15, 'day' => 2_200_000, 'night' => 3_200_000, 'opens' => '08:00:00', 'closes' => '23:00:00'],
            ['name' => 'Pádel 3', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 1_800_000, 'night' => 2_600_000, 'opens' => '09:00:00', 'closes' => '22:00:00'],
            ['name' => 'Fútbol 5 A', 'sport' => 'Fútbol 5', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 3_500_000, 'night' => 4_500_000, 'opens' => '09:00:00', 'closes' => '23:00:00'],
            ['name' => 'Fútbol 5 B', 'sport' => 'Fútbol 5', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 3_500_000, 'night' => 4_500_000, 'opens' => '09:00:00', 'closes' => '23:00:00'],
        ];

        foreach ($courts as $index => $data) {
            $court = Court::create([
                'name' => $data['name'],
                'slug' => \Illuminate\Support\Str::slug($data['name']),
                'sport' => $data['sport'],
                'surface' => $data['surface'],
                'description' => null,
                'is_active' => true,
                'slot_minutes' => $data['slot_minutes'],
                'buffer_minutes' => $data['buffer_minutes'],
                'sort_order' => $index,
            ]);

            foreach (range(1, 7) as $weekday) {
                CourtSchedule::create([
                    'court_id' => $court->id,
                    'weekday' => $weekday,
                    'is_open' => true,
                    'opens_at' => $data['opens'],
                    'closes_at' => $data['closes'],
                ]);
            }

            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => null,
                'starts_at' => $data['opens'],
                'ends_at' => '18:00:00',
                'amount_cents' => $data['day'],
            ]);

            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => null,
                'starts_at' => '18:00:00',
                'ends_at' => $data['closes'],
                'amount_cents' => $data['night'],
            ]);

            // Saturday morning is the most expensive band in this club.
            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => 6,
                'starts_at' => $data['opens'],
                'ends_at' => '14:00:00',
                'amount_cents' => $data['night'],
            ]);
        }

        $this->seedBookings($courts, $problems, $admin);
    }

    private function seedBookings(array $courts, $customers, User $admin): void
    {
        $availability = AvailabilityService::make();
        $bookings = BookingService::make();
        $today = CarbonImmutable::now()->startOfDay();

        foreach (Court::all() as $court) {
            foreach (range(0, 6) as $offset) {
                $day = $today->addDays($offset);
                $slots = collect($availability->slots($court->fresh(), $day))->where('available', true)->values();

                // A believable occupancy pattern: busy at night, quiet at midday.
                $take = $offset === 0 ? min(3, $slots->count()) : min(fake()->numberBetween(1, 4), $slots->count());
                $chosen = $slots->shuffle()->take($take);

                foreach ($chosen as $slot) {
                    try {
                        $booking = $bookings->create(
                            $court,
                            $customers->random(),
                            CarbonImmutable::parse($slot['start']),
                            $court->slot_minutes,
                            $admin,
                        );
                    } catch (\Throwable) {
                        continue;
                    }

                    if (fake()->boolean(20)) {
                        $bookings->cancel($booking, $admin, 'Reprogramado por el cliente');
                    }
                }
            }
        }

        // One pending booking so the approval flow is visible in the panel.
        $pendingCourt = Court::query()->first();
        $pendingSlot = collect($availability->slots($pendingCourt, $today->addDay()))
            ->firstWhere('available', true);

        if ($pendingSlot) {
            $booking = $bookings->create(
                $pendingCourt,
                $customers->first(),
                CarbonImmutable::parse($pendingSlot['start']),
                $pendingCourt->slot_minutes,
                $admin,
            );
            $booking->update(['status' => BookingStatus::Pending, 'confirmed_at' => null]);
        }
    }
}
