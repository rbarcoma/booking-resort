import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Entry = {
    id: number;
    calendar_date: string;
    status: string;
    booking: {
        id: number;
        booking_reference: string;
        full_name: string;
        booking_time: string;
        option: string | null;
        booking_status: string;
    } | null;
};

type ConfirmedBooking = {
    id: number;
    booking_reference: string;
    full_name: string;
    booking_date: string;
    booking_time: string;
    option: string | null;
    booking_status: string;
    is_latest?: boolean;
};

type Props = {
    entries: Entry[];
    confirmedBookings: ConfirmedBooking[];
};

export default function AdminCalendarIndex({ entries, confirmedBookings }: Props) {
    const now = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
    const [addOpen, setAddOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const monthLabel = currentDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const entryMap = useMemo(() => {
        const map: Record<string, Entry[]> = {};

        entries.forEach((entry) => {
            if (!map[entry.calendar_date]) {
                map[entry.calendar_date] = [];
            }
            map[entry.calendar_date].push(entry);
        });

        return map;
    }, [entries]);

    const cells: Array<number | null> = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const removeEntry = (entryId: number) => {
        router.delete(`/admin/calendar/entries/${entryId}`, {
            preserveScroll: true,
        });
    };

    const selectedBooking = confirmedBookings.find((booking) => booking.id.toString() === selectedBookingId);

    const addSelectedBooking = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBookingId) {
            return;
        }

        router.post(
            `/admin/calendar/bookings/${selectedBookingId}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedBookingId('');
                    setAddOpen(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="Admin Calendar" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                                Admin panel
                            </Badge>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Booking calendar</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage calendar entries for confirmed reservations.
                                </p>
                            </div>
                        </div>

                        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                            <Plus className="size-4" />
                            Add Calendar
                        </Button>
                    </div>

                    <Card className="gap-0">
                        <CardHeader className="py-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-base">Calendar view</CardTitle>
                                    <CardDescription>
                                        Delete here only removes the calendar entry, not the booking.
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Button>

                                    <div className="min-w-[160px] text-center text-sm font-medium">{monthLabel}</div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6">
                            {entries.length === 0 && (
                                <div className="mb-4 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                    No recent calendar entries yet.
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-7 overflow-hidden rounded-xl border bg-background">
                                        {weekDays.map((day) => (
                                            <div
                                                key={day}
                                                className="border-r border-b bg-muted/50 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground last:border-r-0 dark:bg-muted/40"
                                            >
                                                {day}
                                            </div>
                                        ))}

                                        {cells.map((day, index) => {
                                            if (!day) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className="min-h-[130px] border-r border-b bg-muted/20 p-3 last:border-r-0 dark:bg-background/60"
                                                    />
                                                );
                                            }

                                            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const dayEntries = entryMap[fullDate] || [];

                                            return (
                                                <div
                                                    key={fullDate}
                                                    className="min-h-[130px] border-r border-b bg-background p-3 last:border-r-0"
                                                >
                                                    <div className="mb-2 text-right text-xs font-semibold text-muted-foreground">
                                                        {day}
                                                    </div>

                                                    <div className="space-y-2">
                                                        {dayEntries.length > 0 ? (
                                                            dayEntries.map((entry) => (
                                                                <div
                                                                    key={entry.id}
                                                                    className={`rounded-md border p-2 ${
                                                                        entry.status === 'Confirmed'
                                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-50'
                                                                            : entry.status === 'Cancelled'
                                                                              ? 'border-red-200 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-50'
                                                                              : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-50'
                                                                    }`}
                                                                >
                                                                    <p className="text-xs font-semibold">
                                                                        {entry.booking?.full_name || 'Unknown booking'}
                                                                    </p>
                                                                    <p className="mt-1 text-[11px]">
                                                                        {entry.booking?.booking_reference}
                                                                    </p>
                                                                    <p className="text-[11px]">
                                                                        {entry.booking?.option || '-'} • {entry.booking?.booking_time || '-'}
                                                                    </p>
                                                                    <p className="mt-1 text-[11px] font-medium">
                                                                        {entry.status}
                                                                    </p>

                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="mt-2 h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                                                                        onClick={() => removeEntry(entry.id)}
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-muted-foreground">
                                                                No entry
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={addOpen}
                onOpenChange={(open) => {
                    setAddOpen(open);

                    if (!open) {
                        setSelectedBookingId('');
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add booking to calendar</DialogTitle>
                        <DialogDescription>
                            Select a confirmed booking that has not yet been added to the calendar.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={addSelectedBooking} className="space-y-4">
                        {confirmedBookings.length > 0 ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Confirmed booking</label>
                                    <div className="max-h-72 overflow-y-auto rounded-lg border bg-background p-2">
                                        <div className="space-y-2">
                                            {confirmedBookings.map((booking) => {
                                                const selected = selectedBookingId === booking.id.toString();

                                                return (
                                                    <button
                                                        key={booking.id}
                                                        type="button"
                                                        onClick={() => setSelectedBookingId(booking.id.toString())}
                                                        className={`w-full rounded-md border px-3 py-3 text-left transition ${
                                                            selected
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-50'
                                                                : booking.is_latest
                                                                  ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-50'
                                                                  : 'border-transparent hover:border-border hover:bg-muted/40 dark:hover:bg-muted/60'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-sm font-semibold">
                                                                        {booking.booking_reference}
                                                                    </p>
                                                                    {booking.is_latest && (
                                                                        <Badge className="border-amber-300 bg-amber-100 text-amber-800">
                                                                            Latest
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 text-sm">{booking.full_name}</p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    {booking.option || '-'} • {booking.booking_time}
                                                                </p>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground sm:text-right">
                                                                <p>{booking.booking_date}</p>
                                                                <p>{booking.booking_status}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {selectedBooking && (
                                    <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                                        <DetailItem label="Customer" value={selectedBooking.full_name} />
                                        <DetailItem label="Reference" value={selectedBooking.booking_reference} />
                                        <DetailItem label="Resort Category" value={selectedBooking.option || '-'} />
                                        <DetailItem label="Schedule" value={selectedBooking.booking_time} />
                                        <DetailItem label="Calendar Date" value={selectedBooking.booking_date} />
                                        <DetailItem label="Status" value={selectedBooking.booking_status} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                No confirmed bookings are available to add to the calendar.
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!selectedBookingId}>
                                <Plus className="size-4" />
                                Add to calendar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}
