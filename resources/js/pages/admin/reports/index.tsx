import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from 'recharts';
import { CalendarDays, FileSpreadsheet, FileText, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';

type Summary = {
    totalBookings: number;
    totalRevenue: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    mostBookedCategory: string;
    mostBookedCategoryTotal: number;
};

type ChartItem = {
    label: string;
    value: number;
};

type RecentBooking = {
    id: number;
    booking_reference: string;
    full_name: string;
    email: string;
    contact_number: string;
    option: string | null;
    booking_date: string;
    booking_time: string;
    pax: number;
    total_price: string | number;
    booking_status: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedRecentBookings = {
    data: RecentBooking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Props = {
    filters: {
        date_from: string | null;
        date_to: string | null;
        search: string;
        status: string;
    };
    summary: Summary;
    chartSets: {
        bookingsOverTime: ChartItem[];
        revenueOverTime: ChartItem[];
        monthlyBookings: ChartItem[];
        monthlyRevenue: ChartItem[];
        bookingStatusBreakdown: ChartItem[];
    };
    recentBookings: PaginatedRecentBookings;
};

const chartOptions = [
    { key: 'bookingsOverTime', label: 'Bookings over time', type: 'line' },
    { key: 'revenueOverTime', label: 'Revenue over time', type: 'line' },
    { key: 'monthlyBookings', label: 'Monthly bookings', type: 'bar' },
    { key: 'monthlyRevenue', label: 'Monthly revenue', type: 'bar' },
    { key: 'bookingStatusBreakdown', label: 'Booking status breakdown', type: 'pie' },
] as const;

type ChartKey = (typeof chartOptions)[number]['key'];

export default function Reports({ filters, summary, chartSets, recentBookings }: Props) {
    const [selectedChart, setSelectedChart] = useState<ChartKey>('bookingsOverTime');

    const { data, setData, get } = useForm({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        search: filters.search || '',
        status: filters.status || '',
    });

    const currentChart = chartOptions.find((item) => item.key === selectedChart)!;
    const chartData = useMemo(() => chartSets[selectedChart] ?? [], [chartSets, selectedChart]);

    const submitDateFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get('/admin/reports', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitTableFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get('/admin/reports', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearDateFilters = () => {
        router.get(
            '/admin/reports',
            {
                search: data.search,
                status: data.status,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const clearTableFilters = () => {
        router.get(
            '/admin/reports',
            {
                date_from: data.date_from,
                date_to: data.date_to,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const exportParams = new URLSearchParams();
    if (data.date_from) exportParams.append('date_from', data.date_from);
    if (data.date_to) exportParams.append('date_to', data.date_to);
    if (data.search) exportParams.append('search', data.search);
    if (data.status) exportParams.append('status', data.status);

    const exportQuery = exportParams.toString();

    return (
        <>
            <Head title="Reports" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="space-y-2">
                        <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                            Admin panel
                        </Badge>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
                            <p className="text-sm text-muted-foreground">
                                Cleaner reports with one chart, table filters, and pagination.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <MiniStat
                            label="Revenue"
                            value={`PHP ${Number(summary.totalRevenue).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                            })}`}
                        />
                        <MiniStat label="Total bookings" value={summary.totalBookings} />
                        <MiniStat label="Pending" value={summary.pending} />
                        <MiniStat label="Confirmed" value={summary.confirmed} />
                        <MiniStat label="Cancelled" value={summary.cancelled} />
                    </div>

                    <Card className="gap-0">
                        <CardHeader className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-base">Report filters</CardTitle>
                                <CardDescription>
                                    Date range affects the summary, charts, table, PDF, and Excel export.
                                </CardDescription>
                            </div>

                            <form onSubmit={submitDateFilter} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={data.date_from}
                                        onChange={(e) => setData('date_from', e.target.value)}
                                        className="pl-9"
                                        aria-label="Date from"
                                    />
                                </div>

                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={data.date_to}
                                        onChange={(e) => setData('date_to', e.target.value)}
                                        className="pl-9"
                                        aria-label="Date to"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" size="sm">
                                        Apply
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={clearDateFilters}>
                                        <X className="size-4" />
                                        Clear
                                    </Button>
                                </div>
                            </form>
                        </CardHeader>
                    </Card>

                    <Card className="gap-0">
                        <CardHeader className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base">Chart overview</CardTitle>
                                <CardDescription>Choose what data to display in the chart.</CardDescription>
                            </div>

                            <select
                                value={selectedChart}
                                onChange={(e) => setSelectedChart(e.target.value as ChartKey)}
                                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none sm:w-[260px]"
                            >
                                {chartOptions.map((option) => (
                                    <option key={option.key} value={option.key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </CardHeader>

                        <CardContent>
                            <ChartContainer
                                config={{
                                    value: {
                                        label: currentChart.label,
                                        color: 'hsl(var(--chart-1))',
                                    },
                                }}
                                className="h-[320px] w-full"
                            >
                                {currentChart.type === 'line' ? (
                                    <LineChart data={chartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0f766e"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#0f766e' }}
                                        />
                                    </LineChart>
                                ) : currentChart.type === 'bar' ? (
                                    <BarChart data={chartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="value" fill="#0f766e" radius={6} />
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={60} />
                                    </PieChart>
                                )}
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-0">
                        <CardHeader className="py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-base">Recent bookings</CardTitle>
                                    <CardDescription>
                                        Filtered bookings with export actions.
                                    </CardDescription>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            window.location.href = `/admin/reports/export/excel${exportQuery ? `?${exportQuery}` : ''}`;
                                        }}
                                    >
                                        <FileSpreadsheet className="size-4" />
                                        Export Excel
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            window.location.href = `/admin/reports/export/pdf${exportQuery ? `?${exportQuery}` : ''}`;
                                        }}
                                    >
                                        <FileText className="size-4" />
                                        Export PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={submitTableFilter} className="grid gap-3 md:grid-cols-4 mb-5">
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
                                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none"
                                >
                                    <option value="">All status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>

                                <div className="flex flex-wrap gap-2">
                                    <Button type="submit" size="sm">
                                        Filter
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={clearTableFilters}>
                                        <X className="size-4" />
                                        Clear
                                    </Button>
                                </div>
                            </form>
                        </CardContent>

                        <CardContent className="p-0">
                            {recentBookings.data.length > 0 ? (
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
                                                {recentBookings.data.map((booking) => (
                                                    <tr key={booking.id} className="border-b last:border-b-0">
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
                                                        <td className="px-4 py-3">{booking.booking_date}</td>
                                                        <td className="px-4 py-3">{booking.booking_time}</td>
                                                        <td className="px-4 py-3">
                                                            PHP{' '}
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

                                    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {recentBookings.from ?? 0} to {recentBookings.to ?? 0} of{' '}
                                            {recentBookings.total} bookings
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {recentBookings.links.map((link, index) => (
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
                                    No report data found. Try another filter.
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
                <p className="mt-2 text-xl font-semibold">{value}</p>
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
