<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\SiteSettingMedia;
use App\Support\FacebookMessenger;
use App\Support\GoogleMapsEmbed;
use App\Support\MediaStorage;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    public function index()
    {
        $sections = ['home', 'about', 'contact'];

        foreach ($sections as $section) {
            SiteSetting::firstOrCreate(
                ['section' => $section],
                ['section' => $section]
            );
        }

        $settings = SiteSetting::query()
            ->with('media')
            ->whereIn('section', $sections)
            ->get()
            ->keyBy('section');

        return Inertia::render('admin/landing-page/index', [
            'home' => $this->siteSettingPayload($settings['home']),
            'about' => $this->siteSettingPayload($settings['about']),
            'contact' => $this->siteSettingPayload($settings['contact']),
            'galleryOptions' => SiteSettingMedia::galleryOptions(),
        ]);
    }

    public function update(Request $request, string $section)
    {
        abort_unless(in_array($section, ['home', 'about', 'contact']), 404);

        $siteSetting = SiteSetting::firstOrCreate(['section' => $section]);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'gcash_name' => ['nullable', 'string', 'max:255'],
            'gcash_number' => ['nullable', 'string', 'max:50'],
            'gcash_qr_code' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'email' => ['nullable', 'email', 'max:255'],
            'facebook_link' => ['bail', 'nullable', 'string', 'max:255', function ($attribute, $value, $fail) {
                if (FacebookMessenger::pageUrl($value) === null) {
                    $fail('Enter the public Facebook Page URL here. Use the separate Messenger link field for chat links.');
                }
            }],
            'messenger_link' => ['bail', 'nullable', 'string', 'max:255', function ($attribute, $value, $fail) {
                if (FacebookMessenger::pageIdentifier($value) === null) {
                    $fail('Enter a facebook.com/messages/t/... or m.me chat link, not a post or share link.');
                }
            }],
            'address' => ['nullable', 'string'],
            'map_embed_url' => ['bail', 'nullable', 'string', 'max:12000', function ($attribute, $value, $fail) {
                if (GoogleMapsEmbed::url($value) === null) {
                    $fail('Use Google Maps → Share → Embed a map → Copy HTML. Paste that HTML or its https://www.google.com/maps/embed?pb=... URL, not a search or share link.');
                }
            }],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if (array_key_exists('map_embed_url', $validated)) {
            $validated['map_embed_url'] = GoogleMapsEmbed::url($validated['map_embed_url']);
        }

        MediaStorage::persist(function (Closure $store) use ($request, $siteSetting, $validated) {
            $setting = SiteSetting::query()->lockForUpdate()->findOrFail($siteSetting->id);
            $replacedPaths = [];

            foreach (['image' => 'site-settings', 'gcash_qr_code' => 'site-settings/gcash'] as $field => $directory) {
                unset($validated[$field]);

                if ($request->hasFile($field)) {
                    $replacedPaths[] = $setting->{$field};
                    $validated[$field] = $store($request->file($field), $directory, $field);
                }
            }

            $setting->update($validated);

            // Keep existing images until all new files and database changes are saved.
            foreach ($replacedPaths as $path) {
                MediaStorage::deleteAfterCommit($path);
            }
        });

        return back()->with('success', ucfirst($section).' section updated successfully.');
    }

    public function storeAboutMedia(Request $request)
    {
        $about = SiteSetting::firstOrCreate(['section' => 'about']);

        $validated = $request->validate([
            'media' => ['required', 'array'],
            'media.*' => ['file', 'mimes:jpg,jpeg,png,webp,mp4,mov,webm,ogg', 'max:51200'],
            'pool' => ['required', Rule::in(array_keys(SiteSettingMedia::POOLS))],
            'category' => ['required', Rule::in(array_keys(SiteSettingMedia::CATEGORIES))],
        ]);

        MediaStorage::persist(function (Closure $store) use ($about, $validated) {
            $about = SiteSetting::query()->lockForUpdate()->findOrFail($about->id);
            $lastSortOrder = (int) $about->media()->max('sort_order');

            foreach ($validated['media'] as $index => $file) {
                $mimeType = (string) $file->getMimeType();
                $mediaType = str_starts_with($mimeType, 'image/') ? 'image' : 'video';

                $about->media()->create([
                    'media_path' => $store($file, 'site-settings/about-media', "media.{$index}"),
                    'media_type' => $mediaType,
                    'label' => $mediaType === 'video' ? 'About video' : 'About image',
                    'sort_order' => $lastSortOrder + $index + 1,
                    'pool' => $validated['pool'],
                    'category' => $validated['category'],
                ]);
            }
        });

        return back()->with('success', 'About media uploaded successfully.');
    }

    public function updateMedia(Request $request, SiteSettingMedia $media)
    {
        abort_unless($media->siteSetting->section === 'about', 404);

        $validated = $request->validate([
            'pool' => ['required', Rule::in(array_keys(SiteSettingMedia::POOLS))],
            'category' => ['required', Rule::in(array_keys(SiteSettingMedia::CATEGORIES))],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $media->update($validated);

        return back()->with('success', 'Image grouping updated successfully.');
    }

    public function destroyMedia(SiteSettingMedia $media)
    {
        DB::transaction(function () use ($media) {
            $setting = SiteSetting::query()->lockForUpdate()->findOrFail($media->site_setting_id);
            $media = SiteSettingMedia::query()->lockForUpdate()->findOrFail($media->id);
            // A migrated legacy image may also be the standalone About image.
            if ($setting->image === $media->media_path) {
                $setting->update(['image' => null]);
            }
            $media->delete();
            MediaStorage::deleteAfterCommit($media->media_path);
        });

        return back()->with('success', 'About media deleted successfully.');
    }

    private function siteSettingPayload(SiteSetting $siteSetting): array
    {
        return [
            'id' => $siteSetting->id,
            'section' => $siteSetting->section,
            'title' => $siteSetting->title,
            'subtitle' => $siteSetting->subtitle,
            'description' => $siteSetting->description,
            'image' => MediaStorage::url($siteSetting->image),
            'image_url' => MediaStorage::url($siteSetting->image),
            'contact_number' => $siteSetting->contact_number,
            'gcash_name' => $siteSetting->gcash_name,
            'gcash_number' => $siteSetting->gcash_number,
            'gcash_qr_code' => MediaStorage::url($siteSetting->gcash_qr_code),
            'email' => $siteSetting->email,
            'facebook_link' => $siteSetting->facebook_link,
            'messenger_link' => $siteSetting->messenger_link,
            'address' => $siteSetting->address,
            'map_embed_url' => $siteSetting->map_embed_url,
            'media' => $siteSetting->media
                ->sortBy('sort_order')
                ->map(fn (SiteSettingMedia $media) => [
                    'id' => $media->id,
                    'media_path' => MediaStorage::url($media->media_path),
                    'media_url' => MediaStorage::url($media->media_path),
                    'media_type' => $media->media_type,
                    'label' => $media->label,
                    'sort_order' => $media->sort_order,
                    'pool' => $media->pool,
                    'category' => $media->category,
                ])
                ->values(),
        ];
    }
}
