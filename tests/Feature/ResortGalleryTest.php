<?php

use App\Models\SiteSetting;
use App\Models\SiteSettingMedia;
use App\Models\User;
use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config()->set('filesystems.uploads_disk', 'public');
    config()->set('filesystems.public_media_url', null);
    Storage::fake('public');
});

test('the public gallery always contains both pools and all five categories in order', function () {
    $this->get(route('gallery'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('resort-gallery')
        ->has('pools', 2)
        ->where('pools.0.id', 'upper')
        ->where('pools.0.label', 'Upper Pool')
        ->where('pools.1.id', 'lower')
        ->where('pools.1.label', 'Lower Pool')
        ->has('pools.0.categories', 5)
        ->has('pools.1.categories', 5)
        ->where('pools.0.categories', collect(SiteSettingMedia::CATEGORIES)->map(fn ($label, $id) => [
            'id' => $id, 'label' => $label, 'images' => [],
        ])->values()->all()));
});

test('images are uploaded to exactly their selected pool and category', function (string $pool, string $category) {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->post(route('admin.landing-page.about.media.store'), [
        'pool' => $pool,
        'category' => $category,
        'media' => [UploadedFile::fake()->image('photo.jpg')],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $media = SiteSettingMedia::sole();
    expect($media->pool)->toBe($pool);
    expect($media->category)->toBe($category);
    Storage::disk('public')->assertExists($media->media_path);

    $this->get(route('admin.landing-page.index'))->assertInertia(fn (Assert $page) => $page
        ->where('about.media.0.pool', $pool)
        ->where('about.media.0.category', $category)
        ->where('galleryOptions', SiteSettingMedia::galleryOptions()));

    $this->get(route('gallery'))->assertInertia(function (Assert $page) use ($media, $pool, $category) {
        foreach (array_keys(SiteSettingMedia::POOLS) as $poolIndex => $poolKey) {
            foreach (array_keys(SiteSettingMedia::CATEGORIES) as $categoryIndex => $categoryKey) {
                $key = "pools.{$poolIndex}.categories.{$categoryIndex}.images";
                if ($poolKey === $pool && $categoryKey === $category) {
                    $page->has($key, 1)->where("{$key}.0.id", $media->id)->where("{$key}.0.url", MediaStorage::url($media->media_path));
                } else {
                    $page->has($key, 0);
                }
            }
        }
    });
    $this->get(MediaStorage::url($media->media_path))->assertOk()->assertHeader('Content-Type', 'image/jpeg');
})->with(['upper', 'lower'])->with(['room', 'pool', 'kitchen', 'cottage', 'others']);

test('the gallery never mixes pools or includes unassigned files, videos, or other sections', function () {
    $about = SiteSetting::create(['section' => 'about']);
    foreach (array_keys(SiteSettingMedia::POOLS) as $pool) {
        foreach (array_keys(SiteSettingMedia::CATEGORIES) as $category) {
            $about->media()->create([
                'media_path' => "site-settings/{$pool}-{$category}.jpg", 'media_type' => 'image',
                'pool' => $pool, 'category' => $category, 'label' => "{$pool}-{$category}",
            ]);
        }
    }
    $about->media()->create(['media_path' => 'site-settings/legacy.jpg', 'media_type' => 'image']);
    $about->media()->create(['media_path' => 'site-settings/partial.jpg', 'media_type' => 'image', 'pool' => 'upper']);
    $about->media()->create(['media_path' => 'site-settings/video.mp4', 'media_type' => 'video', 'pool' => 'upper', 'category' => 'room']);
    SiteSetting::create(['section' => 'home'])->media()->create([
        'media_path' => 'site-settings/home.jpg', 'media_type' => 'image', 'pool' => 'upper', 'category' => 'room',
    ]);

    $this->get(route('gallery'))->assertInertia(function (Assert $page) {
        foreach (array_keys(SiteSettingMedia::POOLS) as $poolIndex => $pool) {
            foreach (array_keys(SiteSettingMedia::CATEGORIES) as $categoryIndex => $category) {
                $key = "pools.{$poolIndex}.categories.{$categoryIndex}.images";
                $page->has($key, 1)->where("{$key}.0.label", "{$pool}-{$category}");
            }
        }
    });
});

test('admin can assign existing images and move them between pools without changing the file', function () {
    $about = SiteSetting::create(['section' => 'about']);
    $path = UploadedFile::fake()->image('existing.jpg')->store('site-settings/about-media', 'public');
    $media = $about->media()->create(['media_path' => $path, 'media_type' => 'image']);
    $this->actingAs(User::factory()->create(['role' => 'admin']));

    foreach ([['upper', 'room', 0, 0], ['lower', 'kitchen', 1, 2]] as [$pool, $category, $poolIndex, $categoryIndex]) {
        $this->patch(route('admin.landing-page.media.update', $media), [
            'pool' => $pool, 'category' => $category, 'label' => 'Family space',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->get(route('gallery'))->assertInertia(fn (Assert $page) => $page
            ->where("pools.{$poolIndex}.categories.{$categoryIndex}.images.0.id", $media->id)
            ->where("pools.{$poolIndex}.categories.{$categoryIndex}.images.0.label", 'Family space')
            ->has('pools.'.(1 - $poolIndex).'.categories.0.images', 0));
    }

    expect($media->refresh()->media_path)->toBe($path);
    Storage::disk('public')->assertExists($path);

    $this->delete(route('admin.landing-page.media.destroy', $media))->assertSessionHasNoErrors();
    $this->get(route('gallery'))->assertInertia(fn (Assert $page) => $page->has('pools.1.categories.2.images', 0));
    Storage::disk('public')->assertMissing($path);
});

test('invalid or missing grouping is rejected before storing any files', function (array $grouping, string $field) {
    $this->actingAs(User::factory()->create(['role' => 'admin']))->post(route('admin.landing-page.about.media.store'), [
        ...$grouping, 'media' => [UploadedFile::fake()->image('image.jpg')],
    ])->assertSessionHasErrors($field);
    $this->assertDatabaseCount('site_setting_media', 0);
    expect(Storage::disk('public')->allFiles())->toBeEmpty();
})->with([
    'missing pool' => [['category' => 'room'], 'pool'],
    'missing category' => [['pool' => 'upper'], 'category'],
    'unknown pool' => [['pool' => 'mixed', 'category' => 'room'], 'pool'],
    'unknown category' => [['pool' => 'upper', 'category' => 'bedroom'], 'category'],
]);

test('invalid reclassification preserves an existing grouping and cannot edit other sections', function () {
    $about = SiteSetting::create(['section' => 'about']);
    $media = $about->media()->create(['media_path' => 'site-settings/room.jpg', 'media_type' => 'image', 'pool' => 'upper', 'category' => 'room']);
    $this->actingAs(User::factory()->create(['role' => 'admin']));

    $this->patch(route('admin.landing-page.media.update', $media), ['pool' => 'lower', 'category' => 'invalid'])->assertSessionHasErrors('category');
    expect($media->refresh()->pool)->toBe('upper');
    expect($media->category)->toBe('room');

    $homeMedia = SiteSetting::create(['section' => 'home'])->media()->create(['media_path' => 'site-settings/home.jpg', 'media_type' => 'image']);
    $this->patch(route('admin.landing-page.media.update', $homeMedia), ['pool' => 'lower', 'category' => 'room'])->assertNotFound();
});

test('gallery management is admin only while the gallery is public', function () {
    $media = SiteSetting::create(['section' => 'about'])->media()->create(['media_path' => 'site-settings/room.jpg', 'media_type' => 'image']);
    $this->get(route('gallery'))->assertOk();
    $this->post(route('admin.landing-page.about.media.store'))->assertRedirect(route('login'));
    $this->patch(route('admin.landing-page.media.update', $media))->assertRedirect(route('login'));
    $this->delete(route('admin.landing-page.media.destroy', $media))->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create(['role' => 'customer']));
    $this->post(route('admin.landing-page.about.media.store'))->assertForbidden();
    $this->patch(route('admin.landing-page.media.update', $media))->assertForbidden();
    $this->delete(route('admin.landing-page.media.destroy', $media))->assertForbidden();
});

test('the migration preserves old files without guessing a pool and imports a legacy About image only once', function () {
    $migration = require database_path('migrations/2026_09_06_000001_add_gallery_grouping_to_site_setting_media_table.php');
    $migration->down();
    $path = UploadedFile::fake()->image('legacy.jpg')->store('site-settings', 'public');
    $about = SiteSetting::create(['section' => 'about', 'image' => $path]);
    $migration->up();

    $media = $about->media()->sole();
    expect($media->media_path)->toBe($path);
    expect($media->pool)->toBeNull();
    expect($media->category)->toBeNull();
    expect($about->refresh()->image)->toBe($path);
    Storage::disk('public')->assertExists($path);

    $migration->down();
    $migration->up();
    expect(DB::table('site_setting_media')->count())->toBe(1);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->delete(route('admin.landing-page.media.destroy', $media))->assertSessionHasNoErrors();
    expect($about->refresh()->image)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});
