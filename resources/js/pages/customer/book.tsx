import { Head, Link, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    Mail,
    Phone,
    ShieldCheck,
    Upload,
    User,
    Users,
    WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import MessengerButton from '@/components/messenger-button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    messengerUrl: string;
    resortOptions: ResortOption[];
    timeOptions: TimeOption[];
    gcash: {
        name: string | null;
        number: string | null;
        qr_code_url: string | null;
    };
};

type PaymentType = 'Full Payment' | 'Down Payment';

type PaymentDetails = {
    booking_reference: string;
    payment_method: 'GCash';
    payment_type: PaymentType;
    total_reservation_amount: string;
    amount_to_pay: string;
    remaining_balance: string;
    payment_quote: string;
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
    payment_type: PaymentType;
    payment_quote: string;
    proof_of_payment: File | null;
};

export default function Book({ resortOptions, timeOptions, gcash, messengerUrl }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [messengerMinimized, setMessengerMinimized] = useState(false);
    const [preparingPayment, setPreparingPayment] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm<BookingForm>({
        full_name: '',
        facebook: '',
        email: '',
        contact_number: '',
        resort_option_id: '',
        pax: '',
        booking_date: '',
        booking_time: '',
        message: '',
        payment_type: 'Full Payment',
        payment_quote: '',
        proof_of_payment: null,
    });

    const selectedResort = useMemo(() => {
        return resortOptions.find((option) => option.id.toString() === data.resort_option_id);
    }, [data.resort_option_id, resortOptions]);

    const totalPrice = selectedResort ? Number(selectedResort.price).toFixed(2) : '0.00';
    const today = new Date().toISOString().split('T')[0];

    const requestPaymentDetails = async (paymentType: PaymentType, openModal = true) => {
        setPreparingPayment(true);
        setPaymentError(null);
        clearErrors();

        try {
            const response = await fetch('/book-now/payment-details', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    full_name: data.full_name,
                    facebook: data.facebook,
                    email: data.email,
                    contact_number: data.contact_number,
                    resort_option_id: data.resort_option_id,
                    pax: data.pax,
                    booking_date: data.booking_date,
                    booking_time: data.booking_time,
                    message: data.message,
                    payment_type: paymentType,
                    payment_quote: data.payment_quote || undefined,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                if (payload.errors) {
                    Object.entries(payload.errors).forEach(([field, messages]) => {
                        const message = Array.isArray(messages) ? String(messages[0]) : String(messages);
                        setError(field as keyof BookingForm, message);
                    });
                }

                throw new Error(payload.message || 'The payment details could not be prepared.');
            }

            const details = payload as PaymentDetails;
            setData((current) => ({
                ...current,
                payment_type: details.payment_type,
                payment_quote: details.payment_quote,
            }));
            setPaymentDetails(details);

            if (openModal) {
                setPaymentOpen(true);
            }
        } catch (error) {
            if (paymentDetails) {
                setData('payment_type', paymentDetails.payment_type);
            }

            setPaymentError(error instanceof Error ? error.message : 'The payment details could not be prepared.');
        } finally {
            setPreparingPayment(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void requestPaymentDetails(data.payment_type);
    };

    const submitBooking = () => {
        if (!data.proof_of_payment) {
            setError('proof_of_payment', 'A GCash proof of payment image is required.');

            return;
        }

        post('/book-now', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const selectPaymentType = (paymentType: PaymentType) => {
        setData('payment_type', paymentType);
        void requestPaymentDetails(paymentType, false);
    };

    const selectProof = (file: File | null) => {
        if (proofPreview) {
            URL.revokeObjectURL(proofPreview);
        }

        setData('proof_of_payment', file);
        setProofPreview(file ? URL.createObjectURL(file) : null);
        clearErrors('proof_of_payment');
    };

    return (
        <>
            <Head title="Book Now" />

            <div className="min-h-screen bg-[#f3f4f4] text-slate-800 dark:bg-[#07110f] dark:text-slate-100">
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

                <div className="mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                    Customer booking
                                </p>
                                <h2 className="mt-2 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-slate-50">
                                    Book now
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    Complete the booking details below.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-white/10 dark:bg-card">
                            <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                            Resort booking form
                                        </p>
                                        <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                                            Q8 Private Resort
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Fill out your reservation information.
                                        </p>
                                    </div>

                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
                                        />
                                    </FieldBox>

                                    <FieldBox label="Facebook Account" error={errors.facebook}>
                                        <input
                                            type="text"
                                            value={data.facebook}
                                            onChange={(e) => setData('facebook', e.target.value)}
                                            placeholder="Enter Facebook account"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
                                        />
                                    </FieldBox>

                                    <FieldBox label="Resort Category" error={errors.resort_option_id}>
                                        <select
                                            value={data.resort_option_id}
                                            onChange={(e) => setData('resort_option_id', e.target.value)}
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none dark:text-slate-50"
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none dark:text-slate-50"
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
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none dark:text-slate-50"
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
                                                className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
                                            />
                                        </FieldBox>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
                                    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                                        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                Selected resort
                                            </h4>
                                        </div>

                                        <div className="px-4 py-4">
                                            {selectedResort ? (
                                                <div className="space-y-3">
                                                    <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
                                                        {selectedResort.image ? (
                                                            <img
                                                                src={selectedResort.image}
                                                                alt={selectedResort.name}
                                                                className="h-48 w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-48 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
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
                                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                                                    Select a resort category to see its details.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                                        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                Total amount
                                            </h4>
                                        </div>

                                        <div className="space-y-4 px-4 py-4">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/10">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                                    Payment Method
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">GCash</p>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-emerald-200">
                                                    Reservation Total
                                                </p>
                                                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-emerald-50">
                                                    ₱
                                                    {Number(totalPrice).toLocaleString('en-PH', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing || preparingPayment}
                                                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {preparingPayment ? 'Preparing payment...' : 'Proceed to Payment'}
                                            </button>
                                            {paymentError && (
                                                <p className="text-sm text-red-600 dark:text-red-300">{paymentError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent
                    className="h-fit max-h-[calc(100dvh-8rem-env(safe-area-inset-bottom,0px))] overflow-y-auto sm:max-w-3xl"
                    // Keep the floating link inside the modal's focus/pointer scope, but
                    // remove transforms so its fixed position stays relative to the screen.
                    style={{
                        inset: '0 0 calc(6rem + env(safe-area-inset-bottom, 0px))',
                        margin: 'auto',
                        translate: 'none',
                        transform: 'none',
                        animation: 'none',
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <WalletCards className="size-5 text-emerald-600" />
                            GCash payment
                        </DialogTitle>
                        <DialogDescription>
                            Pay the calculated amount, then upload the GCash transaction screenshot for manual verification.
                        </DialogDescription>
                    </DialogHeader>

                    {paymentError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                            {paymentError}
                        </p>
                    )}

                    {paymentDetails && (
                        <div className="space-y-3">
                            <PaymentInfo label="Booking reference" value={paymentDetails.booking_reference} />
                            <div className="grid gap-2 sm:grid-cols-2">
                                <PaymentInfo label="GCash account name" value={gcash.name || 'Not configured'} />
                                <PaymentInfo label="GCash number" value={gcash.number || 'Not configured'} />
                            </div>

                            <div className="grid items-start gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Owner's GCash QR code
                                    </p>
                                    {gcash.qr_code_url ? (
                                        <img
                                            src={gcash.qr_code_url}
                                            alt="Resort owner's GCash QR code"
                                            className="mx-auto mt-2 aspect-square max-h-52 w-full rounded-lg bg-white object-contain p-2"
                                        />
                                    ) : (
                                        <div className="mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed bg-white p-3 text-center text-sm text-slate-500 dark:bg-black/10">
                                            Use the GCash number above. The QR code has not been configured yet.
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 space-y-3">
                                    <fieldset className="space-y-2">
                                        <legend className="text-sm font-semibold">Payment type</legend>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['Full Payment', 'Down Payment'] as PaymentType[]).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    disabled={preparingPayment || processing}
                                                    onClick={() => selectPaymentType(type)}
                                                    className={`min-h-9 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                        data.payment_type === type
                                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-100'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <div className="divide-y rounded-xl border bg-white px-3 dark:border-white/10 dark:bg-white/5">
                                        <AmountRow label="Total reservation" amount={paymentDetails.total_reservation_amount} />
                                        <AmountRow label="Amount to pay" amount={paymentDetails.amount_to_pay} emphasis />
                                        <AmountRow label="Remaining balance" amount={paymentDetails.remaining_balance} />
                                    </div>

                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                                        <div className="flex gap-2">
                                            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                                            <p>
                                                Your payment will not be marked as verified automatically. The resort administrator will review the uploaded proof first.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-emerald-400 dark:border-white/15 dark:bg-white/5">
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <Upload className="size-4" />
                                        GCash proof of payment
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                        Upload a JPG, PNG, or WEBP screenshot up to 5 MB.
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="mt-2 block w-full text-sm"
                                        onChange={(event) => selectProof(event.target.files?.[0] || null)}
                                    />
                                </label>
                                {errors.proof_of_payment && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.proof_of_payment}</p>
                                )}
                                {errors.payment_quote && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.payment_quote}</p>
                                )}
                                {proofPreview && (
                                    <img
                                        src={proofPreview}
                                        alt="Selected payment proof preview"
                                        className="mt-2 max-h-52 w-full rounded-lg border bg-white object-contain"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setPaymentOpen(false)}
                            disabled={processing}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={submitBooking}
                            disabled={!data.proof_of_payment || processing || preparingPayment || !paymentDetails}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Submitting...' : 'Submit Booking'}
                        </button>
                    </DialogFooter>
                    <MessengerButton url={messengerUrl} minimized={messengerMinimized} onMinimizedChange={setMessengerMinimized} />
                </DialogContent>
            </Dialog>
            {!paymentOpen && <MessengerButton url={messengerUrl} minimized={messengerMinimized} onMinimizedChange={setMessengerMinimized} />}
        </>
    );
}

function PaymentInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-lg border bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
    );
}

function AmountRow({ label, amount, emphasis = false }: { label: string; amount: string; emphasis?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
            <span className={emphasis ? 'text-lg font-bold text-emerald-700 dark:text-emerald-300' : 'text-sm font-semibold'}>
                ₱{Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500 dark:focus-within:ring-emerald-500/20">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {icon}
                    <span>{label}</span>
                </div>
                {children}
            </div>
            {error && <p className="mt-1 text-sm text-red-500 dark:text-red-300">{error}</p>}
        </div>
    );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/10">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-50">{value}</p>
        </div>
    );
}
