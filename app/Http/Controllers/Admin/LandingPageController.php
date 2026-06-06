<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\SiteSettingMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'home' => $settings['home'],
            'about' => $settings['about'],
            'contact' => $settings['contact'],
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
            'email' => ['nullable', 'email', 'max:255'],
            'facebook_link' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'map_embed_url' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            if ($siteSetting->image && Storage::disk('public')->exists($siteSetting->image)) {
                Storage::disk('public')->delete($siteSetting->image);
            }

            $validated['image'] = $request->file('image')->store('site-settings', 'public');
        }

        $siteSetting->update($validated);

        return back()->with('success', ucfirst($section) . ' section updated successfully.');
    }

    public function storeAboutMedia(Request $request)
    {
        $about = SiteSetting::firstOrCreate(['section' => 'about']);

        $validated = $request->validate([
            'media' => ['required', 'array'],
            'media.*' => ['file', 'mimes:jpg,jpeg,png,webp,mp4,mov,webm,ogg', 'max:51200'],
        ]);

        $uploadedMedia = $request->file('media', []);
        $uploadedMedia = $uploadedMedia instanceof UploadedFile ? [$uploadedMedia] : $uploadedMedia;

        $lastSortOrder = (int) $about->media()->max('sort_order');

        foreach ($uploadedMedia as $index => $file) {
            $mimeType = (string) $file->getMimeType();
            $mediaType = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

            $about->media()->create([
                'media_path' => $file->store('site-settings/about-media', 'public'),
                'media_type' => $mediaType,
                'label' => $mediaType === 'video' ? 'About video' : 'About image',
                'sort_order' => $lastSortOrder + $index + 1,
            ]);
        }

        return back()->with('success', 'About media uploaded successfully.');
    }

    public function destroyMedia(SiteSettingMedia $media)
    {
        if ($media->media_path && Storage::disk('public')->exists($media->media_path)) {
            Storage::disk('public')->delete($media->media_path);
        }

        $media->delete();

        return back()->with('success', 'About media deleted successfully.');
    }
}
