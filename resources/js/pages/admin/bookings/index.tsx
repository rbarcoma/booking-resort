import { Head, Link, router, useForm } from '@inertiajs/react';
import { Check, CheckCircle2, Clock3, Eye, ListChecks, Search, X, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Booking = {
    id: number;
    booking_reference: string;
    full_name: string;
    facebook?: string | null;
    email: string;
    contact_number: string;
    option: string | null;
    booking_date: string;
    booking_time: string;
    pax: number;
    total_price: string | number;
    payment_method?: string;
    booking_status: string;
    message?: string | null;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedBookings = {
    data: Booking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Props = {
    bookings: PaginatedBookings;
    filters: {
        search: string;
        status: string;
        option: string;
        per_page: number;
    };
    options: string[];
};

export default function AdminBookingsIndex({ bookings, filters, options }: Props) {
    const { data, setData, get } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        option: filters.option || '',
        per_page: String(filters.per_page || 10),
    });
    const firstFilterRender = useRef(true);

    useEffect(() => {
        if (firstFilterRender.current) {
            firstFilterRender.current = false;
            return;
        }

        const timeout = window.setTimeout(() => {
            get('/admin/bookings', {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                showProgress: false,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [data.search, data.status, data.option, data.per_page, get]);

    const updateStatus = (bookingId: number, status: 'Pending' | 'Confirmed' | 'Cancelled') => {
        router.patch(
            `/admin/bookings/${bookingId}/status`,
            { booking_status: status },
            { preserveScroll: true },
        );
    };

    const bookingRows = bookings.data || [];
    const pendingCount = bookingRows.filter((b) => b.booking_status === 'Pending').length;
    const confirmedCount = bookingRows.filter((b) => b.booking_status === 'Confirmed').length;
    const cancelledCount = bookingRows.filter((b) => b.booking_status === 'Cancelled').length;

    return (
        <>
            <Head title="Manage Bookings" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="space-y-2">
                        <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                            Admin panel
                        </Badge>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Manage bookings</h1>
                            <p className="text-sm text-muted-foreground">
                                Search, filter, and update customer reservations.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MiniStat label="Showing" value={bookingRows.length} tone="showing" />
                        <MiniStat label="Pending" value={pendingCount} tone="pending" />
                        <MiniStat label="Confirmed" value={confirmedCount} tone="confirmed" />
                        <MiniStat label="Cancelled" value={cancelledCount} tone="cancelled" />
                    </div>

                    <Card className="gap-0 py-0">
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Booking list</CardTitle>
                            <CardDescription>
                                Search updates automatically as you type.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Show</span>
                                    <select
                                        value={data.per_page}
                                        onChange={(e) => setData('per_page', e.target.value)}
                                        className="flex h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <option value="10">10</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span className="text-sm text-muted-foreground">entries</span>
                                </div>

                                <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-3xl">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                            placeholder="Search ref no, name, email, contact"
                                            className="pl-9"
                                        />
                                    </div>

                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <option value="">All status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>

                                    <select
                                        value={data.option}
                                        onChange={(e) => setData('option', e.target.value)}
                                        className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <option value="">All categories</option>
                                        {options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardContent>

                        <CardContent className="px-6 pb-6">
                            {
                                <>
                                    <div className="overflow-hidden rounded-lg border bg-background mt-4">
                                        <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1180px] text-sm">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Ref no.</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Customer</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Option</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Schedule</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Pax</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Total</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookingRows.map((booking) => (
                                                    <tr key={booking.id} className="border-b align-top last:border-b-0">
                                                        <td className="px-6 py-4 font-medium">{booking.booking_reference}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium">{booking.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">{booking.email}</div>
                                                            <div className="text-xs text-muted-foreground">{booking.contact_number}</div>
                                                        </td>
                                                        <td className="px-6 py-4">{booking.option || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <div>{booking.booking_date}</div>
                                                            <div className="text-xs text-muted-foreground">{booking.booking_time}</div>
                                                        </td>
                                                        <td className="px-6 py-4">{booking.pax}</td>
                                                        <td className="px-6 py-4 font-medium">
                                                            ₱
                                                            {Number(booking.total_price).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={booking.booking_status} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button asChild size="icon" variant="outline" title="View booking" aria-label="View booking">
                                                                    <Link href={`/admin/bookings/${booking.id}`}>
                                                                        <Eye className="size-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    className="bg-green-700 text-white hover:bg-green-800 hover:text-white"
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => updateStatus(booking.id, 'Confirmed')}
                                                                    disabled={booking.booking_status === 'Confirmed'}
                                                                    title="Confirm booking"
                                                                    aria-label="Confirm booking"
                                                                >
                                                                    <Check className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="destructive"
                                                                    onClick={() => updateStatus(booking.id, 'Cancelled')}
                                                                    disabled={booking.booking_status === 'Cancelled'}
                                                                    title="Cancel booking"
                                                                    aria-label="Cancel booking"
                                                                >
                                                                    <X className="size-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {bookingRows.length === 0 && (
                                                    <tr>
                                                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                            No bookings found for the selected filter.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>

                                    {bookingRows.length > 0 && (
                                        <TablePagination links={bookings.links} from={bookings.from} to={bookings.to} total={bookings.total} label="bookings" />
                                    )}
                                </>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function TablePagination({ links, from, to, total, label }: { links: PaginationLink[]; from: number | null; to: number | null; total: number; label: string }) {
    return (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from ?? 0} to {to ?? 0} of {total} {label}
            </p>

            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <Button
                        key={`${link.label}-${index}`}
                        type="button"
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                        disabled={!link.url}
                        onClick={() => {
                            if (link.url) {
                                router.get(link.url, {}, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                    showProgress: false,
                                });
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: 'showing' | 'pending' | 'confirmed' | 'cancelled' }) {
    const styles = {
        showing: {
            card: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/15',
            accent: 'bg-sky-500',
            icon: 'bg-sky-600 text-white shadow-sky-200 dark:shadow-sky-950/40',
            label: 'text-sky-800 dark:text-sky-200',
            value: 'text-sky-950 dark:text-sky-50',
            helper: 'Bookings on this page',
            iconNode: <ListChecks className="size-5" />,
        },
        pending: {
            card: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/15',
            accent: 'bg-amber-500',
            icon: 'bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-950/40',
            label: 'text-amber-800 dark:text-amber-200',
            value: 'text-amber-950 dark:text-amber-50',
            helper: 'Waiting for action',
            iconNode: <Clock3 className="size-5" />,
        },
        confirmed: {
            card: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/15',
            accent: 'bg-emerald-500',
            icon: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-950/40',
            label: 'text-emerald-800 dark:text-emerald-200',
            value: 'text-emerald-950 dark:text-emerald-50',
            helper: 'Ready reservations',
            iconNode: <CheckCircle2 className="size-5" />,
        },
        cancelled: {
            card: 'border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/15',
            accent: 'bg-red-500',
            icon: 'bg-red-600 text-white shadow-red-200 dark:shadow-red-950/40',
            label: 'text-red-800 dark:text-red-200',
            value: 'text-red-950 dark:text-red-50',
            helper: 'Cancelled records',
            iconNode: <XCircle className="size-5" />,
        },
    }[tone];

    return (
        <Card className={`gap-0 overflow-hidden ${styles.card}`}>
            <div className={`h-1 ${styles.accent}`} />
            <CardContent className="flex items-center justify-between gap-4 py-5">
                <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${styles.label}`}>{label}</p>
                    <p className={`mt-2 text-3xl font-semibold ${styles.value}`}>{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{styles.helper}</p>
                </div>
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
                    {styles.iconNode}
                </div>
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
