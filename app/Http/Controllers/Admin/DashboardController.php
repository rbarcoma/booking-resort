<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalBookings = Booking::count();
        $pendingBookings = Booking::where('booking_status', 'Pending')->count();
        $confirmedBookings = Booking::where('booking_status', 'Confirmed')->count();
        $cancelledBookings = Booking::where('booking_status', 'Cancelled')->count();

        $totalRevenue = Booking::where('booking_status', 'Confirmed')->sum('total_price');

        $mostBookedCategory = Booking::join('resort_options', 'bookings.resort_option_id', '=', 'resort_options.id')
            ->select('resort_options.name', DB::raw('COUNT(bookings.id) as total'))
            ->groupBy('resort_options.name')
            ->orderByDesc('total')
            ->first();

        $recentBookings = Booking::query()
            ->with('resortOption:id,name')
            ->latest()
            ->limit(6)
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'full_name' => $booking->full_name,
                    'option' => $booking->resortOption?->name,
                    'booking_date' => $booking->booking_date?->format('Y-m-d'),
                    'booking_time' => $booking->booking_time,
                    'total_price' => $booking->total_price,
                    'booking_status' => $booking->booking_status,
                ];
            });

        return Inertia::render('admin/dashboard', [
            'summary' => [
                'totalBookings' => $totalBookings,
                'pendingBookings' => $pendingBookings,
                'confirmedBookings' => $confirmedBookings,
                'cancelledBookings' => $cancelledBookings,
                'totalRevenue' => (float) $totalRevenue,
                'mostBookedCategory' => $mostBookedCategory?->name ?? 'N/A',
                'mostBookedCategoryTotal' => $mostBookedCategory?->total ?? 0,
            ],
            'recentBookings' => $recentBookings,
        ]);
    }
}
