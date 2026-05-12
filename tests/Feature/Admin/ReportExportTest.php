<?php

use App\Exports\ReportsExport;
use App\Models\Booking;
use App\Models\ResortOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('reports page applies the same filters used by exports', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $option = ResortOption::create([
        'name' => 'Upper Pool',
        'slug' => 'upper-pool',
        'price' => 5000,
        'max_pax' => 12,
        'description' => 'Enjoy the upper pool.',
        'status' => 'active',
    ]);

    Booking::create([
        'booking_reference' => 'BR-0001',
        'full_name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'contact_number' => '09171234567',
        'resort_option_id' => $option->id,
        'pax' => 8,
        'booking_date' => '2026-05-10',
        'booking_time' => 'Morning: 7am to 5pm',
        'total_price' => 5000,
        'payment_method' => 'Cash',
        'booking_status' => 'Confirmed',
    ]);

    Booking::create([
        'booking_reference' => 'BR-0002',
        'full_name' => 'Ana Reyes',
        'email' => 'ana.pending@example.com',
        'contact_number' => '09170000000',
        'resort_option_id' => $option->id,
        'pax' => 4,
        'booking_date' => '2026-05-11',
        'booking_time' => 'Night: 7pm to 5am',
        'total_price' => 5000,
        'payment_method' => 'Cash',
        'booking_status' => 'Pending',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.reports.index', [
            'search' => 'Ana',
            'status' => 'Confirmed',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reports/index')
            ->where('summary.totalBookings', 1)
            ->where('summary.confirmed', 1)
            ->where('summary.pending', 0)
            ->where('recentBookings.total', 1)
        );
});

test('excel export includes all filtered bookings instead of only the visible page', function () {
    $option = ResortOption::create([
        'name' => 'Upper Pool',
        'slug' => 'upper-pool',
        'price' => 5000,
        'max_pax' => 12,
        'description' => 'Enjoy the upper pool.',
        'status' => 'active',
    ]);

    foreach (range(1, 10) as $index) {
        Booking::create([
            'booking_reference' => 'BR-1'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'full_name' => 'Ana Reyes',
            'email' => 'ana'.$index.'@example.com',
            'contact_number' => '09171234'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'resort_option_id' => $option->id,
            'pax' => 8,
            'booking_date' => '2026-05-10',
            'booking_time' => 'Morning: 7am to 5pm',
            'total_price' => 5000,
            'payment_method' => 'Cash',
            'booking_status' => 'Confirmed',
        ]);
    }

    Booking::create([
        'booking_reference' => 'BR-2001',
        'full_name' => 'Ana Reyes',
        'email' => 'ana.pending@example.com',
        'contact_number' => '09170000000',
        'resort_option_id' => $option->id,
        'pax' => 4,
        'booking_date' => '2026-05-11',
        'booking_time' => 'Night: 7pm to 5am',
        'total_price' => 5000,
        'payment_method' => 'Cash',
        'booking_status' => 'Pending',
    ]);

    $export = new ReportsExport([
        'date_from' => null,
        'date_to' => null,
        'search' => 'Ana',
        'status' => 'Confirmed',
    ]);

    expect($export->collection())->toHaveCount(10);
});
