<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Booking Summary</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; color:#0f172a; font-family:Arial, sans-serif;">
    <div style="max-width:640px; margin:0 auto; padding:28px 16px;">
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div style="padding:24px; border-bottom:1px solid #e2e8f0;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:1.4px; color:#059669; font-weight:bold;">Booking Summary</div>
                <h1 style="font-size:24px; margin:8px 0 6px;">Thank you, {{ $booking->full_name }}.</h1>
                <p style="margin:0; color:#475569; line-height:1.5;">
                    We received your reservation request. Please keep this email for your reference.
                </p>
            </div>

            <div style="padding:24px;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Reference</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->booking_reference }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Selected Pool</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->resortOption?->name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Date</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->booking_date?->format('Y-m-d') }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Time</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->booking_time }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Pax</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->pax }}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Payment Method</td>
                        <td style="padding:10px 0; text-align:right; font-weight:bold;">{{ $booking->payment_method }}</td>
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
                    <tr>
                        <td style="padding:10px 0; color:#64748b;">Total</td>
                        <td style="padding:10px 0; text-align:right; font-size:20px; font-weight:bold;">PHP {{ number_format((float) $booking->total_price, 2) }}</td>
                    </tr>
                </table>

                <div style="margin-top:18px; padding:16px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; color:#065f46; line-height:1.5;">
                    Your booking is Pending and your GCash payment is For Verification. The uploaded proof must be manually reviewed by the resort administrator before the reservation is confirmed.
                </div>

                <div style="margin-top:18px;">
                    <a href="{{ $receiptUrl }}" style="display:inline-block; padding:12px 16px; background:#059669; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold;">
                        View secure receipt
                    </a>
                </div>

                <div style="margin-top:18px;">
                    <div style="font-weight:bold; margin-bottom:8px;">Contact Details</div>
                    <div style="color:#475569; line-height:1.6;">
                        Email: {{ $booking->email }}<br>
                        Contact Number: {{ $booking->contact_number }}<br>
                        Facebook: {{ $booking->facebook ?: '-' }}
                    </div>
                </div>

                <div style="margin-top:18px;">
                    <div style="font-weight:bold; margin-bottom:8px;">Message</div>
                    <div style="color:#475569; line-height:1.6;">{{ $booking->message ?: 'No additional notes.' }}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
