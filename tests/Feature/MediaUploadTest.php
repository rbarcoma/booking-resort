<?php

use App\Models\ResortOption;
use App\Models\SiteSetting;
use App\Models\User;
use App\Support\MediaStorage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use League\Flysystem\UnableToWriteFile;

beforeEach(function () {
    config()->set('filesystems.uploads_disk', 'public');
    config()->set('filesystems.public_media_url', null);
    // A different APP_URL must not send local image requests to the wrong host/port.
    config()->set('filesystems.disks.public.url', 'http://wrong-host.test:8000/storage');
    Storage::fake('public');
    Storage::fake('local');
    $this->admin = User::factory()->create(['role' => 'admin']);
});

test('landing images are saved and served in both admin and public pages', function (string $section) {
    $upload = UploadedFile::fake()->image('holiday.jpg', 800, 600);
    $contents = file_get_contents($upload->path());

    $this->actingAs($this->admin)->post(route('admin.landing-page.update', $section), [
        'image' => $upload,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $path = SiteSetting::where('section', $section)->sole()->image;
    Storage::disk('public')->assertExists($path);
    $url = MediaStorage::url($path);
    expect($url)->toStartWith('/media/site-settings/');

    $response = $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/jpeg');
    expect(file_get_contents($response->baseResponse->getFile()->getPathname()))->toBe($contents);

    $this->get(route('admin.landing-page.index'))->assertInertia(fn (Assert $page) => $page
        ->where("{$section}.image_url", $url));
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where("{$section}.image", $url));
})->with(['home', 'about']);

test('text-only edits retain the uploaded home image and gcash qr code', function () {
    $this->actingAs($this->admin)->post(route('admin.landing-page.update', 'contact'), [
        'image' => UploadedFile::fake()->image('image.jpg'),
        'gcash_qr_code' => UploadedFile::fake()->image('qr.png'),
    ])->assertSessionHasNoErrors();

    $setting = SiteSetting::where('section', 'contact')->sole();
    $image = $setting->image;
    $qr = $setting->gcash_qr_code;

    $this->post(route('admin.landing-page.update', 'contact'), [
        'title' => 'New title', 'image' => null, 'gcash_qr_code' => null,
    ])->assertSessionHasNoErrors();

    expect($setting->refresh()->image)->toBe($image);
    expect($setting->gcash_qr_code)->toBe($qr);
    Storage::disk('public')->assertExists([$image, $qr]);
});

test('replacing an image saves the new file before removing the previous file', function () {
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('site-settings', 'public');
    $setting = SiteSetting::create(['section' => 'home', 'image' => $oldPath]);

    $this->actingAs($this->admin)->post(route('admin.landing-page.update', 'home'), [
        'image' => UploadedFile::fake()->image('new.jpg'),
    ])->assertSessionHasNoErrors();

    expect($setting->refresh()->image)->not->toBe($oldPath);
    Storage::disk('public')->assertExists($setting->image);
    Storage::disk('public')->assertMissing($oldPath);
    $this->get(MediaStorage::url($setting->image))->assertOk();
});

test('gcash qr images are accessible from the payment form', function () {
    $this->actingAs($this->admin)->post(route('admin.landing-page.update', 'contact'), [
        'gcash_number' => '09171234567',
        'gcash_qr_code' => UploadedFile::fake()->image('qr.png'),
    ])->assertSessionHasNoErrors();

    $url = MediaStorage::url(SiteSetting::where('section', 'contact')->sole()->gcash_qr_code);
    $this->get('/book-now')->assertInertia(fn (Assert $page) => $page->where('gcash.qr_code_url', $url));
    $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/png');
});

test('about gallery images are stored and exposed through the shared media URLs', function () {
    $this->actingAs($this->admin)->post(route('admin.landing-page.about.media.store'), [
        'pool' => 'upper', 'category' => 'room',
        'media' => [UploadedFile::fake()->image('one.jpg'), UploadedFile::fake()->image('two.png')],
    ])->assertSessionHasNoErrors();

    $media = SiteSetting::where('section', 'about')->sole()->media;
    expect($media)->toHaveCount(2);

    foreach ($media as $image) {
        Storage::disk('public')->assertExists($image->media_path);
        $this->get(MediaStorage::url($image->media_path))->assertOk();
    }

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('about.media.0.media_path', MediaStorage::url($media[0]->media_path)));
    $this->get(route('admin.landing-page.index'))->assertInertia(fn (Assert $page) => $page
        ->where('about.media.1.media_url', MediaStorage::url($media[1]->media_path)));

    $this->delete(route('admin.landing-page.media.destroy', $media[1]))->assertSessionHasNoErrors();
    $this->assertDatabaseMissing('site_setting_media', ['id' => $media[1]->id]);
    Storage::disk('public')->assertMissing($media[1]->media_path);
    Storage::disk('public')->assertExists($media[0]->media_path);
    $this->get(MediaStorage::url($media[1]->media_path))->assertNotFound();
});

