import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    CalendarDays,
    Clock3,
    Mail,
    Menu,
    Phone,
    User,
    Users,
    X,
} from 'lucide-react';

type ResortOption = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: string | number;
    max_pax: number;
    description: string | null;
};

type TimeOption = {
    value: string;
    label: string;
};

type Props = {
    resortOptions: ResortOption[];
    timeOptions: TimeOption[];
};

type BookingForm = {
    full_name: string;
    facebook: string;
    email: string;
    contact_number: string;
    resort_option_id: string;
    pax: string;
    booking_date: string;
    booking_time: string;
    message: string;
};

export default function Book({ resortOptions, timeOptions }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm<BookingForm>({
        full_name: '',
        facebook: '',
        email: '',
        contact_number: '',
        resort_option_id: '',
        pax: '',
        booking_date: '',
        booking_time: '',
        message: '',
    });

    const selectedResort = useMemo(() => {
        return resortOptions.find((option) => option.id.toString() === data.resort_option_id);
    }, [data.resort_option_id, resortOptions]);

    const totalPrice = selectedResort ? Number(selectedResort.price).toFixed(2) : '0.00';
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/book-now');
    };

    return (
        <>
            <Head title="Book Now" />

            <div className="min-h-screen bg-[#f3f4f4] text-slate-800">
                <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f2f2b]/90 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <a href="/" className="flex items-center gap-3">
                            <div>
                                <h1 className="text-sm font-semibold text-white">Q8 Private Resort</h1>
                            </div>
                        </a>

                        <nav className="hidden items-center gap-5 md:flex">
                            <a href="/" className="text-sm text-white/85 transition hover:text-white">
                                Home
                            </a>
                            <a href="/#about" className="text-sm text-white/85 transition hover:text-white">
                                About Us
                            </a>
                            <a href="/#offers" className="text-sm text-white/85 transition hover:text-white">
                                Services
                            </a>
                            <a href="/#contact" className="text-sm text-white/85 transition hover:text-white">
                                Contact
                            </a>
                            <Link
                                href="/book-now"
                                className="inline-flex h-9 items-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-white transition hover:bg-emerald-600"
                            >
                                Book Now
                            </Link>
                        </nav>

                        <button
                            type="button"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 text-white md:hidden"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>

                    {mobileOpen && (
                        <div className="border-t border-white/10 bg-[#0f2f2b] md:hidden">
                            <div className="space-y-1 px-4 py-4">
                                <a
                                    href="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    Home
                                </a>
                                <a
                                    href="/#about"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    About Us
                                </a>
                                <a
                                    href="/#offers"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    Services
                                </a>
                                <a
                                    href="/#contact"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    Contact
                                </a>
                                <Link
                                    href="/book-now"
                                    onClick={() => setMobileOpen(false)}
                                    className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-white transition hover:bg-emerald-600"
                                >
                                    Book Now
                                </Link>
                            </div>
                        </div>
                    )}
                </header>

                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                    Customer booking
                                </p>
                                <h2 className="mt-2 text-[2rem] font-bold tracking-tight text-slate-900">
                                    Book now
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Complete the booking details below.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-5">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                            Resort booking form
                                        </p>
                                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                            Q8 Private Resort
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Fill out your reservation information.
                                        </p>
                                    </div>

                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                                        Status: Pending after submit
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <FieldBox
                                        icon={<User className="size-4" />}
                                        label="Full Name"
                                        error={errors.full_name}
                                    >
                                        <input
                                            type="text"
                                            value={data.full_name}
                                            onChange={(e) => setData('full_name', e.target.value)}
                                            placeholder="Enter your full name"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </FieldBox>

                                    <FieldBox label="Facebook Account" error={errors.facebook}>
                                        <input
                                            type="text"
                                            value={data.facebook}
                                            onChange={(e) => setData('facebook', e.target.value)}
                                            placeholder="Enter Facebook account"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </FieldBox>

                                    <FieldBox
                                        icon={<Mail className="size-4" />}
                                        label="Email Address"
                                        error={errors.email}
                                    >
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter your email"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </FieldBox>

                                    <FieldBox
                                        icon={<Phone className="size-4" />}
                                        label="Contact Number"
                                        error={errors.contact_number}
                                    >
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={11}
                                            value={data.contact_number}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_number',
                                                    e.target.value.replace(/\D/g, '').slice(0, 11),
                                                )
                                            }
                                            placeholder="09XXXXXXXXX"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </FieldBox>

                                    <FieldBox label="Resort Category" error={errors.resort_option_id}>
                                        <select
                                            value={data.resort_option_id}
                                            onChange={(e) => setData('resort_option_id', e.target.value)}
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none"
                                        >
                                            <option value="">Select category</option>
                                            {resortOptions.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FieldBox>

                                    <FieldBox
                                        icon={<Users className="size-4" />}
                                        label="Number of Pax"
                                        error={errors.pax}
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.pax}
                                            onChange={(e) => setData('pax', e.target.value)}
                                            placeholder="Enter number of pax"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </FieldBox>

                                    <FieldBox
                                        icon={<CalendarDays className="size-4" />}
                                        label="Booking Date"
                                        error={errors.booking_date}
                                    >
                                        <input
                                            type="date"
                                            min={today}
                                            value={data.booking_date}
                                            onChange={(e) => setData('booking_date', e.target.value)}
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none"
                                        />
                                    </FieldBox>

                                    <FieldBox
                                        icon={<Clock3 className="size-4" />}
                                        label="Booking Time"
                                        error={errors.booking_time}
                                    >
                                        <select
                                            value={data.booking_time}
                                            onChange={(e) => setData('booking_time', e.target.value)}
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none"
                                        >
                                            <option value="">Select time</option>
                                            {timeOptions.map((time) => (
                                                <option key={time.value} value={time.value}>
                                                    {time.label}
                                                </option>
                                            ))}
                                        </select>
                                    </FieldBox>

                                    <div className="md:col-span-2">
                                        <FieldBox label="Message / Description" error={errors.message}>
                                            <textarea
                                                rows={4}
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                placeholder="Enter additional message"
                                                className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                            />
                                        </FieldBox>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
                                    <div className="rounded-xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-200 px-4 py-3">
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Selected resort
                                            </h4>
                                        </div>

                                        <div className="px-4 py-4">
                                            {selectedResort ? (
                                                <div className="space-y-3">
                                                    <div className="overflow-hidden rounded-xl bg-slate-100">
                                                        {selectedResort.image ? (
                                                            <img
                                                                src={`/storage/${selectedResort.image}`}
                                                                alt={selectedResort.name}
                                                                className="h-48 w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                                                                No image available
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <MiniInfo label="Category" value={selectedResort.name} />
                                                        <MiniInfo
                                                            label="Max Pax"
                                                            value={String(selectedResort.max_pax)}
                                                        />
                                                        <MiniInfo
                                                            label="Price"
                                                            value={`₱${Number(selectedResort.price).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                            })}`}
                                                        />
                                                        <MiniInfo
                                                            label="Description"
                                                            value={selectedResort.description || 'No description available.'}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                                    Select a resort category to see its details.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-200 px-4 py-3">
                                            <h4 className="text-sm font-semibold text-slate-900">
                                                Total amount
                                            </h4>
                                        </div>

                                        <div className="space-y-4 px-4 py-4">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Payment Method
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-slate-900">Cash</p>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                    Reservation Total
                                                </p>
                                                <p className="mt-2 text-3xl font-bold text-slate-900">
                                                    ₱
                                                    {Number(totalPrice).toLocaleString('en-PH', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Booking'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function FieldBox({
    label,
    children,
    icon,
    error,
}: {
    label: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    error?: string;
}) {
    return (
        <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                    {icon}
                    <span>{label}</span>
                </div>
                {children}
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}
