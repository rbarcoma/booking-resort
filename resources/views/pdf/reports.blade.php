<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Reports</title>
    <style>
        @page {
            margin: 24px;
        }

        body {
            color: #111827;
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            line-height: 1.35;
        }

        .header {
            border-bottom: 2px solid #0f766e;
            margin-bottom: 14px;
            padding-bottom: 10px;
        }

        .title {
            color: #0f766e;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px;
        }

        .meta {
            color: #4b5563;
            font-size: 10px;
        }

        .filters {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            margin-bottom: 12px;
            padding: 8px;
        }

        .filters span {
            display: inline-block;
            margin-right: 18px;
        }

        .summary {
            margin-bottom: 14px;
            width: 100%;
        }

        .summary td {
            background: #ecfdf5;
            border: 1px solid #99f6e4;
            padding: 8px;
            width: 16.66%;
        }

        .summary .label {
            color: #475569;
            display: block;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: .04em;
            text-transform: uppercase;
        }

        .summary .value {
            color: #0f172a;
            display: block;
            font-size: 13px;
            font-weight: 700;
            margin-top: 3px;
        }

        table.data {
            border-collapse: collapse;
            width: 100%;
        }

        .data th,
        .data td {
            border: 1px solid #d1d5db;
            padding: 5px;
            text-align: left;
            vertical-align: top;
        }

        .data th {
            background: #0f766e;
            color: #fff;
            font-size: 8px;
            letter-spacing: .03em;
            text-transform: uppercase;
        }

        .data tr:nth-child(even) td {
            background: #f9fafb;
        }

        .number {
            text-align: right;
            white-space: nowrap;
        }

        .muted {
            color: #6b7280;
            font-size: 8px;
        }

        .status {
            border-radius: 3px;
            display: inline-block;
            font-size: 8px;
            font-weight: 700;
            padding: 2px 5px;
            text-transform: uppercase;
        }

        .status-confirmed {
            background: #dcfce7;
            color: #166534;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Booking Reports</h1>
        <div class="meta">
            Generated {{ $generatedAt }} &middot; {{ $bookings->count() }} exported booking{{ $bookings->count() === 1 ? '' : 's' }}
        </div>
    </div>

    <div class="filters">
        @php($dateLabel = $filters['export_period'] ? 'Transaction date' : 'Booking date')
        <span><strong>{{ $dateLabel }} from:</strong> {{ $filters['date_from'] ?: 'All' }}</span>
        <span><strong>{{ $dateLabel }} to:</strong> {{ $filters['date_to'] ?: 'All' }}</span>
        <span><strong>Export period:</strong> {{ $filters['export_period'] ? ucfirst($filters['export_period']) : 'Custom/All' }}</span>
        <span><strong>Status:</strong> {{ $filters['status'] ?: 'All' }}</span>
        <span><strong>Search:</strong> {{ $filters['search'] ?: 'None' }}</span>
    </div>

    <table class="summary">
        <tr>
            <td><span class="label">Revenue</span><span class="value">PHP {{ number_format((float) $summary['totalRevenue'], 2) }}</span></td>
            <td><span class="label">Bookings</span><span class="value">{{ $summary['totalBookings'] }}</span></td>
            <td><span class="label">Pending</span><span class="value">{{ $summary['pending'] }}</span></td>
            <td><span class="label">Confirmed</span><span class="value">{{ $summary['confirmed'] }}</span></td>
            <td><span class="label">Cancelled</span><span class="value">{{ $summary['cancelled'] }}</span></td>
            <td><span class="label">Top option</span><span class="value">{{ $summary['mostBookedCategory'] }} ({{ $summary['mostBookedCategoryTotal'] }})</span></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th>Ref No.</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Option</th>
                <th>Date</th>
                <th>Time</th>
                <th>Pax</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($bookings as $booking)
                <tr>
                    <td>{{ $booking->booking_reference }}</td>
                    <td>{{ $booking->full_name }}</td>
                    <td>{{ $booking->email }}</td>
                    <td>{{ $booking->contact_number }}</td>
                    <td>{{ $booking->resortOption?->name ?? '-' }}</td>
                    <td>{{ $booking->booking_date?->format('Y-m-d') }}</td>
                    <td>{{ $booking->booking_time }}</td>
                    <td class="number">{{ $booking->pax }}</td>
                    <td class="number">PHP {{ number_format((float) $booking->total_price, 2) }}</td>
                    <td>{{ $booking->payment_method }}</td>
                    <td>
                        <span class="status status-{{ strtolower($booking->booking_status) }}">
                            {{ $booking->booking_status }}
                        </span>
                    </td>
                    <td>{{ $booking->created_at?->timezone(config('app.display_timezone'))->format('Y-m-d h:i A') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="12" class="muted">No report data found for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
