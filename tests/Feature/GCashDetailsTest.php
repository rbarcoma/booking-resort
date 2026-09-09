<?php

use App\Models\SiteSetting;
use App\Models\User;
use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config()->set('filesystems.uploads_disk', 'public');
    config()->set('filesystems.public_media_url', null);
    Storage::fake('public');
});

test('admin can save the GCash account name with the number and QR code for public booking', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), [
            'gcash_name' => 'Test Account Owner',
            'gcash_number' => '09171234567',
            'gcash_qr_code' => UploadedFile::fake()->image('qr.png'),
        ])->assertRedirect()->assertSessionHasNoErrors();

    $setting = SiteSetting::where('section', 'contact')->sole();
    expect($setting->gcash_name)->toBe('Test Account Owner');
    Storage::disk('public')->assertExists($setting->gcash_qr_code);

    $this->get(route('admin.landing-page.index'))->assertInertia(fn (Assert $page) => $page
        ->component('admin/landing-page/index')
        ->where('contact.gcash_name', 'Test Account Owner'));

    auth()->logout();

    $this->get('/book-now')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('customer/book')
        ->where('gcash.name', 'Test Account Owner')
        ->where('gcash.number', '09171234567')
        ->where('gcash.qr_code_url', MediaStorage::url($setting->gcash_qr_code)));
});

test('updating the GCash name preserves the existing payment number and QR image', function () {
    $qr = UploadedFile::fake()->image('qr.png')->store('site-settings/gcash', 'public');
    $setting = SiteSetting::create([
        'section' => 'contact',
        'gcash_name' => 'Test Account Owner',
        'gcash_number' => '09171234567',
        'gcash_qr_code' => $qr,
    ]);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), [
            'gcash_name' => 'Test Owner De la Peña',
            'gcash_qr_code' => null,
        ])->assertRedirect()->assertSessionHasNoErrors();

    expect($setting->refresh()->gcash_name)->toBe('Test Owner De la Peña');
    expect($setting->gcash_number)->toBe('09171234567');
    expect($setting->gcash_qr_code)->toBe($qr);
    Storage::disk('public')->assertExists($qr);

    $this->get('/book-now')->assertInertia(fn (Assert $page) => $page
        ->where('gcash.name', 'Test Owner De la Peña'));
});

test('booking handles a GCash account name that has not been configured', function (bool $hasContact) {
    if ($hasContact) {
        SiteSetting::create(['section' => 'contact', 'gcash_number' => '09171234567']);
    }

    $this->get('/book-now')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('gcash.name', null)
        ->where('gcash.number', $hasContact ? '09171234567' : null));
})->with([true, false]);

test('admin can clear an outdated GCash account name', function (?string $value) {
    $setting = SiteSetting::create(['section' => 'contact', 'gcash_name' => 'Test Account Owner']);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['gcash_name' => $value])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($setting->refresh()->gcash_name)->toBeNull();

    $this->get('/book-now')->assertInertia(fn (Assert $page) => $page->where('gcash.name', null));
})->with([null, '']);

test('contact updates that omit the GCash name retain its saved value', function () {
    $setting = SiteSetting::create(['section' => 'contact', 'gcash_name' => 'Test Account Owner']);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['title' => 'Contact us'])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($setting->refresh()->gcash_name)->toBe('Test Account Owner');
});

test('invalid GCash account names do not overwrite the saved name', function (mixed $value) {
    $setting = SiteSetting::create(['section' => 'contact', 'gcash_name' => 'Test Account Owner']);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['gcash_name' => $value])
        ->assertSessionHasErrors('gcash_name');

    expect($setting->refresh()->gcash_name)->toBe('Test Account Owner');
})->with([
    'too long' => [str_repeat('a', 256)],
    'not a string' => [['invalid' => 'name']],
]);

test('customers cannot change the resort GCash account name', function () {
    $setting = SiteSetting::create(['section' => 'contact', 'gcash_name' => 'Test Account Owner']);

    $this->actingAs(User::factory()->create(['role' => 'customer']))
        ->post(route('admin.landing-page.update', 'contact'), ['gcash_name' => 'Different Name'])
        ->assertForbidden();

    expect($setting->refresh()->gcash_name)->toBe('Test Account Owner');
});

test('guests cannot change the resort GCash account name', function () {
    $setting = SiteSetting::create(['section' => 'contact', 'gcash_name' => 'Test Account Owner']);

    $this->post(route('admin.landing-page.update', 'contact'), ['gcash_name' => 'Different Name'])
        ->assertRedirect(route('login'));

    expect($setting->refresh()->gcash_name)->toBe('Test Account Owner');
});
