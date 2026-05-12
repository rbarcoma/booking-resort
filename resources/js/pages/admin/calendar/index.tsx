import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

type Props = {
    entries: Entry[];
    flash?: {
        success?: string | null;
    };
};

export default function AdminCalendarIndex({ entries, flash }: Props) {
    const now = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

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

    return (
        <>
            <Head title="Admin Calendar" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="space-y-2">
                        <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                            Admin panel
                        </Badge>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Booking calendar</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage calendar entries for booked, pending, and cancelled reservations.
                            </p>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

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
                            <div className="overflow-x-auto">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-7 overflow-hidden rounded-xl border">
                                        {weekDays.map((day) => (
                                            <div
                                                key={day}
                                                className="border-r border-b bg-muted/50 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground last:border-r-0"
                                            >
                                                {day}
                                            </div>
                                        ))}

                                        {cells.map((day, index) => {
                                            if (!day) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className="min-h-[130px] border-r border-b bg-muted/20 p-3 last:border-r-0"
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
                                                                            ? 'border-emerald-200 bg-emerald-50'
                                                                            : entry.status === 'Cancelled'
                                                                              ? 'border-red-200 bg-red-50'
                                                                              : 'border-amber-200 bg-amber-50'
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
                                                                        className="mt-2 h-7 px-2 text-red-600 hover:text-red-700"
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
        </>
    );
}
