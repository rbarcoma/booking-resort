<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BookingTimeOption;
use App\Models\ResortOption;
use App\Models\ResortOptionImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ResortOptionController extends Controller
{
    public function index()
    {
        $options = ResortOption::with('images')
            ->orderBy('id')
            ->get()
            ->map(function ($option) {
                return [
                    'id' => $option->id,
                    'name' => $option->name,
                    'slug' => $option->slug,
                    'image' => $option->image ? asset('storage/' . $option->image) : null,
                    'price' => $option->price,
                    'max_pax' => $option->max_pax,
                    'description' => $option->description,
                    'status' => $option->status,
                    'images' => $option->images->map(function ($image) {
                        return [
                            'id' => $image->id,
                            'label' => $image->label,
                            'image_path' => asset('storage/' . $image->image_path),
                            'sort_order' => $image->sort_order,
                        ];
                    })->values(),
                ];
            })->values();

        return Inertia::render('admin/resort-options/index', [
            'options' => $options,
            'timeOptions' => BookingTimeOption::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (BookingTimeOption $timeOption) => [
                    'id' => $timeOption->id,
                    'label' => $timeOption->label,
                    'time_range' => $timeOption->time_range,
                    'display_label' => $timeOption->display_label,
                    'status' => $timeOption->status,
                    'sort_order' => $timeOption->sort_order,
                ])
                ->values(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:resort_options,name'],
            'price' => ['required', 'numeric', 'min:0'],
            'max_pax' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (ResortOption::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $uploadedImages = $request->file('images', []);
        $imagePath = null;

        if (!empty($uploadedImages)) {
            $imagePath = $uploadedImages[0]->store('resort-options', 'public');
        }

        $resortOption = ResortOption::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'image' => $imagePath,
            'price' => $validated['price'],
            'max_pax' => $validated['max_pax'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

        foreach (array_slice($uploadedImages, 1) as $index => $file) {
            $resortOption->images()->create([
                'image_path' => $file->store('resort-option-gallery', 'public'),
                'label' => null,
                'sort_order' => $index + 1,
            ]);
        }

        return back()->with('success', 'New resort category added successfully.');
    }

    public function update(Request $request, ResortOption $resortOption)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:resort_options,name,' . $resortOption->id],
            'price' => ['required', 'numeric', 'min:0'],
            'max_pax' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($validated['name'] !== $resortOption->name) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (
                ResortOption::where('slug', $slug)
                    ->where('id', '!=', $resortOption->id)
                    ->exists()
            ) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            $validated['slug'] = $slug;
        }

        unset($validated['images']);

        $uploadedImages = $request->file('images', []);
        $hadCoverImage = (bool) $resortOption->image;

        if (!empty($uploadedImages) && !$hadCoverImage) {
            $validated['image'] = $uploadedImages[0]->store('resort-options', 'public');
        }

        $resortOption->update($validated);

        $lastSortOrder = (int) $resortOption->images()->max('sort_order');

        $galleryImages = $hadCoverImage ? $uploadedImages : array_slice($uploadedImages, 1);

        foreach ($galleryImages as $index => $file) {
            $resortOption->images()->create([
                'image_path' => $file->store('resort-option-gallery', 'public'),
                'label' => null,
                'sort_order' => $lastSortOrder + $index + 1,
            ]);
        }

        return back()->with('success', $resortOption->fresh()->name . ' updated successfully.');
    }

    public function storeImage(Request $request, ResortOption $resortOption)
    {
        $validated = $request->validate([
            'images' => ['required', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $lastSortOrder = (int) $resortOption->images()->max('sort_order');

        foreach ($validated['images'] as $index => $file) {
            $path = $file->store('resort-option-gallery', 'public');

            $resortOption->images()->create([
                'image_path' => $path,
                'label' => null,
                'sort_order' => $lastSortOrder + $index + 1,
            ]);
        }

        return back()->with('success', 'Images uploaded.');
    }

    public function makeCoverImage(ResortOptionImage $image)
    {
        $resortOption = $image->resortOption;
        $currentCover = $resortOption->image;

        $resortOption->update([
            'image' => $image->image_path,
        ]);

        if ($currentCover) {
            $image->update([
                'image_path' => $currentCover,
            ]);
        } else {
            $image->delete();
        }

        return back()->with('success', 'Cover image updated.');
    }

    public function destroyImage(ResortOptionImage $image)
    {
        if ($image->image_path && Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return back()->with('success', 'Image deleted.');
    }

    public function storeTimeOption(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'time_range' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $validated['sort_order'] = ((int) BookingTimeOption::query()->max('sort_order')) + 1;

        BookingTimeOption::create($validated);

        return back()->with('success', 'Booking time added.');
    }

    public function updateTimeOption(Request $request, BookingTimeOption $timeOption)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'time_range' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $timeOption->update($validated);

        return back()->with('success', 'Booking time updated.');
    }

    public function destroyTimeOption(Request $request, BookingTimeOption $timeOption)
    {
        $request->validate([
            'password' => ['required', 'current_password:web'],
        ]);

        $timeOption->delete();

        return back()->with('success', 'Booking time deleted.');
    }
}
