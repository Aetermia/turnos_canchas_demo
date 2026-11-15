<?php

namespace Tests\Feature;

use App\Models\BlockedPeriod;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BoardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Tuesday 10 March 2026, 09:00 in Buenos Aires.
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-03-10 09:00:00'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    /**
     * @return array<string, mixed>
     */
    private function board(): array
    {
        $response = $this->get('/');
        $response->assertOk();

        $board = null;

        $response->assertInertia(function (Assert $page) use (&$board) {
            $page->component('Home');
            $board = $page->toArray()['props']['board'];
        });

        return $board;
    }

    public function test_board_lists_every_active_court_with_its_day(): void
    {
        Court::factory()->configured()->create(['name' => 'Cancha 1']);
        Court::factory()->configured()->create(['name' => 'Cancha 2']);
        Court::factory()->configured()->create(['name' => 'Cancha 3', 'is_active' => false]);

        $board = $this->board();

        $this->assertSame('2026-03-10', $board['date']);
        $this->assertSame(30, $board['unit_minutes']);
        $this->assertSame(['Cancha 1', 'Cancha 2'], array_column($board['rows'], 'name'));
        $this->assertGreaterThan(0, $board['columns']);
    }

    public function test_board_marks_free_slots_with_their_price_and_taken_slots_without_one(): void
    {
        $court = Court::factory()->configured()->create(['name' => 'Cancha 1']);
        $customer = User::factory()->create();

        Booking::create([
            'code' => 'BK-BOARD1',
            'court_id' => $court->id,
            'user_id' => $customer->id,
            'starts_at' => CarbonImmutable::parse('2026-03-10 12:00:00'),
            'ends_at' => CarbonImmutable::parse('2026-03-10 13:00:00'),
            'status' => \App\Enums\BookingStatus::Confirmed,
            'price_cents' => 2_000_000,
            'duration_minutes' => 60,
        ]);

        $board = $this->board();
        $cells = collect($board['rows'][0]['cells'])->keyBy('start');

        $this->assertSame('free', $cells['10:00']['state']);
        $this->assertSame(2_000_000, $cells['10:00']['price_cents']);

        $this->assertSame('taken', $cells['12:00']['state']);
        $this->assertNull($cells['12:00']['price_cents']);
    }

    public function test_board_skips_hours_the_club_already_passed(): void
    {
        Court::factory()->configured()->create();

        $board = $this->board();
        $starts = collect($board['rows'][0]['cells'])->pluck('start');

        // The club opens at 08:00, but at 09:00 only a 60 minute lead time is bookable.
        $this->assertTrue($starts->contains('08:00'));
        $this->assertSame('past', collect($board['rows'][0]['cells'])->firstWhere('start', '08:00')['state']);
        $this->assertSame('free', collect($board['rows'][0]['cells'])->firstWhere('start', '10:00')['state']);
    }

    public function test_board_reflects_a_blocked_period(): void
    {
        $court = Court::factory()->configured()->create();

        BlockedPeriod::create([
            'court_id' => $court->id,
            'starts_at' => CarbonImmutable::parse('2026-03-10 15:00:00'),
            'ends_at' => CarbonImmutable::parse('2026-03-10 16:00:00'),
            'reason' => 'Mantenimiento',
        ]);

        $cells = collect($this->board()['rows'][0]['cells'])->keyBy('start');

        $this->assertSame('taken', $cells['15:00']['state']);
        $this->assertSame('Ocupado', $cells['15:00']['reason']);
    }

    public function test_board_columns_match_the_court_opening_window(): void
    {
        $court = Court::factory()->configured()->create();
        $board = $this->board();

        // 08:00 to 23:00 in half hour units.
        $this->assertSame('08:00', $board['from']);
        $this->assertSame('23:00', $board['to']);
        $this->assertSame(30, $board['unit_minutes']);
        $this->assertSame(30, $board['columns']);
        $this->assertCount(15, $board['hours']);

        $cell = collect($board['rows'][0]['cells'])->firstWhere('start', '10:00');
        $this->assertSame(4, $cell['col']);
        $this->assertSame(2, $cell['span']);

        $this->assertSame($court->id, $board['rows'][0]['id']);
    }

    public function test_board_closed_day_has_no_cells(): void
    {
        $court = Court::factory()->configured()->create();
        $court->schedules()->where('weekday', 2)->update(['is_open' => false]);

        $row = $this->board()['rows'][0];

        $this->assertFalse($row['is_open']);
        $this->assertSame([], $row['cells']);
    }
}
