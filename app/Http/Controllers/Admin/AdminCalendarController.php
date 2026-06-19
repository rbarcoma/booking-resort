<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Inertia\Inertia;

class AdminCalendarController extends Controller
{
    public function index()
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $entries = Booking::query()
            ->with('resortOption:id,name')
            ->where('booking_status', Booking::STATUS_CONFIRMED)
            ->latest()
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'id' => $booking->id,
                    'calendar_date' => $booking->booking_date?->format('Y-m-d'),
                    'status' => $booking->booking_status,
                    'booking' => [
                        'id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'full_name' => $booking->full_name,
                        'booking_time' => $booking->booking_time,
                        'option' => $booking->resortOption?->name,
                        'booking_status' => $booking->booking_status,
                    ],
                ];
            });

        return Inertia::render('admin/calendar/index', [
            'entries' => $entries,
            'flash' => [
                'success' => session('success'),
            ],
        ]);
    }
}
