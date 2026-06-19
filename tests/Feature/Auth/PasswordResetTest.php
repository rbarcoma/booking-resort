<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

test('forgot password screen can be rendered for the code reset flow', function () {
    $response = $this->get(route('password.request'));

    $response->assertOk();
});

test('fortify reset link routes are not registered', function () {
    expect(Route::has('password.email'))->toBeFalse()
        ->and(Route::has('password.update'))->toBeFalse()
        ->and(Route::has('password.reset'))->toBeFalse();
});

test('requesting a reset code stores a token for existing users', function () {
    Mail::fake();

    $user = User::factory()->create([
        'email' => 'admin@example.com',
    ]);

    $response = $this->post(route('password.code.email'), [
        'email' => $user->email,
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('password.code.verify', ['email' => $user->email]));

    expect(DB::table('password_reset_tokens')->where('email', $user->email)->exists())->toBeTrue();
});

test('requesting a reset code does not reveal unknown emails', function () {
    Mail::fake();

    $response = $this->post(route('password.code.email'), [
        'email' => 'missing@example.com',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('password.code.verify', ['email' => 'missing@example.com']));

    expect(DB::table('password_reset_tokens')->where('email', 'missing@example.com')->exists())->toBeFalse();
});

test('verification code can be verified before resetting password', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
    ]);

    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make('123456'),
        'created_at' => now(),
    ]);

    $response = $this->post(route('password.code.verify.store'), [
        'email' => $user->email,
        'code' => '123456',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('password.code.reset'));
});

test('password can be reset after verification code is verified', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => 'OldStrongPass123!',
    ]);

    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make('123456'),
        'created_at' => now(),
    ]);

    $this->post(route('password.code.verify.store'), [
        'email' => $user->email,
        'code' => '123456',
    ])->assertRedirect(route('password.code.reset'));

    $response = $this->post(route('password.code.update'), [
        'password' => 'NewStrongPass123!',
        'password_confirmation' => 'NewStrongPass123!',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login'));

    expect(Hash::check('NewStrongPass123!', $user->fresh()->password))->toBeTrue()
        ->and(DB::table('password_reset_tokens')->where('email', $user->email)->exists())->toBeFalse();
});

test('password cannot be reset before code verification', function () {
    $response = $this->post(route('password.code.update'), [
        'password' => 'NewStrongPass123!',
        'password_confirmation' => 'NewStrongPass123!',
    ]);

    $response->assertSessionHasErrors('email');
});
