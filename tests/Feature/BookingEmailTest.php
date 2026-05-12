<?php

use App\Mail\BookingConfirmationToCustomer;
use App\Mail\BookingNotificationToAdmin;
use App\Models\ResortOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('booking sends a confirmation email to the customer', function () {
    Mail::fake();

    $admin = User::factory()->create([
        'email' => 'owner@example.com',
        'role' => 'admin',
    ]);

    $resortOption = ResortOption::create([
        'name' => 'Upper Pool',
        'slug' => 'upper-pool',
        'price' => 5000,
        'max_pax' => 12,
        'description' => 'Enjoy the upper pool.',
        'status' => 'active',
    ]);

    $response = $this->post(route('bookings.store'), [
        'full_name' => 'Juan Dela Cruz',
        'facebook' => 'juan.fb',
        'email' => 'customer@example.com',
        'contact_number' => '09171234567',
        'resort_option_id' => $resortOption->id,
        'pax' => 8,
        'booking_date' => now()->addDay()->format('Y-m-d'),
        'booking_time' => 'Morning: 7am to 5pm',
        'message' => 'Please reserve the pool.',
    ]);

    $response->assertRedirect();

    Mail::assertSent(BookingNotificationToAdmin::class, function ($mail) use ($admin) {
        return $mail->hasTo($admin->email);
    });

    Mail::assertSent(BookingConfirmationToCustomer::class, function ($mail) {
        return $mail->hasTo('customer@example.com')
            && $mail->booking->resortOption?->name === 'Upper Pool';
    });
});
