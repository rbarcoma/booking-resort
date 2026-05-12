<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingNotificationToAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking)
    {
        $this->booking->loadMissing('resortOption');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New booking request - ' . $this->booking->booking_reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bookings.admin-notification',
            with: [
                'booking' => $this->booking,
            ],
        );
    }
}
