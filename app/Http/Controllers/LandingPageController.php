<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ResortOption;
use App\Models\SiteSetting;
use App\Support\MediaStorage;
use Carbon\Carbon;
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

        $home = $settings->get('home');
        $about = $settings->get('about');
        $contact = $settings->get('contact');

        $resortOptions = ResortOption::with([
            'images' => function ($query) {
                $query->orderBy('sort_order');
            }
        ])->get();

        $bookings = Booking::query()
            ->with('resortOption:id,name')
            ->where('booking_status', Booking::STATUS_CONFIRMED)
            ->orderBy('booking_date')
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'date' => Carbon::parse($booking->booking_date)->format('Y-m-d'),
                    'label' => 'Booked',
                    'time' => $booking->booking_time ?: 'Time not specified',
                    'pool' => $booking->resortOption?->name,
                    'reference_number' => $booking->booking_reference,
                    'status' => $booking->booking_status,
                ];
            })
            ->values();

        return Inertia::render('landing-page', [
            'home' => [
                'title' => $home?->title,
                'subtitle' => $home?->subtitle,
                'description' => $home?->description,
                'image' => MediaStorage::url($home?->image),
            ],
            'about' => [
                'title' => $about?->title,
                'subtitle' => $about?->subtitle,
                'description' => $about?->description,
                'image' => MediaStorage::url($about?->image),
                'media' => $about?->media->map(fn ($media) => [
                    'id' => $media->id,
                    'media_path' => MediaStorage::url($media->media_path),
                    'media_type' => $media->media_type,
                    'label' => $media->label,
                    'sort_order' => $media->sort_order,
                ])->values() ?? [],
            ],
            'contact' => [
                'title' => $contact?->title,
                'contact_number' => $contact?->contact_number,
                'email' => $contact?->email,
                'facebook_link' => $contact?->facebook_link,
                'address' => $contact?->address,
                'map_embed_url' => $contact?->map_embed_url,
            ],
            'resortOptions' => $resortOptions->map(function ($option) {
                return [
                    'id' => $option->id,
                    'name' => $option->name,
                    'slug' => $option->slug,
                    'image' => MediaStorage::url($option->image),
                    'price' => $option->price,
                    'max_pax' => $option->max_pax,
                    'description' => $option->description,
                    'images' => $option->images->map(function ($image) {
                        return [
                            'id' => $image->id,
                            'image_path' => MediaStorage::url($image->image_path),
                            'label' => $image->label,
                            'sort_order' => $image->sort_order,
                        ];
                    })->values(),
                ];
            })->values(),
            'bookings' => $bookings,
        ]);
    }
}
