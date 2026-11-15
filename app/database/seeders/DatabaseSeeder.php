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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;

/**
 * Demo data only: a fully generic establishment so the template can be shown
 * before the first client exists. No real club, brand, address or person is
 * represented here, and nothing is presented as a real statistic.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        EstablishmentSetting::query()->delete();
        EstablishmentSetting::create([
            'name' => 'Complejo Deportivo',
            'tagline' => null,
            'about' => 'Canchas de pádel y fútbol 5. Elegí día y horario, y confirmá online.',
            'accent_color' => '#f0b429',
            'phone' => null,
            'whatsapp' => null,
            'email' => null,
            'address' => null,
            'city' => null,
            'maps_url' => null,
            'auto_confirm' => true,
            'pending_blocks_slot' => true,
            'min_advance_minutes' => 60,
            'max_advance_days' => 21,
            'cancellation_hours' => 12,
        ]);
        EstablishmentSetting::forgetCache();

        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Admin,
            'phone' => null,
        ]);

        User::create([
            'name' => 'Recepción',
            'email' => 'recepcion@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Receptionist,
            'phone' => null,
        ]);

        $customers = $this->demoCustomers();
        $customers->push(User::create([
            'name' => 'Cliente Demo',
            'email' => 'cliente@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Customer,
            'phone' => '11 0000 0000',
        ]));

        $courts = [
            ['name' => 'Cancha 1', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 90, 'buffer_minutes' => 15, 'day' => 2_200_000, 'night' => 3_200_000, 'opens' => '08:00:00', 'closes' => '23:00:00'],
            ['name' => 'Cancha 2', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 90, 'buffer_minutes' => 15, 'day' => 2_200_000, 'night' => 3_200_000, 'opens' => '08:00:00', 'closes' => '23:00:00'],
            ['name' => 'Cancha 3', 'sport' => 'Pádel', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 1_800_000, 'night' => 2_600_000, 'opens' => '09:00:00', 'closes' => '22:00:00'],
            ['name' => 'Cancha 4', 'sport' => 'Fútbol 5', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 3_500_000, 'night' => 4_500_000, 'opens' => '09:00:00', 'closes' => '23:00:00'],
            ['name' => 'Cancha 5', 'sport' => 'Fútbol 5', 'surface' => 'Césped sintético', 'slot_minutes' => 60, 'buffer_minutes' => 0, 'day' => 3_500_000, 'night' => 4_500_000, 'opens' => '09:00:00', 'closes' => '23:00:00'],
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

            // A weekend morning band, to show that rates can differ by weekday.
            PricingRule::create([
                'court_id' => $court->id,
                'weekday' => 6,
                'starts_at' => $data['opens'],
                'ends_at' => '14:00:00',
                'amount_cents' => $data['night'],
            ]);
        }

        $this->seedBookings($customers, $admin);

        $this->call(LocalAccountSeeder::class);
    }

    /**
     * @return Collection<int, User>
     */
    private function demoCustomers(): Collection
    {
        return collect(range(1, 8))->map(function (int $index) {
            $suffix = str_pad((string) $index, 2, '0', STR_PAD_LEFT);

            return User::create([
                'name' => 'Cliente '.$suffix,
                'email' => 'cliente'.$suffix.'@example.com',
                'password' => Hash::make('password'),
                'role' => UserRole::Customer,
                'phone' => '11 0000 00'.$suffix,
            ]);
        });
    }

    private function seedBookings(Collection $customers, User $admin): void
    {
        $availability = AvailabilityService::make();
        $bookings = BookingService::make();
        $today = CarbonImmutable::now()->startOfDay();

        foreach (Court::all() as $court) {
            foreach (range(0, 6) as $offset) {
                $day = $today->addDays($offset);
                $slots = collect($availability->slots($court->fresh(), $day))->where('available', true)->values();

                $take = $offset === 0 ? min(3, $slots->count()) : min(fake()->numberBetween(1, 4), $slots->count());

                foreach ($slots->shuffle()->take($take) as $slot) {
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
        $pendingSlot = collect($availability->slots($pendingCourt, $today->addDay()))->firstWhere('available', true);

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
