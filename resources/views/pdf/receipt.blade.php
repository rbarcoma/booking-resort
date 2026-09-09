<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Booking Receipt</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
        }

        .page {
            width: 640px;
            margin: 0 auto;
            padding: 28px 16px;
        }

        .receipt {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .header {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
        }

        .eyebrow {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: #059669;
        }

        h1 {
            margin: 10px 0 8px;
            font-size: 24px;
            line-height: 1.2;
            color: #0f172a;
        }

        .subtitle {
            margin: 0;
            color: #475569;
            line-height: 1.5;
        }

        .content {
            padding: 24px;
        }

        .summary {
            width: 100%;
            border-collapse: collapse;
        }

        .summary td {
            padding: 10px 0;
            vertical-align: top;
        }

        .summary .label {
            width: 45%;
            color: #64748b;
        }

        .summary .value {
            width: 55%;
            text-align: right;
            font-weight: bold;
            color: #0f172a;
        }

        .summary .total {
            font-size: 20px;
        }

        .notice {
            margin-top: 18px;
            padding: 16px;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            color: #065f46;
            line-height: 1.5;
        }

        .section {
            margin-top: 18px;
        }

        .section-title {
            margin-bottom: 8px;
            font-weight: bold;
            color: #0f172a;
        }

        .muted {
            color: #475569;
            line-height: 1.6;
        }

        a {
            color: #2563eb;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="receipt">
            <div class="header">
                <div class="eyebrow">Booking Summary</div>
                <h1>Thank you, {{ $booking['full_name'] }}.</h1>
                <p class="subtitle">We received your reservation request. Please keep this receipt for your reference.</p>
            </div>

            <div class="content">
                <table class="summary">
                    <tr>
                        <td class="label">Reference</td>
                        <td class="value">{{ $booking['booking_reference'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Selected Pool</td>
                        <td class="value">{{ $booking['resort_option']['name'] ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Date</td>
                        <td class="value">{{ $booking['booking_date'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Time</td>
                        <td class="value">{{ $booking['booking_time'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Pax</td>
                        <td class="value">{{ $booking['pax'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Method</td>
                        <td class="value">{{ $booking['payment_method'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Type</td>
                        <td class="value">{{ $booking['payment_type'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Amount Submitted</td>
                        <td class="value">PHP {{ number_format((float) $booking['amount_paid'], 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Remaining Balance</td>
                        <td class="value">PHP {{ number_format((float) $booking['remaining_balance'], 2) }}</td>
                    </tr>
                    <tr>
                        <td class="label">Booking Status</td>
                        <td class="value">{{ $booking['booking_status'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Status</td>
                        <td class="value">{{ $booking['payment_status'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Total</td>
                        <td class="value total">PHP {{ number_format((float) $booking['total_price'], 2) }}</td>
                    </tr>
                </table>

                <div class="notice">
                    @if ($booking['booking_status'] === 'Confirmed')
                        Your reservation is confirmed. Its payment status is {{ $booking['payment_status'] }}. Keep this receipt and booking reference for arrival.
                    @elseif ($booking['booking_status'] === 'Cancelled')
                        This booking was cancelled. Its payment status is {{ $booking['payment_status'] }}. Contact the resort owner if you need assistance.
                    @else
                        Your booking is Pending and your GCash payment is For Verification. The uploaded proof must be manually reviewed by the resort administrator before the reservation is confirmed.
                    @endif
                </div>

                <div class="section">
                    <div class="section-title">Contact Details</div>
                    <div class="muted">
                        Email: <a href="mailto:{{ $booking['email'] }}">{{ $booking['email'] }}</a><br>
                        Contact Number: {{ $booking['contact_number'] }}<br>
                        Facebook: {{ $booking['facebook'] ?: '-' }}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Message</div>
                    <div class="muted">{{ $booking['message'] ?: 'No additional notes.' }}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
