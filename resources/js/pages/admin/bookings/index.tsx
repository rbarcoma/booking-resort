import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, Search, X } from 'lucide-react';

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
    };
    options: string[];
    flash?: {
        success?: string | null;
    };
};

export default function AdminBookingsIndex({ bookings, filters, options, flash }: Props) {
    const { data, setData, get, processing, reset } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        option: filters.option || '',
    });

    const submitFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get('/admin/bookings', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        reset();
        router.get('/admin/bookings', {}, { preserveScroll: true });
    };

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

                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MiniStat label="Showing" value={bookingRows.length} />
                        <MiniStat label="Pending" value={pendingCount} />
                        <MiniStat label="Confirmed" value={confirmedCount} />
                        <MiniStat label="Cancelled" value={cancelledCount} />
                    </div>

                    <Card className="gap-0 py-0">
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Booking list</CardTitle>
                            <CardDescription>
                                Filters are now inside the booking table section.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={submitFilter} className="grid gap-3 md:grid-cols-4">
                                <div className="relative md:col-span-2">
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

                                <div className="flex flex-wrap gap-2 md:col-span-4 mb-5">
                                    <Button type="submit" size="sm" disabled={processing}>
                                        Filter
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                                        <X className="size-4" />
                                        Clear
                                    </Button>
                                </div>
                            </form>
                        </CardContent>

                        <CardContent className="p-0">
                            {bookingRows.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
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
                                                        Schedule
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                        Pax
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                        Total
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                        Status
                                                    </th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookingRows.map((booking) => (
                                                    <tr key={booking.id} className="border-b align-top last:border-b-0">
                                                        <td className="px-4 py-3 font-medium">
                                                            {booking.booking_reference}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">{booking.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.email}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.contact_number}
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3">{booking.option || '-'}</td>

                                                        <td className="px-4 py-3">
                                                            <div>{booking.booking_date}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.booking_time}
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3">{booking.pax}</td>

                                                        <td className="px-4 py-3 font-medium">
                                                            ₱
                                                            {Number(booking.total_price).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={booking.booking_status} />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button asChild size="sm" variant="outline">
                                                                    <Link href={`/admin/bookings/${booking.id}`}>
                                                                        <Eye className="size-4" />
                                                                        View
                                                                    </Link>
                                                                </Button>

                                                                <Button
                                                                    className="bg-green-700 text-white hover:bg-green-800 hover:text-white"
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        updateStatus(booking.id, 'Confirmed')
                                                                    }
                                                                    disabled={booking.booking_status === 'Confirmed'}
                                                                >
                                                                    Confirm
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        updateStatus(booking.id, 'Cancelled')
                                                                    }
                                                                    disabled={booking.booking_status === 'Cancelled'}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {bookings.from ?? 0} to {bookings.to ?? 0} of {bookings.total} bookings
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {bookings.links.map((link, index) => (
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
                                                            });
                                                        }
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                    No bookings found for the selected filter.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
    return (
        <Card className="gap-0">
            <CardContent className="py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const className =
        status === 'Confirmed'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'Cancelled'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-700';

    return <Badge className={className}>{status}</Badge>;
}
