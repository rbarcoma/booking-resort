import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BookingEvent = {
    date: string;
    label: string;
    time: string;
    pool?: string | null;
    reference_number?: string;
    status?: string | null;
};

type Props = {
    bookings?: BookingEvent[];
};

const getEntryStyles = (status?: string | null) => {
    switch (status) {
        case 'Cancelled':
            return {
                card: 'border-rose-200 bg-rose-50',
                label: 'text-rose-700',
            };
        case 'Pending':
            return {
                card: 'border-amber-200 bg-amber-50',
                label: 'text-amber-700',
            };
        default:
            return {
                card: 'border-emerald-200 bg-emerald-50',
                label: 'text-emerald-700',
            };
    }
};

export default function BookingCalendar({ bookings = [] }: Props) {
    const now = new Date();
    const [currentDate, setCurrentDate] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1),
    );

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const monthLabel = currentDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookingMap = useMemo(() => {
        const map: Record<string, BookingEvent[]> = {};

        bookings.forEach((booking) => {
            if (!map[booking.date]) {
                map[booking.date] = [];
            }
            map[booking.date].push(booking);
        });

        return map;
    }, [bookings]);

    const cells: Array<number | null> = [];

    for (let i = 0; i < startDay; i++) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(day);
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-600">
                            Availability Calendar
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">
                            View booked dates and time slots
                        </h4>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="min-w-[150px] text-center text-sm font-medium text-slate-800">
                            {monthLabel}
                        </div>

                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold">Reminder:</span> If someone is already booked on a date, you can still book on the same day as long as there is another available time slot.
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 last:border-r-0"
                                >
                                    {day}
                                </div>
                            ))}

                            {cells.map((day, index) => {
                                if (!day) {
                                    return (
                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-[80px] border-r border-b border-slate-200 bg-slate-50/40 p-3 last:border-r-0"
                                        />
                                    );
                                }

                                const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayBookings = bookingMap[fullDate] || [];

                                return (
                                    <div
                                        key={fullDate}
                                        className="min-h-[80px] border-r border-b border-slate-200 bg-white p-3 last:border-r-0"
                                    >
                                        <div className="mb-2 text-right text-xs font-semibold text-slate-500">
                                            {day}
                                        </div>

                                        <div className="space-y-2">
                                            {dayBookings.length > 0 ? (
                                                dayBookings.map((booking, i) => {
                                                    const styles = getEntryStyles(booking.status);

                                                    return (
                                                        <div
                                                            key={`${fullDate}-${i}`}
                                                            className={`rounded-md border px-2 py-2 ${styles.card}`}
                                                        >
                                                            <p className={`text-xs font-semibold ${styles.label}`}>
                                                                {booking.label}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-700">
                                                                {booking.time}
                                                            </p>
                                                            {booking.pool && (
                                                                <p className="mt-1 text-[11px] text-slate-500">
                                                                    {booking.pool}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-xs text-slate-300">No booking</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                    <div className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-200" />
                        Booked / confirmed
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-200" />
                        Pending
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-200" />
                        Cancelled
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-200" />
                        No entry yet
                    </div>
                </div>
            </div>
        </div>
    );
}
