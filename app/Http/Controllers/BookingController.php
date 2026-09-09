<?php

namespace App\Http\Controllers;

use App\Mail\BookingConfirmationToCustomer;
use App\Mail\BookingNotificationToAdmin;
use App\Models\Booking;
use App\Models\BookingTimeOption;
use App\Models\ResortOption;
use App\Models\SiteSetting;
use App\Models\User;
use App\Services\BookingPaymentService;
use App\Services\N8nBookingWebhook;
use App\Support\FacebookMessenger;
use App\Support\MediaStorage;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use League\Flysystem\FilesystemException;

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
            'messengerUrl' => FacebookMessenger::url(SiteSetting::where('section', 'contact')->value('messenger_link')),
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
            'gcash' => $this->gcashDetails(),
        ]);
    }

    public function paymentDetails(Request $request, BookingPaymentService $paymentService)
    {
        $validated = $request->validate(array_merge($this->reservationRules(), [
            'payment_type' => ['required', Rule::in(Booking::PAYMENT_TYPES)],
            'payment_quote' => ['nullable', 'string', 'max:2048'],
        ]));

        $resortOption = ResortOption::query()
            ->where('status', 'active')
            ->findOrFail($validated['resort_option_id']);

        $this->validateReservationDetails($validated, $resortOption);

        $amounts = $paymentService->calculate($resortOption->price, $validated['payment_type']);
        $reference = $paymentService->referenceFromQuote(
            $validated['payment_quote'] ?? null,
            $resortOption->id,
        ) ?? $paymentService->generateReference();

        return response()->json([
            'booking_reference' => $reference,
            'payment_method' => Booking::PAYMENT_METHOD_GCASH,
            'payment_type' => $validated['payment_type'],
            'total_reservation_amount' => $amounts['total'],
            'amount_to_pay' => $amounts['amount_paid'],
            'remaining_balance' => $amounts['remaining_balance'],
            'payment_quote' => $paymentService->createQuote(
                $reference,
                $resortOption->id,
                $validated['payment_type'],
                $amounts,
            ),
        ]);
    }

    public function store(
        Request $request,
        BookingPaymentService $paymentService,
        N8nBookingWebhook $n8nWebhook,
    ) {
        $validated = $request->validate(array_merge($this->reservationRules(), [
            'payment_type' => ['required', Rule::in(Booking::PAYMENT_TYPES)],
            'payment_quote' => ['required', 'string', 'max:2048'],
            'proof_of_payment' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]));

        $proofPath = null;

        try {
            $booking = DB::transaction(function () use ($validated, $request, $paymentService, &$proofPath) {
                $resortOption = ResortOption::query()
                    ->where('status', 'active')
                    ->whereKey($validated['resort_option_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->validateReservationDetails($validated, $resortOption);

                $amounts = $paymentService->calculate($resortOption->price, $validated['payment_type']);
                $quote = $paymentService->validateQuote(
                    $validated['payment_quote'],
                    $resortOption->id,
                    $validated['payment_type'],
                    $amounts['total_cents'],
                );

                if (Booking::query()->where('booking_reference', $quote['reference'])->exists()) {
                    throw ValidationException::withMessages([
                        'payment_quote' => 'This payment session has already been used. Please start a new booking.',
                    ]);
                }

                try {
                    $proofPath = $request->file('proof_of_payment')?->store(
                        'booking-payment-proofs/'.now()->format('Y/m'),
                        ['disk' => 'local', 'visibility' => 'private'],
                    );
                } catch (FilesystemException $exception) {
                    report($exception);
                    $proofPath = null;
                }

                if (! $proofPath) {
                    throw ValidationException::withMessages([
                        'proof_of_payment' => 'The proof of payment could not be stored. Please try again.',
                    ]);
                }

                return Booking::create([
                    'booking_reference' => $quote['reference'],
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
                    'total_price' => $amounts['total'],
                    'payment_method' => Booking::PAYMENT_METHOD_GCASH,
                    'payment_type' => $validated['payment_type'],
                    'amount_paid' => $amounts['amount_paid'],
                    'remaining_balance' => $amounts['remaining_balance'],
                    'proof_of_payment_path' => $proofPath,
                    'booking_status' => Booking::STATUS_PENDING,
                    'payment_status' => Booking::PAYMENT_STATUS_FOR_VERIFICATION,
                ]);
            });
        } catch (QueryException $e) {
            if ($proofPath) {
                Storage::disk('local')->delete($proofPath);
            }

            if ($this->isUniqueBookingSlotViolation($e)) {
                throw ValidationException::withMessages([
                    'booking_time' => 'This date and time slot is already booked for the selected resort option.',
                ]);
            }

            throw $e;
        } catch (\Throwable $e) {
            if ($proofPath) {
                Storage::disk('local')->delete($proofPath);
            }

            throw $e;
        }

        $booking->load('resortOption');

        $n8nTriggered = $n8nWebhook->bookingSubmitted($booking);

        try {
            $admin = User::query()->where('role', 'admin')->first();

            if ($admin && ! $n8nTriggered) {
                Mail::to($admin->email)->send(new BookingNotificationToAdmin($booking));
            }

            Mail::to($booking->email)->send(new BookingConfirmationToCustomer($booking));
        } catch (\Throwable $e) {
            Log::error('Booking email failed: '.$e->getMessage());
        }

        return redirect()
            ->to(URL::signedRoute('bookings.receipt', $booking))
            ->with('success', 'Booking submitted successfully.');
    }

    public function receipt(Booking $booking)
    {
        $booking->load('resortOption');

        return Inertia::render('customer/receipt', [
            'messengerUrl' => FacebookMessenger::url(SiteSetting::where('section', 'contact')->value('messenger_link')),
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
                'payment_type' => $booking->payment_type,
                'amount_paid' => $booking->amount_paid,
                'remaining_balance' => $booking->remaining_balance,
                'booking_status' => $booking->booking_status,
                'payment_status' => $booking->payment_status,
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
                    'payment_type' => $booking->payment_type,
                    'amount_paid' => $booking->amount_paid,
                    'remaining_balance' => $booking->remaining_balance,
                    'booking_status' => $booking->booking_status,
                    'payment_status' => $booking->payment_status,
                    'has_payment_proof' => filled($booking->proof_of_payment_path),
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

    public function adminShow(Booking $booking, BookingPaymentService $paymentService)
    {
        $booking->load('resortOption');
        $expectedAmount = in_array($booking->payment_type, Booking::PAYMENT_TYPES, true)
            ? $paymentService->calculate($booking->total_price, $booking->payment_type)['amount_paid']
            : null;

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
                'payment_type' => $booking->payment_type,
                'expected_amount' => $expectedAmount,
                'amount_paid' => $booking->amount_paid,
                'remaining_balance' => $booking->remaining_balance,
                'booking_status' => $booking->booking_status,
                'payment_status' => $booking->payment_status,
                'proof_of_payment_url' => $booking->proof_of_payment_path
                    ? route('admin.bookings.payment-proof', $booking, absolute: false)
                    : null,
                'payment_reviewed_at' => $this->formatSubmittedAt($booking->payment_reviewed_at),
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

    public function viewPaymentProof(Booking $booking)
    {
        abort_unless(auth()->user()?->role === 'admin', 403);
        abort_unless($booking->proof_of_payment_path, 404);

        $disk = Storage::disk('local');
        abort_unless($disk->exists($booking->proof_of_payment_path), 404);

        return $disk->response(
            $booking->proof_of_payment_path,
            $booking->booking_reference.'-payment-proof',
            [
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'private, no-store, max-age=0',
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    public function updateStatus(
        Request $request,
        Booking $booking,
        BookingPaymentService $paymentService,
        N8nBookingWebhook $n8nWebhook,
    ) {
        abort_unless(auth()->user()?->role === 'admin', 403);

        $validated = $request->validate([
            'booking_status' => ['required', Rule::in(Booking::STATUSES)],
        ]);

        $statusChanged = false;
        $previousStatus = null;

        DB::transaction(function () use ($booking, $validated, $paymentService, &$statusChanged, &$previousStatus) {
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

            if ($lockedBooking->booking_status === $validated['booking_status']) {
                return;
            }

            $previousStatus = $lockedBooking->booking_status;

            if (
                $validated['booking_status'] === Booking::STATUS_CONFIRMED
                && $this->hasConfirmedSlotConflict($lockedBooking)
            ) {
                throw ValidationException::withMessages([
                    'booking_status' => 'Another confirmed booking already exists for this date, time, and resort option.',
                ]);
            }

            $updates = [
                'booking_status' => $validated['booking_status'],
            ];

            if (
                $validated['booking_status'] === Booking::STATUS_CONFIRMED
                && $lockedBooking->payment_method === Booking::PAYMENT_METHOD_GCASH
            ) {
                if (
                    ! in_array($lockedBooking->payment_type, Booking::PAYMENT_TYPES, true)
                    || ! $lockedBooking->proof_of_payment_path
                    || ! Storage::disk('local')->exists($lockedBooking->proof_of_payment_path)
                ) {
                    throw ValidationException::withMessages([
                        'booking_status' => 'A valid uploaded payment proof is required before confirmation.',
                    ]);
                }

                $amounts = $paymentService->calculate($lockedBooking->total_price, $lockedBooking->payment_type);
                $updates += [
                    'amount_paid' => $amounts['amount_paid'],
                    'remaining_balance' => $amounts['remaining_balance'],
                    'payment_status' => $lockedBooking->payment_type === Booking::PAYMENT_TYPE_FULL
                        ? Booking::PAYMENT_STATUS_FULLY_PAID
                        : Booking::PAYMENT_STATUS_DOWN_PAYMENT_PAID,
                    'payment_reviewed_at' => now(),
                    'payment_reviewed_by' => auth()->id(),
                ];
            } elseif (
                $validated['booking_status'] === Booking::STATUS_CANCELLED
                && $lockedBooking->booking_status === Booking::STATUS_PENDING
                && $lockedBooking->payment_method === Booking::PAYMENT_METHOD_GCASH
            ) {
                $updates += [
                    'payment_status' => Booking::PAYMENT_STATUS_REJECTED,
                    'payment_reviewed_at' => now(),
                    'payment_reviewed_by' => auth()->id(),
                ];
            }

            $lockedBooking->update($updates);
            $statusChanged = true;
        });

        if ($statusChanged) {
            $booking->refresh()->load('resortOption');
            $n8nWebhook->bookingStatusChanged($booking, $previousStatus);
        }

        return redirect()
            ->back()
            ->with('success', 'Booking status updated successfully.');
    }

    private function formatSubmittedAt(?CarbonInterface $date): ?string
    {
        return $date?->timezone(config('app.display_timezone'))->format('Y-m-d h:i A');
    }

    private function adminBookingQuery(array $filters, bool $includeStatus = true)
    {
        return Booking::query()
            ->with('resortOption:id,name')
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $search = $filters['search'];

                $query->where(function ($q) use ($search) {
                    $q->where('booking_reference', 'like', "%{$search}%")
                        ->orWhere('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('contact_number', 'like', "%{$search}%");
                });
            })
            ->when($includeStatus && ! empty($filters['status']), function ($query) use ($filters) {
                $query->where('booking_status', $filters['status']);
            })
            ->when(! empty($filters['option']), function ($query) use ($filters) {
                $query->whereHas('resortOption', function ($q) use ($filters) {
                    $q->where('name', $filters['option']);
                });
            });
    }

    private function reservationRules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'resort_option_id' => [
                'required',
                Rule::exists('resort_options', 'id')->where('status', 'active'),
            ],
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
        ];
    }

    private function validateReservationDetails(array $validated, ResortOption $resortOption): void
    {
        if ((int) $validated['pax'] > (int) $resortOption->max_pax) {
            throw ValidationException::withMessages([
                'pax' => 'The number of pax exceeds the maximum allowed for this resort option.',
            ]);
        }

        if (Booking::query()
            ->where('resort_option_id', $resortOption->id)
            ->where('booking_date', $validated['booking_date'])
            ->where('booking_time', $validated['booking_time'])
            ->exists()) {
            throw ValidationException::withMessages([
                'booking_time' => 'This date and time slot is already booked for the selected resort option.',
            ]);
        }
    }

    /**
     * @return array{name: ?string, number: ?string, qr_code_url: ?string}
     */
    private function gcashDetails(): array
    {
        $contact = SiteSetting::query()->where('section', 'contact')->first();

        return [
            'name' => $contact?->gcash_name,
            'number' => $contact?->gcash_number,
            'qr_code_url' => MediaStorage::url($contact?->gcash_qr_code),
        ];
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
                'payment_type' => $booking->payment_type,
                'amount_paid' => $booking->amount_paid,
                'remaining_balance' => $booking->remaining_balance,
                'booking_status' => $booking->booking_status,
                'payment_status' => $booking->payment_status,
                'created_at' => $this->formatSubmittedAt($booking->created_at),
                'resort_option' => $booking->resortOption ? [
                    'id' => $booking->resortOption->id,
                    'name' => $booking->resortOption->name,
                ] : null,
            ],
        ]);

        return $pdf->download('booking-receipt-'.$booking->booking_reference.'.pdf');
    }
}
