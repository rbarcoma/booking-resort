<?php

use App\Models\ResortOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can update a resort option category', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $option = ResortOption::create([
        'name' => 'Upper Pool',
        'slug' => 'upper-pool',
        'price' => 5000,
        'max_pax' => 12,
        'description' => 'Old description',
        'status' => 'active',
    ]);

    $response = $this
        ->actingAs($admin)
        ->put(route('admin.resort-options.update', $option), [
            'name' => 'Upper Pool Deluxe',
            'price' => '7500.00',
            'max_pax' => '15',
            'description' => 'Updated upper pool category',
            'status' => 'active',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('resort_options', [
        'id' => $option->id,
        'name' => 'Upper Pool Deluxe',
        'slug' => 'upper-pool-deluxe',
        'price' => 7500,
        'max_pax' => 15,
        'description' => 'Updated upper pool category',
        'status' => 'active',
    ]);
});
