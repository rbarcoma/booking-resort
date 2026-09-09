<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nBookingWebhook
{
    public function bookingSubmitted(Booking $booking): bool
    {
        return $this->send(
            config('services.n8n.booking_submitted_webhook_url'),
            'booking.submitted',
            $booking,
            'none',
        );
    }

    public function bookingStatusChanged(Booking $booking, ?string $previousStatus): bool
    {
        $calendarAction = match ($booking->booking_status) {
            Booking::STATUS_CONFIRMED => 'create_or_update',
            Booking::STATUS_CANCELLED => $previousStatus === Booking::STATUS_CONFIRMED ? 'remove' : 'none',
            default => 'none',
        };

        return $this->send(
            config('services.n8n.booking_status_webhook_url'),
            'booking.status_changed',
            $booking,
            $calendarAction,
            $previousStatus,
        );
    }

    private function send(
        ?string $url,
        string $event,
        Booking $booking,
        string $calendarAction,
        ?string $previousStatus = null,
    ): bool {
        if (! $url) {
            return false;
        }

        $booking->loadMissing('resortOption');

        try {
            $this->request()
                ->post($url, [
                    'event' => $event,
                    'calendar_action' => $calendarAction,
                    'previous_booking_status' => $previousStatus,
                    'booking' => [
                        'id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'customer_name' => $booking->full_name,
                        'customer_email' => $booking->email,
                        'customer_contact_number' => $booking->contact_number,
                        'customer_facebook' => $booking->facebook,
                        'reservation_date' => $booking->booking_date?->format('Y-m-d'),
                        'reservation_time' => $booking->booking_time,
                        'resort_option' => $booking->resortOption?->name,
                        'pax' => $booking->pax,
                        'total_reservation_amount' => (string) $booking->total_price,
                        'payment_method' => $booking->payment_method,
                        'payment_type' => $booking->payment_type,
                        'amount_paid' => (string) $booking->amount_paid,
                        'remaining_balance' => (string) $booking->remaining_balance,
                        'proof_of_payment_submitted' => filled($booking->proof_of_payment_path),
                        'booking_status' => $booking->booking_status,
                        'payment_status' => $booking->payment_status,
                        'created_at' => $booking->created_at?->toIso8601String(),
                        'admin_review_url' => route('admin.bookings.show', $booking),
                    ],
                ])
                ->throw();

            return true;
        } catch (\Throwable $exception) {
            Log::error('n8n booking webhook failed.', [
                'event' => $event,
                'booking_id' => $booking->id,
                'message' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private function request(): PendingRequest
    {
        $request = Http::asJson()->timeout((int) config('services.n8n.timeout', 5));
        $secret = config('services.n8n.webhook_secret');

        return $secret
            ? $request->withHeaders(['X-Webhook-Secret' => $secret])
            : $request;
    }
}
