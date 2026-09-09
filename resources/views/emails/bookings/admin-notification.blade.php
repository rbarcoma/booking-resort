<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Booking Request</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; color:#0f172a; font-family:Arial, sans-serif;">
    <div style="max-width:640px; margin:0 auto; padding:28px 16px;">
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div style="padding:24px; border-bottom:1px solid #e2e8f0;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:1.4px; color:#059669; font-weight:bold;">New Booking Request</div>
                <h1 style="font-size:24px; margin:8px 0 6px;">{{ $booking->resortOption?->name ?? 'Pool Booking' }}</h1>
                <p style="margin:0; color:#475569;">Reference: {{ $booking->booking_reference }}</p>
            </div>

            <div style="padding:24px;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Customer</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->full_name }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Email</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->email }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Contact Number</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->contact_number }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Date and Time</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->booking_date?->format('Y-m-d') }} - {{ $booking->booking_time }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Pax</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->pax }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Total</td>
                        <td style="padding:10px 0; text-align:right; font-size:20px; font-weight:bold;">PHP {{ number_format((float) $booking->total_price, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Payment Type</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->payment_type }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Amount Submitted</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">PHP {{ number_format((float) $booking->amount_paid, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Remaining Balance</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">PHP {{ number_format((float) $booking->remaining_balance, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Booking Status</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->booking_status }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Payment Status</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->payment_status }}</td>
                    </tr>
                </table>

                <div style="margin-top:18px; padding:16px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; color:#92400e; line-height:1.6;">
                    A GCash proof of payment was uploaded and is waiting for manual administrator verification. Do not treat this booking as confirmed until the proof and reservation details have been reviewed.
                </div>

                <div style="margin-top:18px;">
                    <a href="{{ route('admin.bookings.show', $booking) }}" style="display:inline-block; padding:12px 16px; background:#059669; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold;">
                        Review booking and payment proof
                    </a>
                </div>

                <div style="margin-top:18px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; color:#475569; line-height:1.6;">
                    {{ $booking->message ?: 'No additional notes.' }}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
