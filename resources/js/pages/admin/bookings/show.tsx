import type { ReactNode } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Mail,
    Phone,
    UserRound,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Booking = {
    id: number;
    booking_reference: string;
    full_name: string;
    facebook: string | null;
    email: string;
    contact_number: string;
    pax: number;
    booking_date: string;
    booking_time: string;
    message: string | null;
    total_price: string | number;
    payment_method: string;
    booking_status: string;
    created_at: string;
    resort_option: {
        id: number;
        name: string;
    } | null;
};

type Props = {
    booking: Booking;
};

export default function AdminBookingShow({ booking }: Props) {
    const updateStatus = (status: 'Pending' | 'Confirmed' | 'Cancelled') => {
        router.patch(
            `/admin/bookings/${booking.id}/status`,
            { booking_status: status },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Booking Details" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <Badge
                                variant="outline"
                                className="w-fit rounded-md px-2 py-1 text-[11px] uppercase"
                            >
                                Admin panel
                            </Badge>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Booking details
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Reference: {booking.booking_reference}
                                </p>
                            </div>
                        </div>

                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/bookings">
                                <ArrowLeft className="size-4" />
                                Back
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
                        <div className="space-y-6">
                            <Card className="gap-0">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">
                                        Booking summary
                                    </CardTitle>
                                    <CardDescription>
                                        Main reservation information.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <InfoCard
                                        label="Reference Number"
                                        value={booking.booking_reference}
                                    />

                                    <div className="rounded-lg border bg-background p-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Status
                                        </p>
                                        <div className="mt-2">
                                            <StatusBadge status={booking.booking_status} />
                                        </div>
                                    </div>

                                    <InfoCard
                                        label="Customer"
                                        value={booking.full_name}
                                        icon={<UserRound className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Email"
                                        value={booking.email}
                                        icon={<Mail className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Contact"
                                        value={booking.contact_number}
                                        icon={<Phone className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Selected option"
                                        value={booking.resort_option?.name || '-'}
                                        icon={<CalendarDays className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Booking date"
                                        value={booking.booking_date}
                                        icon={<CalendarDays className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Booking time"
                                        value={booking.booking_time}
                                        icon={<Clock3 className="size-4" />}
                                    />

                                    <InfoCard
                                        label="Pax"
                                        value={String(booking.pax)}
                                    />

                                    <InfoCard
                                        label="Payment method"
                                        value={booking.payment_method}
                                    />

                                    <InfoCard
                                        label="Submitted at"
                                        value={booking.created_at}
                                    />

                                    <InfoCard
                                        label="Facebook"
                                        value={booking.facebook || '-'}
                                    />

                                    <div className="rounded-lg border bg-background p-4 md:col-span-2">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Message / notes
                                        </p>
                                        <p className="mt-2 text-sm text-foreground">
                                            {booking.message || '-'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="gap-0">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">
                                        Update status
                                    </CardTitle>
                                    <CardDescription>
                                        Change the booking status quickly.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {booking.booking_status !== 'Pending' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => updateStatus('Pending')}
                                        >
                                            <Clock3 className="size-4" />
                                            Set Pending
                                        </Button>
                                    )}

                                    {booking.booking_status !== 'Confirmed' && (
                                        <Button
                                            type="button"
                                            className="w-full justify-start bg-green-700 hover:bg-green-800"
                                            onClick={() => updateStatus('Confirmed')}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Confirm booking
                                        </Button>
                                    )}

                                    {booking.booking_status !== 'Cancelled' && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            className="w-full justify-start bg-red-600 hover:bg-red-700"
                                            onClick={() => updateStatus('Cancelled')}
                                        >
                                            <XCircle className="size-4" />
                                            Cancel booking
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="gap-0">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">
                                        Payment summary
                                    </CardTitle>
                                    <CardDescription>
                                        Compact pricing information.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="rounded-lg border bg-muted/40 p-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Total price
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold tracking-tight">
                                            ₱
                                            {Number(booking.total_price).toLocaleString(
                                                'en-PH',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function InfoCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const className =
        status === 'Confirmed'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200'
            : status === 'Cancelled'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200';

    return <Badge className={className}>{status}</Badge>;
}
