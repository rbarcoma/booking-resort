import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from 'recharts';
import { CalendarDays, CheckCircle2, Clock3, CreditCard, FileSpreadsheet, FileText, Layers3, Search, X, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
        per_page: number;
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
type ExportType = 'excel' | 'pdf';
type ExportPeriod = 'weekly' | 'monthly' | 'yearly';

const exportPeriods: Array<{ value: ExportPeriod; label: string; description: string }> = [
    { value: 'weekly', label: 'Weekly', description: 'Bookings within the current week.' },
    { value: 'monthly', label: 'Monthly', description: 'Bookings within the current month.' },
    { value: 'yearly', label: 'Yearly', description: 'Bookings within the current year.' },
];

const chartThemes: Record<
    ChartKey,
    {
        stroke: string;
        soft: string;
        badge: string;
        card: string;
        dot: string;
    }
> = {
    bookingsOverTime: {
        stroke: '#0f766e',
        soft: 'from-teal-50/90 to-white dark:from-teal-500/15 dark:to-card',
        badge: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200',
        card: 'border-teal-100 bg-teal-50/50 dark:border-teal-500/30 dark:bg-teal-500/10',
        dot: 'bg-teal-600',
    },
    revenueOverTime: {
        stroke: '#7c3aed',
        soft: 'from-violet-50/90 to-white dark:from-violet-500/15 dark:to-card',
        badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-200',
        card: 'border-violet-100 bg-violet-50/50 dark:border-violet-500/30 dark:bg-violet-500/10',
        dot: 'bg-violet-600',
    },
    monthlyBookings: {
        stroke: '#2563eb',
        soft: 'from-blue-50/90 to-white dark:from-blue-500/15 dark:to-card',
        badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200',
        card: 'border-blue-100 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10',
        dot: 'bg-blue-600',
    },
    monthlyRevenue: {
        stroke: '#9333ea',
        soft: 'from-purple-50/90 to-white dark:from-purple-500/15 dark:to-card',
        badge: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200',
        card: 'border-purple-100 bg-purple-50/50 dark:border-purple-500/30 dark:bg-purple-500/10',
        dot: 'bg-purple-600',
    },
    bookingStatusBreakdown: {
        stroke: '#059669',
        soft: 'from-emerald-50/90 to-white dark:from-emerald-500/15 dark:to-card',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200',
        card: 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
        dot: 'bg-emerald-600',
    },
};

const pieColors = ['#f59e0b', '#059669', '#ef4444', '#2563eb', '#7c3aed'];

export default function Reports({ filters, summary, chartSets, recentBookings }: Props) {
    const [selectedChart, setSelectedChart] = useState<ChartKey>('bookingsOverTime');
    const [exportType, setExportType] = useState<ExportType | null>(null);
    const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('monthly');

    const { data, setData, get } = useForm({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        search: filters.search || '',
        status: filters.status || '',
        per_page: String(filters.per_page || 10),
    });
    const firstTableFilterRender = useRef(true);

    const currentChart = chartOptions.find((item) => item.key === selectedChart)!;
    const chartData = useMemo(() => chartSets[selectedChart] ?? [], [chartSets, selectedChart]);
    const chartTheme = chartThemes[selectedChart];
    const isRevenueChart = selectedChart.toLowerCase().includes('revenue');
    const formatChartValue = (value: number) =>
        isRevenueChart
            ? `PHP ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : Number(value).toLocaleString('en-PH');
    const chartTotal = chartData.reduce((total, item) => total + Number(item.value || 0), 0);
    const chartPeak = chartData.reduce((peak, item) => Math.max(peak, Number(item.value || 0)), 0);

    const submitDateFilter = (e: React.FormEvent) => {
        e.preventDefault();
        get('/admin/reports', {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            showProgress: false,
        });
    };

    useEffect(() => {
        if (firstTableFilterRender.current) {
            firstTableFilterRender.current = false;
            return;
        }

        const timeout = window.setTimeout(() => {
            get('/admin/reports', {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                showProgress: false,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [data.search, data.status, data.per_page, get]);

    const clearDateFilters = () => {
        router.get(
            '/admin/reports',
            {
                search: data.search,
                status: data.status,
                per_page: data.per_page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                showProgress: false,
            },
        );
    };

    const exportParams = new URLSearchParams();
    if (data.date_from) exportParams.append('date_from', data.date_from);
    if (data.date_to) exportParams.append('date_to', data.date_to);
    if (data.search) exportParams.append('search', data.search);
    if (data.status) exportParams.append('status', data.status);

    const openExportModal = (type: ExportType) => {
        setExportType(type);
        setExportPeriod('monthly');
    };
    const closeExportModal = () => setExportType(null);
    const downloadExport = () => {
        if (!exportType) {
            return;
        }

        const params = new URLSearchParams(exportParams);
        params.set('export_period', exportPeriod);
        window.location.href = `/admin/reports/export/${exportType}?${params.toString()}`;
        closeExportModal();
    };

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
                            tone="revenue"
                        />
                        <MiniStat label="Total bookings" value={summary.totalBookings} tone="total" />
                        <MiniStat label="Pending" value={summary.pending} tone="pending" />
                        <MiniStat label="Confirmed" value={summary.confirmed} tone="confirmed" />
                        <MiniStat label="Cancelled" value={summary.cancelled} tone="cancelled" />
                    </div>

                    <Card className={`gap-0 overflow-hidden ${chartTheme.card}`}>
                        <CardHeader className={`border-b bg-gradient-to-br ${chartTheme.soft} py-5`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-base">Chart overview</CardTitle>
                                        <Badge variant="outline" className={chartTheme.badge}>
                                            {currentChart.label}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Visual summary for the selected report metric.
                                    </CardDescription>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[520px]">
                                    <div className="grid grid-cols-3 gap-2">
                                        <ChartMetric label="Total" value={formatChartValue(chartTotal)} />
                                        <ChartMetric label="Peak" value={formatChartValue(chartPeak)} />
                                        <ChartMetric label="Points" value={chartData.length} />
                                    </div>

                                    <select
                                        value={selectedChart}
                                        onChange={(e) => setSelectedChart(e.target.value as ChartKey)}
                                        className="flex h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-[260px]"
                                    >
                                        {chartOptions.map((option) => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-4 py-5 sm:px-6">
                            <div className="rounded-xl border bg-background/90 p-3 shadow-inner">
                                <div className="mb-3 flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                                    <span className={`size-2 rounded-full ${chartTheme.dot}`} />
                                    {currentChart.label}
                                </div>

                                <ChartContainer
                                    config={{
                                        value: {
                                            label: currentChart.label,
                                            color: chartTheme.stroke,
                                        },
                                    }}
                                    className="h-[340px] w-full"
                                >
                                    {currentChart.type === 'line' ? (
                                        <LineChart data={chartData}>
                                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                                            <XAxis
                                                dataKey="label"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={chartTheme.stroke}
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: chartTheme.stroke, strokeWidth: 2, stroke: '#ffffff' }}
                                                activeDot={{ r: 6, fill: chartTheme.stroke, stroke: '#ffffff', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    ) : currentChart.type === 'bar' ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                                            <XAxis
                                                dataKey="label"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" fill={chartTheme.stroke} radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie
                                                data={chartData}
                                                dataKey="value"
                                                nameKey="label"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={3}
                                            >
                                                {chartData.map((item, index) => (
                                                    <Cell key={item.label} fill={pieColors[index % pieColors.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    )}
                                </ChartContainer>
                            </div>
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
                                        onClick={() => openExportModal('excel')}
                                    >
                                        <FileSpreadsheet className="size-4" />
                                        Export Excel
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => openExportModal('pdf')}
                                    >
                                        <FileText className="size-4" />
                                        Export PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-2">
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

                                <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-2xl">
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
                                        className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none"
                                    >
                                        <option value="">All status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>

                        <CardContent className="px-6 pb-6">
                            {
                                <>
                                    <div className="overflow-hidden rounded-lg border bg-background mt-4">
                                        <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1080px] text-sm">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Ref no.
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Customer
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Option
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Total
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentBookings.data.map((booking) => (
                                                    <tr key={booking.id} className="border-b last:border-b-0">
                                                        <td className="px-6 py-4 font-medium">
                                                            {booking.booking_reference}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium">{booking.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.email}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {booking.contact_number}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{booking.option || '-'}</td>
                                                        <td className="px-6 py-4">{booking.booking_date}</td>
                                                        <td className="px-6 py-4">{booking.booking_time}</td>
                                                        <td className="px-6 py-4">
                                                            PHP{' '}
                                                            {Number(booking.total_price).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={booking.booking_status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                                {recentBookings.data.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                            No recent reports found for the selected filter.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>

                                    {recentBookings.data.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                    )}
                                </>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={Boolean(exportType)} onOpenChange={(open) => !open && closeExportModal()}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Export {exportType === 'excel' ? 'Excel' : 'PDF'} report
                        </DialogTitle>
                        <DialogDescription>
                            Choose the report period to download. Current search and status filters will still apply.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {exportPeriods.map((period) => {
                            const selected = exportPeriod === period.value;

                            return (
                                <button
                                    key={period.value}
                                    type="button"
                                    onClick={() => setExportPeriod(period.value)}
                                    className={
                                        selected
                            ? 'rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-left text-emerald-950 shadow-sm outline-none ring-2 ring-emerald-200 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-50 dark:ring-emerald-500/30'
                            : 'rounded-xl border bg-background p-4 text-left shadow-sm outline-none transition hover:border-emerald-200 hover:bg-emerald-50/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10'
                                    }
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">{period.label}</span>
                                        {selected && (
                                            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                                                Selected
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{period.description}</p>
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeExportModal}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={downloadExport}>
                            {exportType === 'excel' ? (
                                <FileSpreadsheet className="size-4" />
                            ) : (
                                <FileText className="size-4" />
                            )}
                            Download {exportType === 'excel' ? 'Excel' : 'PDF'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ChartMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-background/80 px-3 py-2 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: 'revenue' | 'total' | 'pending' | 'confirmed' | 'cancelled' }) {
    const styles = {
        revenue: {
            card: 'border-violet-200 bg-violet-50/80 dark:border-violet-500/30 dark:bg-violet-500/15',
            accent: 'bg-violet-500',
            icon: 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-950/40',
            label: 'text-violet-800 dark:text-violet-200',
            value: 'text-violet-950 dark:text-violet-50',
            iconNode: <CreditCard className="size-5" />,
        },
        total: {
            card: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/15',
            accent: 'bg-sky-500',
            icon: 'bg-sky-600 text-white shadow-sky-200 dark:shadow-sky-950/40',
            label: 'text-sky-800 dark:text-sky-200',
            value: 'text-sky-950 dark:text-sky-50',
            iconNode: <Layers3 className="size-5" />,
        },
        pending: {
            card: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/15',
            accent: 'bg-amber-500',
            icon: 'bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-950/40',
            label: 'text-amber-800 dark:text-amber-200',
            value: 'text-amber-950 dark:text-amber-50',
            iconNode: <Clock3 className="size-5" />,
        },
        confirmed: {
            card: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/15',
            accent: 'bg-emerald-500',
            icon: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-950/40',
            label: 'text-emerald-800 dark:text-emerald-200',
            value: 'text-emerald-950 dark:text-emerald-50',
            iconNode: <CheckCircle2 className="size-5" />,
        },
        cancelled: {
            card: 'border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/15',
            accent: 'bg-red-500',
            icon: 'bg-red-600 text-white shadow-red-200 dark:shadow-red-950/40',
            label: 'text-red-800 dark:text-red-200',
            value: 'text-red-950 dark:text-red-50',
            iconNode: <XCircle className="size-5" />,
        },
    }[tone];

    return (
        <Card className={`gap-0 overflow-hidden ${styles.card}`}>
            <div className={`h-1 ${styles.accent}`} />
            <CardContent className="flex items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                    <p className={`text-xs font-medium uppercase tracking-wide ${styles.label}`}>{label}</p>
                    <p className={`mt-2 break-words text-xl font-semibold ${styles.value}`}>{value}</p>
                </div>
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
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
