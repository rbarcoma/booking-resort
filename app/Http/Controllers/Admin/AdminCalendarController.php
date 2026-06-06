<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingCalendarEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminCalendarController extends Controller
{
    public function index()
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $entries = BookingCalendarEntry::query()
            ->with(['booking.resortOption:id,name'])
            ->latest()
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'calendar_date' => $entry->calendar_date?->format('Y-m-d'),
                    'status' => $entry->status,
                    'booking' => [
                        'id' => $entry->booking?->id,
                        'booking_reference' => $entry->booking?->booking_reference,
                        'full_name' => $entry->booking?->full_name,
                        'booking_time' => $entry->booking?->booking_time,
                        'option' => $entry->booking?->resortOption?->name,
                        'booking_status' => $entry->booking?->booking_status,
                    ],
                ];
            });

        $confirmedBookings = Booking::query()
            ->with('resortOption:id,name')
            ->where('booking_status', 'Confirmed')
            ->whereDoesntHave('calendarEntries')
            ->latest()
            ->get()
            ->map(fn (Booking $booking, int $index) => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'full_name' => $booking->full_name,
                'booking_date' => $booking->booking_date?->format('Y-m-d'),
                'booking_time' => $booking->booking_time,
                'option' => $booking->resortOption?->name,
                'booking_status' => $booking->booking_status,
                'is_latest' => $index === 0,
            ])
            ->values();

        return Inertia::render('admin/calendar/index', [
            'entries' => $entries,
            'confirmedBookings' => $confirmedBookings,
            'flash' => [
                'success' => session('success'),
            ],
        ]);
    }

    public function store(Request $request, Booking $booking)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        abort_unless($booking->booking_status === 'Confirmed', 422);

        BookingCalendarEntry::firstOrCreate(
            [
                'booking_id' => $booking->id,
                'calendar_date' => $booking->booking_date,
            ],
            [
                'status' => 'Confirmed',
            ]
        );

        return redirect()
            ->back()
            ->with('success', 'Booking added to calendar successfully.');
    }

    public function destroy(BookingCalendarEntry $calendarEntry)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $calendarEntry->delete();

        return redirect()
            ->back()
            ->with('success', 'Calendar entry deleted successfully.');
    }
}
