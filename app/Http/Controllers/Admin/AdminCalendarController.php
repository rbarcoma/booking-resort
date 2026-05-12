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

        return Inertia::render('admin/calendar/index', [
            'entries' => $entries,
            'flash' => [
                'success' => session('success'),
            ],
        ]);
    }

    public function store(Request $request, Booking $booking)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $validated = $request->validate([
            'calendar_date' => ['required', 'date'],
        ]);

        BookingCalendarEntry::firstOrCreate(
            [
                'booking_id' => $booking->id,
                'calendar_date' => $validated['calendar_date'],
            ],
            [
                'status' => $booking->booking_status,
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