test('resort covers and galleries remain accessible after uploads and cover changes', function () {
    $details = ['name' => 'Garden Pool', 'price' => 8000, 'max_pax' => 20, 'status' => 'active'];
    $this->actingAs($this->admin)->post(route('admin.resort-options.store'), [
        ...$details,
        'images' => [UploadedFile::fake()->image('cover.jpg'), UploadedFile::fake()->image('gallery.png')],
    ])->assertSessionHasNoErrors();

    $option = ResortOption::sole();
    $cover = $option->image;
    $gallery = $option->images()->sole();
    $galleryPath = $gallery->image_path;
    $this->get(MediaStorage::url($cover))->assertOk();
    $this->get(MediaStorage::url($galleryPath))->assertOk();

    // Actual browser uploads use POST with method spoofing for multipart PUT requests.
    $this->post(route('admin.resort-options.update', $option), [
        ...$details, '_method' => 'put', 'images' => [UploadedFile::fake()->image('more.jpg')],
    ])->assertSessionHasNoErrors();

    $this->post(route('admin.resort-options.images.store', $option), [
        'images' => [UploadedFile::fake()->image('another.jpg')],
    ])->assertSessionHasNoErrors();
    expect($option->images()->count())->toBe(3);

    $this->post(route('admin.resort-options.images.cover', $gallery))->assertSessionHasNoErrors();
    expect($option->refresh()->image)->toBe($galleryPath);
    expect($gallery->refresh()->image_path)->toBe($cover);
    Storage::disk('public')->assertExists([$cover, $galleryPath]);

    $this->get(route('admin.resort-options.index'))->assertInertia(fn (Assert $page) => $page
        ->where('options.0.image', MediaStorage::url($galleryPath)));
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('resortOptions.0.image', MediaStorage::url($galleryPath)));
    $this->get('/book-now')->assertInertia(fn (Assert $page) => $page
        ->where('resortOptions.0.image', MediaStorage::url($galleryPath)));

    $this->delete(route('admin.resort-options.images.destroy', $gallery))->assertSessionHasNoErrors();
    $this->assertDatabaseMissing('resort_option_images', ['id' => $gallery->id]);
    Storage::disk('public')->assertMissing($cover);
    Storage::disk('public')->assertExists($galleryPath);
    $this->get(MediaStorage::url($galleryPath))->assertOk();
});

test('local media works without a public symlink and supports head and conditional requests', function () {
    $path = UploadedFile::fake()->image('photo.jpg')->store('site-settings', 'public');
    // Storage::fake is outside public/storage, so this request cannot depend on the symlink.
    $url = MediaStorage::url($path);
    $response = $this->get($url)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    $this->head($url)->assertOk()->assertHeader('Content-Type', 'image/jpeg');
    $this->withHeaders(['If-None-Match' => $response->headers->get('ETag')])->get($url)->assertStatus(304);
});

