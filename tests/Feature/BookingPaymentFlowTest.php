<?php

use App\Models\Booking;
use App\Models\ResortOption;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Mail::fake();
    Storage::fake('local');

    $this->resortOption = ResortOption::create([
        'name' => 'Garden Resort',
        'slug' => 'garden-resort',
        'price' => 8000,
        'max_pax' => 20,
        'description' => 'Private garden resort.',
        'status' => 'active',
    ]);

    $this->bookingData = [
        'full_name' => 'Maria Santos',
        'facebook' => 'maria.santos',
        'email' => 'maria@example.com',
        'contact_number' => '09171234567',
        'resort_option_id' => $this->resortOption->id,
        'pax' => 10,
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'booking_time' => 'Morning: 7am to 5pm',
        'message' => 'Birthday booking.',
        'payment_type' => Booking::PAYMENT_TYPE_DOWN,
    ];
});

test('signed booking receipts expose the shared resort Messenger destination', function (?string $messengerLink, string $messengerUrl) {
    if ($messengerLink !== null) {
        SiteSetting::create([
            'section' => 'contact',
            'facebook_link' => 'https://www.facebook.com/profile.php?id=100083094471286',
            'messenger_link' => $messengerLink,
        ]);
    }

    $booking = Booking::create([
        ...$this->bookingData,
        'booking_reference' => 'Q8-20260908-RECEIPT12345',
        'total_price' => '8000.00',
    ]);

    $this->get(URL::signedRoute('bookings.receipt', $booking))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('customer/receipt')
        ->where('messengerUrl', $messengerUrl)
        ->where('booking.booking_reference', $booking->booking_reference)
        ->where('receipt_pdf_url', URL::signedRoute('bookings.receipt.pdf', $booking)));

    $this->get(route('bookings.receipt', $booking))->assertForbidden();
})->with([
    'configured chat link' => ['https://www.facebook.com/messages/t/101750125870613', 'https://www.facebook.com/messages/t/101750125870613'],
    'configured Page username' => ['https://www.facebook.com/Q8Owner', 'https://m.me/Q8Owner'],
    'Contact not yet configured' => [null, 'https://www.facebook.com/messages/t/101750125870613'],
]);

test('laravel prepares a signed down payment quote using the current resort price', function () {
    $response = $this->postJson(route('bookings.payment-details'), [
        ...$this->bookingData,
        'total_reservation_amount' => '1.00',
        'amount_to_pay' => '1.00',
        'remaining_balance' => '0.00',
    ]);

    $response
        ->assertOk()
        ->assertJson([
            'payment_method' => Booking::PAYMENT_METHOD_GCASH,
            'payment_type' => Booking::PAYMENT_TYPE_DOWN,
            'total_reservation_amount' => '8000.00',
            'amount_to_pay' => '4000.00',
            'remaining_balance' => '4000.00',
        ]);

    expect($response->json('booking_reference'))
        ->toMatch('/^Q8-[0-9]{8}-[A-Z0-9]{12}$/');
    expect($response->json('payment_quote'))->toBeString()->not->toBeEmpty();
});

test('a booking cannot be submitted without an image proof of payment', function () {
    $quote = $this->postJson(route('bookings.payment-details'), $this->bookingData)
        ->assertOk()
        ->json('payment_quote');

    $this->post(route('bookings.store'), [
        ...$this->bookingData,
        'payment_quote' => $quote,
    ])->assertSessionHasErrors('proof_of_payment');

    $this->assertDatabaseCount('bookings', 0);
});

