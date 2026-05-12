<?php

namespace App\Http\Controllers;

use App\Models\BookingCalendarEntry;
use App\Models\ResortOption;
use App\Models\SiteSetting;
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

        $bookings = BookingCalendarEntry::query()
            ->with(['booking.resortOption:id,name'])
            ->orderBy('calendar_date')
            ->get()
            ->map(function ($entry) {
                $status = $entry->status ?: optional($entry->booking)->booking_status;

                return [
                    'date' => Carbon::parse($entry->calendar_date)->format('Y-m-d'),
                    'label' => $status === 'Confirmed' ? 'Booked' : $status,
                    'time' => optional($entry->booking)->booking_time ?: 'Time not specified',
                    'pool' => optional($entry->booking?->resortOption)->name,
                    'reference_number' => optional($entry->booking)->booking_reference,
                    'status' => $status,
                ];
            })
            ->values();

        return Inertia::render('landing-page', [
            'home' => [
                'title' => $home?->title,
                'subtitle' => $home?->subtitle,
                'description' => $home?->description,
                'image' => $home?->image ? asset('storage/' . $home->image) : null,
            ],
            'about' => [
                'title' => $about?->title,
                'subtitle' => $about?->subtitle,
                'description' => $about?->description,
                'image' => $about?->image ? asset('storage/' . $about->image) : null,
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
                    'image' => $option->image ? asset('storage/' . $option->image) : null,
                    'price' => $option->price,
                    'max_pax' => $option->max_pax,
                    'description' => $option->description,
                    'images' => $option->images->map(function ($image) {
                        return [
                            'id' => $image->id,
                            'image_path' => asset('storage/' . $image->image_path),
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
