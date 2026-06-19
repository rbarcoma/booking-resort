<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class BookingConfirmationToCustomer extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking)
    {
        $this->booking->loadMissing('resortOption');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your booking summary - ' . $this->booking->booking_reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bookings.customer-confirmation',
            with: [
                'booking' => $this->booking,
                'receiptUrl' => URL::signedRoute('bookings.receipt', $this->booking),
            ],
        );
    }
}