test('booking submission recalculates payment values and stores proof privately', function () {
    Http::fake();
    config()->set('services.n8n.booking_submitted_webhook_url', 'https://n8n.example.test/submitted');

    $quoteResponse = $this->postJson(route('bookings.payment-details'), $this->bookingData)
        ->assertOk();

    $this->post(route('bookings.store'), [
        ...$this->bookingData,
        'payment_quote' => $quoteResponse->json('payment_quote'),
        'proof_of_payment' => UploadedFile::fake()->image('gcash.png'),
        'total_price' => '1.00',
        'amount_paid' => '1.00',
        'remaining_balance' => '0.00',
        'booking_status' => Booking::STATUS_CONFIRMED,
        'payment_status' => Booking::PAYMENT_STATUS_FULLY_PAID,
    ])->assertRedirect();

    $booking = Booking::sole();

    expect($booking->booking_reference)->toBe($quoteResponse->json('booking_reference'));
    expect($booking->payment_method)->toBe(Booking::PAYMENT_METHOD_GCASH);
    expect($booking->payment_type)->toBe(Booking::PAYMENT_TYPE_DOWN);
    expect($booking->total_price)->toBe('8000.00');
    expect($booking->amount_paid)->toBe('4000.00');
    expect($booking->remaining_balance)->toBe('4000.00');
    expect($booking->booking_status)->toBe(Booking::STATUS_PENDING);
    expect($booking->payment_status)->toBe(Booking::PAYMENT_STATUS_FOR_VERIFICATION);

    Storage::disk('local')->assertExists($booking->proof_of_payment_path);

    Http::assertSent(fn (Request $request) => $request->url() === 'https://n8n.example.test/submitted'
        && $request['event'] === 'booking.submitted'
        && $request['calendar_action'] === 'none'
        && $request['booking']['booking_status'] === Booking::STATUS_PENDING
        && $request['booking']['payment_status'] === Booking::PAYMENT_STATUS_FOR_VERIFICATION);
});

test('a signed quote cannot be reused with a different payment type', function () {
    $quote = $this->postJson(route('bookings.payment-details'), $this->bookingData)
        ->assertOk()
        ->json('payment_quote');

    $this->post(route('bookings.store'), [
        ...$this->bookingData,
        'payment_type' => Booking::PAYMENT_TYPE_FULL,
        'payment_quote' => $quote,
        'proof_of_payment' => UploadedFile::fake()->image('gcash.png'),
    ])->assertSessionHasErrors('payment_quote');

    $this->assertDatabaseCount('bookings', 0);
});

test('admin verification confirms a full payment and triggers calendar synchronization', function () {
    Http::fake();
    config()->set('services.n8n.booking_status_webhook_url', 'https://n8n.example.test/status');

    $admin = User::factory()->create(['role' => 'admin']);
    $proofPath = UploadedFile::fake()->image('proof.jpg')->store('booking-payment-proofs', 'local');

    $booking = Booking::create([
        ...collect($this->bookingData)->except(['payment_type'])->all(),
        'booking_reference' => 'Q8-20260904-ABCDEF123456',
        'total_price' => '8000.00',
        'payment_method' => Booking::PAYMENT_METHOD_GCASH,
        'payment_type' => Booking::PAYMENT_TYPE_FULL,
        'amount_paid' => '8000.00',
        'remaining_balance' => '0.00',
        'proof_of_payment_path' => $proofPath,
        'booking_status' => Booking::STATUS_PENDING,
        'payment_status' => Booking::PAYMENT_STATUS_FOR_VERIFICATION,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.bookings.update-status', $booking), [
            'booking_status' => Booking::STATUS_CONFIRMED,
        ])
        ->assertRedirect();

    $booking->refresh();

    expect($booking->booking_status)->toBe(Booking::STATUS_CONFIRMED);
    expect($booking->payment_status)->toBe(Booking::PAYMENT_STATUS_FULLY_PAID);
    expect($booking->remaining_balance)->toBe('0.00');
    expect($booking->payment_reviewed_by)->toBe($admin->id);

    Http::assertSent(fn (Request $request) => $request->url() === 'https://n8n.example.test/status'
        && $request['event'] === 'booking.status_changed'
        && $request['calendar_action'] === 'create_or_update'
        && $request['booking']['payment_status'] === Booking::PAYMENT_STATUS_FULLY_PAID
    );
});

