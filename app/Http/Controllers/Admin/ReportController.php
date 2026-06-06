<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ReportsExport;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $data = $this->buildReportData($request);

        return Inertia::render('admin/reports/index', $data);
    }

    public function exportExcel(Request $request)
    {
        $filters = $this->validatedFilters($request);

        $filename = 'booking-reports-'.$this->exportPeriodLabel($filters['export_period']).'-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(
            new ReportsExport($filters),
            $filename
        );
    }

    public function exportPdf(Request $request)
    {
        $data = $this->buildReportData($request);
        $bookings = $this->exportBookings($data['filters'])->get();

        $pdf = Pdf::loadView('pdf.reports', [
            'filters' => $data['filters'],
            'summary' => $data['summary'],
            'bookings' => $bookings,
            'generatedAt' => now(config('app.display_timezone'))->format('Y-m-d h:i A'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('booking-reports-'.$this->exportPeriodLabel($data['filters']['export_period']).'-'.now()->format('Ymd-His').'.pdf');
    }

    private function buildReportData(Request $request): array
    {
        $filters = $this->validatedFilters($request);
        $dateFrom = $filters['date_from'];
        $dateTo = $filters['date_to'];
        $search = $filters['search'];
        $status = $filters['status'];
        $perPage = $filters['per_page'];
        $exportPeriod = $filters['export_period'];

        $baseQuery = $this->applyReportFilters(Booking::query(), $filters);

        $totalBookings = (clone $baseQuery)->count();

        $totalRevenue = (clone $baseQuery)
            ->where('booking_status', 'Confirmed')
            ->sum('total_price');

        $pending = (clone $baseQuery)->where('booking_status', 'Pending')->count();
        $confirmed = (clone $baseQuery)->where('booking_status', 'Confirmed')->count();
        $cancelled = (clone $baseQuery)->where('booking_status', 'Cancelled')->count();

        $bookingsOverTime = (clone $baseQuery)
            ->select(
                DB::raw('DATE(booking_date) as label'),
                DB::raw('COUNT(*) as value')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->label,
                'value' => (int) $item->value,
            ])
            ->values();

        $revenueOverTime = (clone $baseQuery)
            ->where('booking_status', 'Confirmed')
            ->select(
                DB::raw('DATE(booking_date) as label'),
                DB::raw('SUM(total_price) as value')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->label,
                'value' => (float) $item->value,
            ])
            ->values();

        $monthlyBookings = (clone $baseQuery)
            ->select(
                DB::raw($this->monthLabelExpression().' as label'),
                DB::raw('COUNT(*) as value')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->label,
                'value' => (int) $item->value,
            ])
            ->values();

        $monthlyRevenue = (clone $baseQuery)
            ->where('booking_status', 'Confirmed')
            ->select(
                DB::raw($this->monthLabelExpression().' as label'),
                DB::raw('SUM(total_price) as value')
            )
            ->groupBy('label')
            ->orderBy('label')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->label,
                'value' => (float) $item->value,
            ])
            ->values();

        $bookingStatusBreakdown = [
            ['label' => 'Pending', 'value' => $pending],
            ['label' => 'Confirmed', 'value' => $confirmed],
            ['label' => 'Cancelled', 'value' => $cancelled],
        ];

        $mostBookedCategory = (clone $baseQuery)
            ->join('resort_options', 'bookings.resort_option_id', '=', 'resort_options.id')
            ->select(
                'resort_options.name',
                DB::raw('COUNT(bookings.id) as total')
            )
            ->groupBy('resort_options.name')
            ->orderByDesc('total')
            ->first();

        $recentBookingsQuery = $this->exportBookings($filters);

        $recentBookings = $recentBookingsQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($booking) {
                return [
                    'id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'full_name' => $booking->full_name,
                    'email' => $booking->email,
                    'contact_number' => $booking->contact_number,
                    'option' => $booking->resortOption?->name,
                    'booking_date' => $booking->booking_date?->format('Y-m-d'),
                    'booking_time' => $booking->booking_time,
                    'pax' => $booking->pax,
                    'total_price' => $booking->total_price,
                    'booking_status' => $booking->booking_status,
                ];
            });

        return [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
                'export_period' => $exportPeriod,
            ],
            'summary' => [
                'totalBookings' => $totalBookings,
                'totalRevenue' => (float) $totalRevenue,
                'pending' => $pending,
                'confirmed' => $confirmed,
                'cancelled' => $cancelled,
                'mostBookedCategory' => $mostBookedCategory?->name ?? 'N/A',
                'mostBookedCategoryTotal' => $mostBookedCategory?->total ?? 0,
            ],
            'chartSets' => [

                'bookingsOverTime' => $bookingsOverTime,
                'revenueOverTime' => $revenueOverTime,
                'monthlyBookings' => $monthlyBookings,
                'monthlyRevenue' => $monthlyRevenue,
                'bookingStatusBreakdown' => $bookingStatusBreakdown,
            ],
            'recentBookings' => $recentBookings,
        ];
    }

    /**
     * @return array{date_from: ?string, date_to: ?string, search: string, status: string, per_page: int, export_period: string}
     */
    private function validatedFilters(Request $request): array
    {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:Pending,Confirmed,Cancelled'],
            'per_page' => ['nullable', 'integer', 'in:10,50,100'],
            'export_period' => ['nullable', 'in:weekly,monthly,yearly'],
        ]);

        $period = $validated['export_period'] ?? '';
        $periodRange = $this->exportPeriodRange($period);

        return [
            'date_from' => $periodRange['date_from'] ?? ($validated['date_from'] ?? null),
            'date_to' => $periodRange['date_to'] ?? ($validated['date_to'] ?? null),
            'search' => $validated['search'] ?? '',
            'status' => $validated['status'] ?? '',
            'per_page' => (int) ($validated['per_page'] ?? 10),
            'export_period' => $period,
        ];
    }

    /**
     * @param  array{date_from: ?string, date_to: ?string, search: string, status: string, per_page: int, export_period: string}  $filters
     */
    private function applyReportFilters(Builder $query, array $filters): Builder
    {
        $dateColumn = $this->reportDateColumn($filters);

        return $query
            ->when($filters['date_from'], fn ($query, $dateFrom) => $query->whereDate($dateColumn, '>=', $dateFrom))
            ->when($filters['date_to'], fn ($query, $dateTo) => $query->whereDate($dateColumn, '<=', $dateTo))
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('bookings.booking_reference', 'like', "%{$search}%")
                        ->orWhere('bookings.full_name', 'like', "%{$search}%")
                        ->orWhere('bookings.email', 'like', "%{$search}%")
                        ->orWhere('bookings.contact_number', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'], fn ($query, $status) => $query->where('bookings.booking_status', $status));
    }

    /**
     * Export periods are transaction reports, so weekly/monthly/yearly ranges use
     * the submitted date. Normal report filters still use the reservation date.
     *
     * @param  array{export_period: string}  $filters
     */
    private function reportDateColumn(array $filters): string
    {
        return $filters['export_period'] ? 'bookings.created_at' : 'bookings.booking_date';
    }

    /**
     * @param  array{date_from: ?string, date_to: ?string, search: string, status: string, per_page: int, export_period: string}  $filters
     */
    private function exportBookings(array $filters): Builder
    {
        return $this->applyReportFilters(
            Booking::query()->with('resortOption:id,name'),
            $filters,
        )->latest('bookings.created_at');
    }

    private function monthLabelExpression(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', booking_date)"
            : "DATE_FORMAT(booking_date, '%Y-%m')";
    }

    private function exportPeriodRange(string $period): array
    {
        return match ($period) {
            'weekly' => [
                'date_from' => now()->startOfWeek()->toDateString(),
                'date_to' => now()->endOfWeek()->toDateString(),
            ],
            'monthly' => [
                'date_from' => now()->startOfMonth()->toDateString(),
                'date_to' => now()->endOfMonth()->toDateString(),
            ],
            'yearly' => [
                'date_from' => now()->startOfYear()->toDateString(),
                'date_to' => now()->endOfYear()->toDateString(),
            ],
            default => [],
        };
    }

    private function exportPeriodLabel(string $period): string
    {
        return match ($period) {
            'weekly' => 'weekly',
            'monthly' => 'monthly',
            'yearly' => 'yearly',
            default => 'filtered',
        };
    }
}
