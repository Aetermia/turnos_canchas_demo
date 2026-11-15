<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\LocalAccount;
use Database\Seeders\LocalAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * The admin/admin and user/user accounts are a development convenience. These
 * tests pin both halves of the promise: they work in local, and nothing about
 * them leaks into any other environment.
 */
class LocalAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_local_login_accepts_a_bare_username(): void
    {
        config(['app.local_accounts' => true]);

        $admin = User::factory()->admin()->create([
            'email' => LocalAccount::email('admin'),
            'password' => Hash::make('admin'),
        ]);

        $this->post('/ingresar', ['email' => 'admin', 'password' => 'admin'])->assertRedirect('/panel');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_local_login_still_accepts_the_full_address(): void
    {
        config(['app.local_accounts' => true]);

        $user = User::factory()->create([
            'email' => LocalAccount::email('user'),
            'password' => Hash::make('user'),
        ]);

        $this->post('/ingresar', ['email' => LocalAccount::email('user'), 'password' => 'user'])->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
    }

    public function test_a_bare_username_is_rejected_outside_local(): void
    {
        User::factory()->admin()->create([
            'email' => LocalAccount::email('admin'),
            'password' => Hash::make('admin'),
        ]);

        $this->from('/ingresar')
            ->post('/ingresar', ['email' => 'admin', 'password' => 'admin'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_local_accounts_are_seeded_in_local_and_only_there(): void
    {
        $this->seed(LocalAccountSeeder::class);

        $this->assertDatabaseMissing('users', ['email' => LocalAccount::email('admin')]);
        $this->assertDatabaseMissing('users', ['email' => LocalAccount::email('user')]);

        config(['app.local_accounts' => true]);

        // Twice on purpose: re-seeding must update, not duplicate.
        $this->seed(LocalAccountSeeder::class);
        $this->seed(LocalAccountSeeder::class);

        $this->assertSame(2, User::query()->count());
        $this->assertDatabaseHas('users', ['email' => LocalAccount::email('admin'), 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['email' => LocalAccount::email('user'), 'role' => 'customer']);
        $this->assertTrue(Hash::check('admin', User::query()->where('email', LocalAccount::email('admin'))->value('password')));
    }
}