test('verified down payment keeps its balance and a later cancellation removes the calendar event', function () {
    Http::fake();
    config()->set('services.n8n.booking_status_webhook_url', 'https://n8n.example.test/status');

    $admin = User::factory()->create(['role' => 'admin']);
    $proofPath = UploadedFile::fake()->image('proof.jpg')->store('booking-payment-proofs', 'local');

    $booking = Booking::create([
        ...collect($this->bookingData)->except(['payment_type'])->all(),
        'booking_reference' => 'Q8-20260904-DOWNPAY12345',
        'total_price' => '8000.00',
        'payment_method' => Booking::PAYMENT_METHOD_GCASH,
        'payment_type' => Booking::PAYMENT_TYPE_DOWN,
        'amount_paid' => '4000.00',
        'remaining_balance' => '4000.00',
        'proof_of_payment_path' => $proofPath,
        'booking_status' => Booking::STATUS_PENDING,
        'payment_status' => Booking::PAYMENT_STATUS_FOR_VERIFICATION,
    ]);

    $this->actingAs($admin)->patch(route('admin.bookings.update-status', $booking), [
        'booking_status' => Booking::STATUS_CONFIRMED,
    ])->assertRedirect();

    expect($booking->refresh()->payment_status)->toBe(Booking::PAYMENT_STATUS_DOWN_PAYMENT_PAID);
    expect($booking->remaining_balance)->toBe('4000.00');

    $this->actingAs($admin)->patch(route('admin.bookings.update-status', $booking), [
        'booking_status' => Booking::STATUS_CANCELLED,
    ])->assertRedirect();

    expect($booking->refresh()->booking_status)->toBe(Booking::STATUS_CANCELLED);
    expect($booking->payment_status)->toBe(Booking::PAYMENT_STATUS_DOWN_PAYMENT_PAID);

    Http::assertSent(fn (Request $request) => $request['calendar_action'] === 'create_or_update');
    Http::assertSent(fn (Request $request) => $request['calendar_action'] === 'remove'
        && $request['previous_booking_status'] === Booking::STATUS_CONFIRMED);
});

test('cancelling an unverified booking rejects its payment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $proofPath = UploadedFile::fake()->image('proof.jpg')->store('booking-payment-proofs', 'local');

    $booking = Booking::create([
        ...collect($this->bookingData)->except(['payment_type'])->all(),
        'booking_reference' => 'Q8-20260904-ZYXWVU654321',
        'total_price' => '8000.00',
        'payment_method' => Booking::PAYMENT_METHOD_GCASH,
        'payment_type' => Booking::PAYMENT_TYPE_DOWN,
        'amount_paid' => '4000.00',
        'remaining_balance' => '4000.00',
        'proof_of_payment_path' => $proofPath,
        'booking_status' => Booking::STATUS_PENDING,
        'payment_status' => Booking::PAYMENT_STATUS_FOR_VERIFICATION,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.bookings.update-status', $booking), [
            'booking_status' => Booking::STATUS_CANCELLED,
        ])
        ->assertRedirect();

    expect($booking->refresh()->booking_status)->toBe(Booking::STATUS_CANCELLED);
    expect($booking->payment_status)->toBe(Booking::PAYMENT_STATUS_REJECTED);
});

test('only administrators can view the privately stored payment proof', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $proofPath = UploadedFile::fake()->image('proof.jpg')->store('booking-payment-proofs', 'local');

    $booking = Booking::create([
        ...collect($this->bookingData)->except(['payment_type'])->all(),
        'booking_reference' => 'Q8-20260904-PRIVATE123456',
        'total_price' => '8000.00',
        'payment_method' => Booking::PAYMENT_METHOD_GCASH,
        'payment_type' => Booking::PAYMENT_TYPE_DOWN,
        'amount_paid' => '4000.00',
        'remaining_balance' => '4000.00',
        'proof_of_payment_path' => $proofPath,
        'booking_status' => Booking::STATUS_PENDING,
        'payment_status' => Booking::PAYMENT_STATUS_FOR_VERIFICATION,
    ]);

    $this->get(route('admin.bookings.payment-proof', $booking))->assertRedirect();
    $this->actingAs(User::factory()->create(['role' => 'customer']))
        ->get(route('admin.bookings.payment-proof', $booking))->assertForbidden();
    $this->actingAs($admin)
        ->get(route('admin.bookings.payment-proof', $booking))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg')
        ->assertHeader('Cache-Control', 'max-age=0, no-store, private');
});
