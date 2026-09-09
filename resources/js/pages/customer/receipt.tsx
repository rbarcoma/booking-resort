import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';

import MessengerButton from '@/components/messenger-button';

type Booking = {
    id: number;
    booking_reference: string;
    full_name: string;
    facebook: string | null;
    email: string;
    contact_number: string;
    booking_date: string;
    booking_time: string;
    pax: number;
    total_price: string | number;
    payment_method: string;
    payment_type: string;
    amount_paid: string | number;
    remaining_balance: string | number;
    booking_status: BookingStatus;
    payment_status: PaymentStatus;
    message: string | null;
    created_at: string;
    resort_option?: {
        name: string;
    } | null;
};

type Props = {
    booking: Booking;
    receipt_pdf_url: string;
    messengerUrl: string;
};

type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';
type PaymentStatus = 'For Verification' | 'Down Payment Paid' | 'Fully Paid' | 'Rejected';

export default function ReceiptPage({ booking, receipt_pdf_url, messengerUrl }: Props) {
    const formattedTotal = Number(booking.total_price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <>
            <Head title="Booking Receipt" />

            <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
                <div className="mx-auto max-w-[680px] px-4 py-6 pb-24 print:pb-6 sm:px-6">
                    <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                Customer receipt
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                Booking receipt
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Reference: {booking.booking_reference}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/"
                                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <ArrowLeft className="mr-2 size-4" />
                                Back
                            </Link>

                            <a
                                href={receipt_pdf_url}
                                className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
                            >
                                <Download className="size-4" />
                                Export
                            </a>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-6 sm:px-6">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                Booking summary
                            </p>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                                Thank you, {booking.full_name}.
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                We received your reservation request. Please keep this receipt for your reference.
                            </p>
                        </div>

                        <div className="px-5 py-6 sm:px-6">
                            <dl>
                                <SummaryRow label="Reference" value={booking.booking_reference} />
                                <SummaryRow label="Selected Pool" value={booking.resort_option?.name || '-'} />
                                <SummaryRow label="Date" value={booking.booking_date} />
                                <SummaryRow label="Time" value={booking.booking_time} />
                                <SummaryRow label="Pax" value={String(booking.pax)} />
                                <SummaryRow label="Payment Method" value={booking.payment_method} />
                                <SummaryRow label="Payment Type" value={booking.payment_type} />
                                <SummaryRow label="Amount Submitted" value={`PHP ${formatAmount(booking.amount_paid)}`} />
                                <SummaryRow label="Remaining Balance" value={`PHP ${formatAmount(booking.remaining_balance)}`} />
                                <SummaryRow label="Booking Status" value={booking.booking_status} />
                                <SummaryRow label="Payment Status" value={booking.payment_status} />
                                <SummaryRow
                                    label="Total"
                                    value={`PHP ${formattedTotal}`}
                                    valueClassName="text-xl font-bold text-slate-950"
                                />
                            </dl>

                            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
                                {bookingNotice(booking)}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-950">Contact Details</h3>
                                <div className="mt-3 text-sm leading-6 text-slate-600">
                                    <div>
                                        Email:{' '}
                                        <a className="font-medium text-blue-600 underline" href={`mailto:${booking.email}`}>
                                            {booking.email}
                                        </a>
                                    </div>
                                    <div>Contact Number: {booking.contact_number}</div>
                                    <div>Facebook: {booking.facebook || '-'}</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-950">Message</h3>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {booking.message || 'No additional notes.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MessengerButton url={messengerUrl} />
        </>
    );
}

function formatAmount(value: string | number) {
    return Number(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function bookingNotice(booking: Booking) {
    if (booking.booking_status === 'Confirmed') {
        return `Your reservation is confirmed. Its payment status is ${booking.payment_status}. Keep this receipt and booking reference for arrival.`;
    }

    if (booking.booking_status === 'Cancelled') {
        return `This booking was cancelled. Its payment status is ${booking.payment_status}. Contact the resort owner if you need assistance.`;
    }

    return 'Your booking is Pending and your GCash payment is For Verification. The uploaded screenshot must be manually reviewed by the resort administrator before the reservation is confirmed.';
}

function SummaryRow({
    label,
    value,
    valueClassName = 'text-sm font-bold text-slate-950',
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="grid grid-cols-[minmax(120px,1fr)_minmax(0,1fr)] items-start gap-4 py-3">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className={`break-words text-right ${valueClassName}`}>{value}</dd>
        </div>
    );
}