test('public media cannot expose payment proofs or unsafe files', function () {
    Storage::disk('local')->put('booking-payment-proofs/private.jpg', 'private payment data');
    Storage::disk('public')->put('site-settings/unsafe.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    Storage::disk('public')->put('site-settings/fake.jpg', '<?php echo "not an image";');

    foreach ([
        '/media/booking-payment-proofs/private.jpg',
        '/media/site-settings/../../private/booking-payment-proofs/private.jpg',
        '/media/site-settings/unsafe.svg',
        '/media/site-settings/fake.jpg',
        '/media/site-settings/missing.jpg',
    ] as $url) {
        $this->get($url)->assertNotFound();
    }
});

test('public media rejects symlinks that escape the upload disk', function () {
    $path = UploadedFile::fake()->image('private.jpg')->store('booking-payment-proofs', 'local');
    Storage::disk('public')->makeDirectory('site-settings');
    symlink(Storage::disk('local')->path($path), Storage::disk('public')->path('site-settings/link.jpg'));

    $this->get('/media/site-settings/link.jpg')->assertNotFound();
});

test('media respects configured local roots and explicit CDN URLs', function () {
    config()->set('filesystems.disks.alternate', ['driver' => 'local']);
    config()->set('filesystems.uploads_disk', 'alternate');
    Storage::fake('alternate');
    $path = UploadedFile::fake()->image('alternate.jpg')->store('site-settings', 'alternate');
    $this->get(MediaStorage::url($path))->assertOk();

    config()->set('filesystems.public_media_url', 'https://cdn.example.test/images');
    expect(MediaStorage::url('site-settings/with space.jpg'))->toBe('https://cdn.example.test/images/site-settings/with%20space.jpg');
});

test('external and object-storage image URLs are preserved', function () {
    expect(MediaStorage::url('https://cdn.example.test/photo.jpg'))->toBe('https://cdn.example.test/photo.jpg');
    config()->set('filesystems.uploads_disk', 's3');
    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('url')->once()->with('site-settings/photo.jpg')->andReturn('https://bucket.example.test/site-settings/photo.jpg');
    Storage::shouldReceive('disk')->with('s3')->andReturn($disk);

    expect(MediaStorage::url('site-settings/photo.jpg'))->toBe('https://bucket.example.test/site-settings/photo.jpg');
});

test('legacy disk-relative and storage-prefixed paths use the same image endpoint', function () {
    expect(MediaStorage::url('site-settings/photo.jpg'))->toBe('/media/site-settings/photo.jpg');
    expect(MediaStorage::url('/storage/site-settings/photo.jpg'))->toBe('/media/site-settings/photo.jpg');
    expect(MediaStorage::url('storage/site-settings/photo.jpg'))->toBe('/media/site-settings/photo.jpg');
    expect(MediaStorage::url(null))->toBeNull();
});

test('failed image replacements preserve the previous file and database value', function (bool $throws) {
    $disk = Storage::disk('public');
    $old = UploadedFile::fake()->image('old.jpg')->store('site-settings', 'public');
    $setting = SiteSetting::create(['section' => 'home', 'image' => $old]);
    $failingDisk = Mockery::mock(FilesystemAdapter::class);
    $write = $failingDisk->shouldReceive('putFileAs')->once();
    if ($throws) {
        $write->andThrow(UnableToWriteFile::atLocation('site-settings/new.jpg'));
    } else {
        $write->andReturn(false);
    }
    Storage::shouldReceive('disk')->with('public')->andReturn($failingDisk);

    $this->actingAs($this->admin)->post(route('admin.landing-page.update', 'home'), [
        'image' => UploadedFile::fake()->image('new.jpg'),
    ])->assertSessionHasErrors('image');

    expect($setting->refresh()->image)->toBe($old);
    $disk->assertExists($old);
})->with([false, true]);

test('a failure in a gallery batch rolls back records and removes only new files', function () {
    $disk = Storage::disk('public');
    $failingDisk = Mockery::mock($disk)->makePartial();
    $writes = 0;
    $failingDisk->shouldReceive('putFileAs')->andReturnUsing(function (...$arguments) use ($disk, &$writes) {
        return ++$writes === 2 ? false : $disk->putFileAs(...$arguments);
    });
    Storage::shouldReceive('disk')->with('public')->andReturn($failingDisk);

    $this->actingAs($this->admin)->post(route('admin.resort-options.store'), [
        'name' => 'Pool', 'price' => 8000, 'max_pax' => 20, 'status' => 'active',
        'images' => [UploadedFile::fake()->image('one.jpg'), UploadedFile::fake()->image('two.jpg')],
    ])->assertSessionHasErrors('images.1');

    $this->assertDatabaseCount('resort_options', 0);
    $this->assertDatabaseCount('resort_option_images', 0);
    expect($disk->allFiles())->toBeEmpty();
});
