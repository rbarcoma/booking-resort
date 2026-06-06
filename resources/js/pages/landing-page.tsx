import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookingCalendar from '@/components/booking-calendar';

type GalleryImage = {
    id: number;
    image_path: string;
    label?: string | null;
    sort_order?: number;
};

type AboutMedia = {
    id: number;
    media_path: string;
    media_type: 'image' | 'video';
    label?: string | null;
    sort_order?: number;
};

type ResortOption = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: string | number;
    max_pax: number;
    description: string | null;
    images?: GalleryImage[];
};

type SectionData = {
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string | null;
    media?: AboutMedia[];
};

type ContactData = {
    title?: string;
    contact_number?: string;
    email?: string;
    facebook_link?: string;
    address?: string;
    map_embed_url?: string;
};

type Props = {
    home: SectionData;
    about: SectionData;
    contact: ContactData;
    resortOptions: ResortOption[];
    bookings: BookingEvent[];
};

type BookingEvent = {
    date: string;
    label: string;
    time: string;
    pool?: string | null;
    reference_number?: string;
    status?: string | null;
};

export default function LandingPage({ home, about, contact, resortOptions, bookings }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <Head title="Q8 Private Resort" />

            <div className="relative min-h-screen bg-white text-slate-800 dark:bg-[#07110f] dark:text-slate-100">
                <header className="sticky top-0 z-50 bg-[#0f2f2b]/80 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <a href="#home" className="flex items-center gap-3">
                            <div>
                                <h1 className="text-sm font-semibold text-white">Q8 Private Resort</h1>
                            </div>
                        </a>

                        <nav className="hidden items-center gap-5 md:flex">
                            <a href="#home" className="text-sm text-white/85 transition hover:text-white">
                                Home
                            </a>
                            <a href="#about" className="text-sm text-white/85 transition hover:text-white">
                                About Us
                            </a>
                            <a href="#offers" className="text-sm text-white/85 transition hover:text-white">
                                Services
                            </a>
                            <a href="#contact" className="text-sm text-white/85 transition hover:text-white">
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
                        <div className="border-t border-white/10 bg-[#0f2f2b]/95 backdrop-blur md:hidden">
                            <div className="space-y-1 px-4 py-4">
                                <a
                                    href="#home"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    Home
                                </a>
                                <a
                                    href="#about"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    About Us
                                </a>
                                <a
                                    href="#offers"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                                >
                                    Services
                                </a>
                                <a
                                    href="#contact"
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

                <section
                    id="home"
                    className="relative -mt-16 min-h-screen overflow-hidden pt-16"
                >
                    <div className="absolute inset-x-0 -top-16 bottom-0">
                        {/* Background Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${home.image || resortOptions[0]?.image})`,
                            }}
                        />

                        {/* Green Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#163f38]/90 via-[#21594e]/80 to-[#3a7a6d]/90" />
                    </div>

                    <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
                        <div className="max-w-2xl">
                            <div className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-100">
                                Private Resort Booking
                            </div>

                            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {home.title || 'Q8 Private Resort'}
                            </h2>

                            <p className="mt-4 text-base leading-7 text-white/85 sm:text-lg">
                                {home.subtitle ||
                                    'A peaceful private resort for family gatherings, outings, and unforgettable moments.'}
                            </p>

                            <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                                {home.description ||
                                    'Enjoy a relaxing stay with our private pool options, easy online booking, and a place designed for comfort and fun.'}
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/book-now"
                                    className="inline-flex h-10 items-center rounded-md bg-emerald-500 px-5 text-sm font-medium text-white transition hover:bg-emerald-600"
                                >
                                    Book Your Schedule
                                </Link>
                                <a
                                    href="/login"
                                    className="inline-flex h-10 items-center rounded-md border border-white/20 bg-white/10 px-5 text-sm font-medium text-white transition hover:bg-white/20"
                                >
                                    Admin
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="about" className="py-24 sm:py-32">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-600">
                                About Us
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                                A private resort designed for comfort, fun, and memorable gatherings
                            </h3>
                            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                                {about.description ||
                                    'Q8 Private Resort is a relaxing destination in Los Baños, Laguna, perfect for family bonding, celebrations, and private outings. We provide a comfortable and enjoyable place where guests can unwind and create memorable experiences.'}
                            </p>

                            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Peaceful Ambiance</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        A relaxing environment for family time, celebrations, and private gatherings.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Simple Booking</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        Easily reserve your preferred schedule online with a clear booking process.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Private Experience</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        Enjoy a more exclusive and comfortable resort experience with your guests.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Great for Events</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        Ideal for birthdays, reunions, outings, and special occasions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <AboutMediaShowcase about={about} />
                    </div>
                </section>

                <section id="offers" className="bg-[#eef6f3] py-16 dark:bg-[#0b1714] sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-600">
                                Resort services
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                                Choose the pool category that fits your booking
                            </h3>
                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                                Browse each pool and view more photos of the resort inclusions like rooms, videoke, kitchen, and billiards.
                            </p>
                        </div>
                        <BookingCalendar bookings={bookings}/>

                        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {resortOptions.map((option) => (
                                <PoolCard key={option.id} option={option} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="contact" className="py-24 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-600">
                                    Contact
                                </p>
                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                                    Get in touch with us
                                </h3>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                                    For booking concerns, availability, and inquiries, contact us through the details below.
                                </p>

                                <div className="mt-6 space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Contact Number</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {contact.contact_number || '0906-541-1492'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {contact.email || '-'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Facebook Page</p>
                                        <a
                                            href={contact.facebook_link || 'https://www.facebook.com/profile.php?id=100083094471286'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1 inline-block break-all text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                                        >
                                            {contact.facebook_link || 'Visit Facebook Page'}
                                        </a>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {contact.address || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-card">
                                <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                                    <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">Resort Location</h4>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Find us through Google Maps</p>
                                </div>

                                <iframe
                                    src={contact.map_embed_url}
                                    width="100%"
                                    height="380"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Q8 Private Resort Location"
                                />

                                <div className="px-5 py-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{contact.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="bg-[#0b211e] py-7 text-center text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-sm text-white/80">© 2026 Q8 Private Resort. All rights reserved.</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                            Private Resort Booking System
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

function AboutMediaShowcase({ about }: { about: SectionData }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const media =
        about.media && about.media.length > 0
            ? about.media
            : about.image
              ? [
                    {
                        id: 0,
                        media_path: about.image,
                        media_type: 'image' as const,
                        label: 'About Resort',
                    },
                ]
              : [];

    const prev = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? media.length - 1 : prevIndex - 1));
    };

    const next = () => {
        setCurrentIndex((prevIndex) => (prevIndex === media.length - 1 ? 0 : prevIndex + 1));
    };

    const currentMedia = media[currentIndex];

    return (
        <div className="mt-13">
            <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-lg dark:bg-white/5 dark:ring-1 dark:ring-white/10">
                {currentMedia ? (
                    currentMedia.media_type === 'video' ? (
                        <video
                            src={currentMedia.media_path}
                            className="h-[400px] w-full object-cover"
                            controls
                            playsInline
                            preload="metadata"
                        />
                    ) : (
                        <img
                            src={currentMedia.media_path}
                            alt={currentMedia.label || 'About Resort'}
                            className="h-[400px] w-full object-cover"
                        />
                    )
                ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                        Resort media
                    </div>
                )}

                {media.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/65"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/65"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>

            {media.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {media.map((item, index) => (
                        <button
                            key={`${item.id}-${index}`}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${
                                currentIndex === index ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-500/30' : 'border-slate-200 dark:border-white/15'
                            }`}
                        >
                            {item.media_type === 'video' ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs font-medium text-white">
                                    Video
                                </div>
                            ) : (
                                <img src={item.media_path} alt={item.label || 'About media'} className="h-full w-full object-cover" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function PoolCard({ option }: { option: ResortOption }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const images =
        option.images && option.images.length > 0
            ? option.images.map((img) => img.image_path)
            : option.image
              ? [option.image]
              : [];

    const prev = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    };

    const next = () => {
        setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-card">
            <div className="relative">
                {images.length > 0 ? (
                    <img
                        src={images[currentIndex]}
                        alt={option.name}
                        className="h-56 w-full object-cover"
                    />
                ) : (
                    <div className="flex h-56 items-center justify-center bg-slate-200 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        No image available
                    </div>
                )}

                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/65"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/65"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-2 w-2 rounded-full transition ${
                                        currentIndex === index ? 'bg-white' : 'bg-white/45'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{option.name}</h4>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {option.description || 'No description available.'}
                        </p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-left dark:bg-emerald-500/15 sm:text-right">
                        <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Starting Price</p>
                        <p className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-100">
                            ₱
                            {Number(option.price).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Maximum Pax</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{option.max_pax}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Availability</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Open for Booking</p>
                    </div>
                </div>

                <div className="mt-5">
                    <Link
                        href="/book-now"
                        className="inline-flex h-9 items-center rounded-md bg-[#163f38] px-4 text-sm font-medium text-white transition hover:bg-[#1d5248]"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
