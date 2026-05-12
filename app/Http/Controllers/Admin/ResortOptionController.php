<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;

        while (ResortOption::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('resort-options', 'public');
        }

        ResortOption::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'image' => $imagePath,
            'price' => $validated['price'],
            'max_pax' => $validated['max_pax'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ]);

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
            'image' => ['nullable', 'image', 'max:2048'],
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

        if ($request->hasFile('image')) {
            if ($resortOption->image && Storage::disk('public')->exists($resortOption->image)) {
                Storage::disk('public')->delete($resortOption->image);
            }

            $validated['image'] = $request->file('image')->store('resort-options', 'public');
        }

        $resortOption->update($validated);

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

    public function destroyImage(ResortOptionImage $image)
    {
        if ($image->image_path && Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return back()->with('success', 'Image deleted.');
    }
}
