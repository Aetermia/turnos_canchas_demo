<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register(): void
    {
        $response = $this->post('/registro', [
            'name' => 'Lucía Fernández',
            'email' => 'lucia@example.com',
            'phone' => '1145678901',
            'password' => 'cancha2026',
            'password_confirmation' => 'cancha2026',
        ]);

        $response->assertRedirect('/');
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'lucia@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_registration_rejects_a_duplicated_email(): void
    {
        User::factory()->create(['email' => 'lucia@example.com']);

        $response = $this->from('/registro')->post('/registro', [
            'name' => 'Lucía Fernández',
            'email' => 'lucia@example.com',
            'password' => 'cancha2026',
            'password_confirmation' => 'cancha2026',
        ]);

        $response->assertRedirect('/registro');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_registration_requires_a_matching_password_confirmation(): void
    {
        $response = $this->from('/registro')->post('/registro', [
            'name' => 'Lucía Fernández',
            'email' => 'lucia@example.com',
            'password' => 'cancha2026',
            'password_confirmation' => 'otraclave',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_user_can_login_and_is_sent_to_the_right_place(): void
    {
        $customer = User::factory()->create(['password' => Hash::make('cancha2026')]);
        $staff = User::factory()->receptionist()->create(['password' => Hash::make('cancha2026')]);

        $this->post('/ingresar', ['email' => $customer->email, 'password' => 'cancha2026'])
            ->assertRedirect('/');
        $this->assertAuthenticatedAs($customer);
        $this->post('/salir');
        $this->assertGuest();

        $this->post('/ingresar', ['email' => $staff->email, 'password' => 'cancha2026'])
            ->assertRedirect('/panel');
        $this->assertAuthenticatedAs($staff);
    }

    public function test_wrong_password_keeps_the_user_guest(): void
    {
        $user = User::factory()->create(['password' => Hash::make('cancha2026')]);

        $this->from('/ingresar')
            ->post('/ingresar', ['email' => $user->email, 'password' => 'incorrecta'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_deactivated_customer_cannot_login(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('cancha2026'),
            'is_active' => false,
        ]);

        $this->from('/ingresar')
            ->post('/ingresar', ['email' => $user->email, 'password' => 'cancha2026'])
            ->assertSessionHas('error');

        $this->assertGuest();
    }

    public function test_login_is_throttled_after_five_attempts(): void
    {
        $user = User::factory()->create(['password' => Hash::make('cancha2026')]);

        foreach (range(1, 5) as $ignored) {
            $this->post('/ingresar', ['email' => $user->email, 'password' => 'mala']);
        }

        $this->post('/ingresar', ['email' => $user->email, 'password' => 'cancha2026'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_password_reset_request_gives_the_same_answer_for_unknown_emails(): void
    {
        $this->from('/recuperar-contraseña')
            ->post('/recuperar-contraseña', ['email' => 'nadie@example.com'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');
    }

    public function test_customer_can_update_his_profile(): void
    {
        $user = User::factory()->create(['password' => Hash::make('cancha2026')]);

        $this->actingAs($user)->patch('/mi-cuenta', [
            'name' => 'Nombre Nuevo',
            'email' => 'nuevo@example.com',
            'phone' => '1140001111',
            'current_password' => 'cancha2026',
            'password' => 'nuevaClave2026',
            'password_confirmation' => 'nuevaClave2026',
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Nombre Nuevo', $user->name);
        $this->assertTrue(Hash::check('nuevaClave2026', $user->password));
    }

    public function test_profile_password_change_requires_the_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch('/mi-cuenta', [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'nuevaClave2026',
            'password_confirmation' => 'nuevaClave2026',
        ])->assertSessionHasErrors('current_password');
    }
}
