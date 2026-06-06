import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, CreditCard, Layers3, Search, TimerReset, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Summary = {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    mostBookedCategory: string;
    mostBookedCategoryTotal: number;
};

type RecentBooking = {
    id: number;
    booking_reference: string;
    full_name: string;
    option: string | null;
    booking_date: string;
    booking_time: string;
    total_price: string | number;
    booking_status: string;
};

type Props = {
    summary: Summary;
    recentBookings: RecentBooking[];
};

export default function AdminDashboard({ summary, recentBookings }: Props) {
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return recentBookings;
        }

        return recentBookings.filter((booking) =>
            [
                booking.booking_reference,
                booking.full_name,
                booking.option || '',
                booking.booking_date,
                booking.booking_time,
                booking.booking_status,
                String(booking.total_price),
            ].some((value) => value.toLowerCase().includes(query)),
        );
    }, [recentBookings, search]);
    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
    const pageNumber = Math.min(page, totalPages);
    const paginatedBookings = filteredBookings.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    const start = filteredBookings.length === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, filteredBookings.length);

    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                            Admin panel
                        </Badge>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
                            <p className="text-sm text-muted-foreground">
                                Compact overview of bookings, revenue, and recent activity.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            label="Total bookings"
                            value={summary.totalBookings}
                            icon={<Layers3 className="size-4" />}
                            tone="total"
                        />
                        <StatCard
                            label="Pending"
                            value={summary.pendingBookings}
                            icon={<TimerReset className="size-4" />}
                            tone="pending"
                        />
                        <StatCard
                            label="Confirmed"
                            value={summary.confirmedBookings}
                            icon={<CheckCircle2 className="size-4" />}
                            tone="confirmed"
                        />
                        <StatCard
                            label="Cancelled"
                            value={summary.cancelledBookings}
                            icon={<XCircle className="size-4" />}
                            tone="cancelled"
                        />
                        <StatCard
                            label="Revenue"
                            value={`₱${Number(summary.totalRevenue).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                            })}`}
                            icon={<CreditCard className="size-4" />}
                            tone="revenue"
                        />
                    </div>

                    <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                        <Card className="gap-0 py-0">
                            <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base">Recent bookings</CardTitle>
                                    <CardDescription>Latest submitted reservations.</CardDescription>
                                </div>

                                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                                    <Link href="/admin/bookings">
                                        View all
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {paginatedBookings.length > 0 ? (
                                    <>
                                        {/* Mobile card view */}
                                        <div className="grid gap-3 p-3 sm:hidden">
                                            {paginatedBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className="rounded-xl border bg-background p-3 shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Ref no.</p>
                                                            <p className="font-medium leading-tight">
                                                                {booking.booking_reference}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={booking.booking_status} />
                                                    </div>

                                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Customer</p>
                                                            <p>{booking.full_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Option</p>
                                                            <p>{booking.option || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Date</p>
                                                            <p>{booking.booking_date}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Time</p>
                                                            <p>{booking.booking_time}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-muted-foreground">Total</p>
                                                            <p className="font-medium">
                                                                ₱
                                                                {Number(booking.total_price).toLocaleString('en-PH', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop table view */}
                                        <div className="hidden overflow-x-auto sm:block">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr className="border-b">
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Ref no.
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Customer
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Option
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Time
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Total
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedBookings.map((booking) => (
                                                        <tr key={booking.id} className="border-b last:border-b-0">
                                                            <td className="px-4 py-3 font-medium">
                                                                {booking.booking_reference}
                                                            </td>
                                                            <td className="px-4 py-3">{booking.full_name}</td>
                                                            <td className="px-4 py-3">{booking.option || '-'}</td>
                                                            <td className="px-4 py-3">{booking.booking_date}</td>
                                                            <td className="px-4 py-3">{booking.booking_time}</td>
                                                            <td className="px-4 py-3">
                                                                ₱
                                                                {Number(booking.total_price).toLocaleString('en-PH', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <StatusBadge status={booking.booking_status} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        {recentBookings.length > 0 ? 'No recent bookings match your search.' : 'No recent bookings yet.'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-4 sm:space-y-6">
                            <Card className="gap-0">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">Most booked category</CardTitle>
                                    <CardDescription>Current booking favorite.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-lg font-semibold sm:text-xl">
                                        {summary.mostBookedCategory || 'N/A'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total bookings: {summary.mostBookedCategoryTotal}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="gap-0">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">Quick access</CardTitle>
                                    <CardDescription>Go to the main admin modules.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <Button asChild variant="outline" className="w-full justify-between">
                                        <Link href="/admin/resort-options">
                                            Resort options
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline" className="w-full justify-between">
                                        <Link href="/admin/bookings">
                                            Manage bookings
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline" className="w-full justify-between">
                                        <Link href="/admin/reports">
                                            View reports
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline" className="w-full justify-between">
                                        <Link href="/admin/landing-page">
                                            Edit landing page
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    tone: 'total' | 'pending' | 'confirmed' | 'cancelled' | 'revenue';
}) {
    const styles = {
        total: {
            card: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/15',
            accent: 'bg-sky-500',
            icon: 'bg-sky-600 text-white shadow-sky-200 dark:shadow-sky-950/40',
            label: 'text-sky-800 dark:text-sky-200',
            value: 'text-sky-950 dark:text-sky-50',
        },
        pending: {
            card: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/15',
            accent: 'bg-amber-500',
            icon: 'bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-950/40',
            label: 'text-amber-800 dark:text-amber-200',
            value: 'text-amber-950 dark:text-amber-50',
        },
        confirmed: {
            card: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/15',
            accent: 'bg-emerald-500',
            icon: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-950/40',
            label: 'text-emerald-800 dark:text-emerald-200',
            value: 'text-emerald-950 dark:text-emerald-50',
        },
        cancelled: {
            card: 'border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/15',
            accent: 'bg-red-500',
            icon: 'bg-red-600 text-white shadow-red-200 dark:shadow-red-950/40',
            label: 'text-red-800 dark:text-red-200',
            value: 'text-red-950 dark:text-red-50',
        },
        revenue: {
            card: 'border-violet-200 bg-violet-50/80 dark:border-violet-500/30 dark:bg-violet-500/15',
            accent: 'bg-violet-500',
            icon: 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-950/40',
            label: 'text-violet-800 dark:text-violet-200',
            value: 'text-violet-950 dark:text-violet-50',
        },
    }[tone];

    return (
        <Card className={`gap-0 overflow-hidden ${styles.card}`}>
            <div className={`h-1 ${styles.accent}`} />
            <CardContent className="flex items-start justify-between gap-4 py-5">
                <div className="min-w-0">
                    <p className={`text-[11px] font-medium uppercase tracking-wide sm:text-xs ${styles.label}`}>{label}</p>
                    <p className={`mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl ${styles.value}`}>{value}</p>
                </div>
                <div className={`shrink-0 rounded-xl p-3 shadow-lg ${styles.icon}`}>{icon}</div>
            </CardContent>
        </Card>
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
