<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingTimeOption;
use App\Models\ResortOption;
use App\Models\User;
use App\Mail\BookingConfirmationToCustomer;
use App\Mail\BookingNotificationToAdmin;
use App\Support\MediaStorage;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function create()
    {
        $resortOptions = ResortOption::query()
            ->where('status', 'active')
            ->select('id', 'name', 'slug', 'image', 'price', 'max_pax', 'description')
            ->orderBy('id')
            ->get()
            ->map(fn (ResortOption $option) => [
                'id' => $option->id,
                'name' => $option->name,
                'slug' => $option->slug,
                'image' => MediaStorage::url($option->image),
                'price' => $option->price,
                'max_pax' => $option->max_pax,
                'description' => $option->description,
            ])
            ->values();

        return Inertia::render('customer/book', [
            'resortOptions' => $resortOptions,
            'timeOptions' => BookingTimeOption::query()
                ->where('status', 'active')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (BookingTimeOption $timeOption) => [
                    'value' => $timeOption->display_label,
                    'label' => $timeOption->display_label,
                ])
                ->values(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'resort_option_id' => ['required', 'exists:resort_options,id'],
            'pax' => ['required', 'integer', 'min:1'],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'booking_time' => [
                'required',
                'string',
                'max:255',
                Rule::in(
                    BookingTimeOption::query()
                        ->where('status', 'active')
                        ->get()
                        ->map(fn (BookingTimeOption $timeOption) => $timeOption->display_label)
                        ->all()
                ),
            ],
            'message' => ['nullable', 'string'],
        ]);

        try {
            $booking = DB::transaction(function () use ($validated) {
                $resortOption = ResortOption::query()
                    ->where('status', 'active')
                    ->whereKey($validated['resort_option_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) $validated['pax'] > (int) $resortOption->max_pax) {
                    throw ValidationException::withMessages([
                        'pax' => 'The number of pax exceeds the maximum allowed for this resort option.',
                    ]);
                }

                $duplicateBooking = Booking::query()
                    ->where('resort_option_id', $validated['resort_option_id'])
                    ->where('booking_date', $validated['booking_date'])
                    ->where('booking_time', $validated['booking_time'])
                    ->exists();

                if ($duplicateBooking) {
                    throw ValidationException::withMessages([
                        'booking_time' => 'This date and time slot is already booked for the selected resort option.',
                    ]);
                }

                return Booking::create([
                    'booking_reference' => $this->generateBookingReference(),
                    'user_id' => null,
                    'full_name' => $validated['full_name'],
                    'facebook' => $validated['facebook'] ?? null,
                    'email' => $validated['email'],
                    'contact_number' => $validated['contact_number'],
                    'resort_option_id' => $validated['resort_option_id'],
                    'pax' => $validated['pax'],
                    'booking_date' => $validated['booking_date'],
                    'booking_time' => $validated['booking_time'],
                    'message' => $validated['message'] ?? null,
                    'total_price' => $resortOption->price,
                    'payment_method' => 'Cash',
                    'booking_status' => Booking::STATUS_PENDING,
                ]);
            });
        } catch (QueryException $e) {
            if ($this->isUniqueBookingSlotViolation($e)) {
                throw ValidationException::withMessages([
                    'booking_time' => 'This date and time slot is already booked for the selected resort option.',
                ]);
            }

            throw $e;
        }

        try {
            $booking->load('resortOption');

            $admin = User::query()->where('role', 'admin')->first();

            if ($admin) {
                Mail::to($admin->email)->send(new BookingNotificationToAdmin($booking));
            }

            Mail::to($booking->email)->send(new BookingConfirmationToCustomer($booking));
        } catch (\Throwable $e) {
            Log::error('Booking email failed: ' . $e->getMessage());
        }

        return redirect()
            ->to(URL::signedRoute('bookings.receipt', $booking))
            ->with('success', 'Booking submitted successfully.');
    }

    public function receipt(Booking $booking)
    {
        $booking->load('resortOption');

        return Inertia::render('customer/receipt', [
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'full_name' => $booking->full_name,
                'facebook' => $booking->facebook,
                'email' => $booking->email,
                'contact_number' => $booking->contact_number,
                'pax' => $booking->pax,
                'booking_date' => $booking->booking_date?->format('Y-m-d'),
                'booking_time' => $booking->booking_time,
                'message' => $booking->message,
                'total_price' => $booking->total_price,
                'payment_method' => $booking->payment_method,
                'booking_status' => $booking->booking_status,
                'created_at' => $this->formatSubmittedAt($booking->created_at),
                'resort_option' => $booking->resortOption ? [
                    'id' => $booking->resortOption->id,
                    'name' => $booking->resortOption->name,
                ] : null,
            ],
            'receipt_pdf_url' => URL::signedRoute('bookings.receipt.pdf', $booking),
        ]);
    }

    public function adminIndex(Request $request)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Booking::STATUSES)],
            'option' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'in:10,50,100'],
        ]);

        $filters = [
            'search' => $validated['search'] ?? '',
            'status' => $validated['status'] ?? '',
            'option' => $validated['option'] ?? '',
            'per_page' => $validated['per_page'] ?? 10,
        ];

        $requestedPerPage = (int) $filters['per_page'];
        $perPage = in_array($requestedPerPage, [10, 50, 100], true)
            ? $requestedPerPage
            : 10;

        $statusCountQuery = $this->adminBookingQuery($filters, false);
        $statusCounts = [
            'showing' => (clone $this->adminBookingQuery($filters))->count(),
            'pending' => (clone $statusCountQuery)->where('booking_status', Booking::STATUS_PENDING)->count(),
            'confirmed' => (clone $statusCountQuery)->where('booking_status', Booking::STATUS_CONFIRMED)->count(),
            'cancelled' => (clone $statusCountQuery)->where('booking_status', Booking::STATUS_CANCELLED)->count(),
        ];

        $bookings = $this->adminBookingQuery($filters)
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($booking) {
                return [
                    'id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'full_name' => $booking->full_name,
                    'facebook' => $booking->facebook,
                    'email' => $booking->email,
                    'contact_number' => $booking->contact_number,
                    'option' => $booking->resortOption?->name,
                    'booking_date' => $booking->booking_date?->format('Y-m-d'),
                    'booking_time' => $booking->booking_time,
                    'pax' => $booking->pax,
                    'total_price' => $booking->total_price,
                    'payment_method' => $booking->payment_method,
                    'booking_status' => $booking->booking_status,
                    'message' => $booking->message,
                    'created_at' => $this->formatSubmittedAt($booking->created_at),
                ];
            });

        $options = ResortOption::query()
            ->orderBy('name')
            ->pluck('name');

        return Inertia::render('admin/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'],
                'option' => $filters['option'],
                'per_page' => $perPage,
            ],
            'statusCounts' => $statusCounts,
            'options' => $options,
            'flash' => [
                'success' => session('success'),
            ],
        ]);
    }

    public function adminShow(Booking $booking)
    {
        $booking->load('resortOption');

        return Inertia::render('admin/bookings/show', [
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'full_name' => $booking->full_name,
                'facebook' => $booking->facebook,
                'email' => $booking->email,
                'contact_number' => $booking->contact_number,
                'pax' => $booking->pax,
                'booking_date' => $booking->booking_date?->format('Y-m-d'),
                'booking_time' => $booking->booking_time,
                'message' => $booking->message,
                'total_price' => $booking->total_price,
                'payment_method' => $booking->payment_method,
                'booking_status' => $booking->booking_status,
                'created_at' => $this->formatSubmittedAt($booking->created_at),
                'resort_option' => $booking->resortOption ? [
                    'id' => $booking->resortOption->id,
                    'name' => $booking->resortOption->name,
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
            ],
        ]);
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $validated = $request->validate([
            'booking_status' => ['required', Rule::in(Booking::STATUSES)],
        ]);

        DB::transaction(function () use ($booking, $validated) {
            $lockedBooking = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            ResortOption::query()
                ->whereKey($lockedBooking->resort_option_id)
                ->lockForUpdate()
                ->first();

            if (! $lockedBooking->canTransitionTo($validated['booking_status'])) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Invalid booking status transition.',
                ]);
            }

            if (
                $validated['booking_status'] === Booking::STATUS_CONFIRMED
                && $this->hasConfirmedSlotConflict($lockedBooking)
            ) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Another confirmed booking already exists for this date, time, and resort option.',
                ]);
            }

            $lockedBooking->update([
                'booking_status' => $validated['booking_status'],
            ]);
        });

        return redirect()
            ->back()
            ->with('success', 'Booking status updated successfully.');
    }

    private function generateBookingReference(): string
    {
        do {
            $reference = 'BK-' . now()->format('Ymd') . '-' . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Booking::query()->where('booking_reference', $reference)->exists());

        return $reference;
    }

    private function formatSubmittedAt(?CarbonInterface $date): ?string
    {
        return $date?->timezone(config('app.display_timezone'))->format('Y-m-d h:i A');
    }

    private function adminBookingQuery(array $filters, bool $includeStatus = true)
    {
        return Booking::query()
            ->with('resortOption:id,name')
            ->when(!empty($filters['search']), function ($query) use ($filters) {
                $search = $filters['search'];

                $query->where(function ($q) use ($search) {
                    $q->where('booking_reference', 'like', "%{$search}%")
                        ->orWhere('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%");
                });
            })
            ->when($includeStatus && !empty($filters['status']), function ($query) use ($filters) {
                $query->where('booking_status', $filters['status']);
            })
            ->when(!empty($filters['option']), function ($query) use ($filters) {
                $query->whereHas('resortOption', function ($q) use ($filters) {
                    $q->where('name', $filters['option']);
                });
            });
    }

    private function hasConfirmedSlotConflict(Booking $booking): bool
    {
        return Booking::query()
            ->whereKeyNot($booking->id)
            ->where('resort_option_id', $booking->resort_option_id)
            ->whereDate('booking_date', $booking->booking_date)
            ->where('booking_time', $booking->booking_time)
            ->where('booking_status', Booking::STATUS_CONFIRMED)
            ->exists();
    }

    private function isUniqueBookingSlotViolation(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (string) ($e->errorInfo[1] ?? '');
        $message = $e->getMessage();

        return str_contains($message, 'unique_booking_slot')
            || str_contains($message, 'bookings_resort_date_time_unique')
            || str_contains($message, 'bookings.resort_option_id, bookings.booking_date, bookings.booking_time')
            || ($sqlState === '23505' && str_contains($message, 'booking'))
            || ($driverCode === '1062' && str_contains($message, 'booking'))
            || ($driverCode === '19' && str_contains($message, 'bookings.booking_time'));
    }

    public function exportReceiptPdf(Booking $booking)
    {
        $booking->load('resortOption');

        $pdf = Pdf::loadView('pdf.receipt', [
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'full_name' => $booking->full_name,
                'facebook' => $booking->facebook,
                'email' => $booking->email,
                'contact_number' => $booking->contact_number,
                'pax' => $booking->pax,
                'booking_date' => $booking->booking_date?->format('Y-m-d'),
                'booking_time' => $booking->booking_time,
                'message' => $booking->message,
                'total_price' => $booking->total_price,
                'payment_method' => $booking->payment_method,
                'booking_status' => $booking->booking_status,
                'created_at' => $this->formatSubmittedAt($booking->created_at),
                'resort_option' => $booking->resortOption ? [
                    'id' => $booking->resortOption->id,
                    'name' => $booking->resortOption->name,
                ] : null,
            ],
        ]);

        return $pdf->download('booking-receipt-' . $booking->booking_reference . '.pdf');
    }
}
