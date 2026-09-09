import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const navigation = [
    { section: 'home', label: 'Home' },
    { section: 'about', label: 'About Us' },
    { section: 'offers', label: 'Services' },
    { section: 'contact', label: 'Contact' },
];

export default function LandingNavbar({
    onLandingPage = false,
}: {
    onLandingPage?: boolean;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const sectionHref = (section: string) =>
        `${onLandingPage ? '' : '/'}#${section}`;

    return (
        <header className="sticky top-0 z-50 bg-[#0f2f2b]/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <a
                    href={sectionHref('home')}
                    className="flex items-center gap-3"
                >
                    <h1 className="text-sm font-semibold text-white">
                        Q8 Private Resort
                    </h1>
                </a>

                <nav
                    aria-label="Main navigation"
                    className="hidden items-center gap-5 md:flex"
                >
                    {navigation.map(({ section, label }) => (
                        <a
                            key={section}
                            href={sectionHref(section)}
                            className="text-sm text-white/85 transition hover:text-white"
                        >
                            {label}
                        </a>
                    ))}
                    <Link
                        href="/book-now"
                        className="inline-flex h-9 items-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-white transition hover:bg-emerald-600"
                    >
                        Book Now
                    </Link>
                </nav>

                <button
                    type="button"
                    aria-label={
                        mobileOpen ? 'Close navigation' : 'Open navigation'
                    }
                    aria-expanded={mobileOpen}
                    aria-controls="landing-mobile-navigation"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 text-white md:hidden"
                >
                    <Menu className="h-4 w-4" />
                </button>
            </div>

            {mobileOpen && (
                <nav
                    id="landing-mobile-navigation"
                    aria-label="Mobile navigation"
                    className="border-t border-white/10 bg-[#0f2f2b]/95 backdrop-blur md:hidden"
                >
                    <div className="space-y-1 px-4 py-4">
                        {navigation.map(({ section, label }) => (
                            <a
                                key={section}
                                href={sectionHref(section)}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                            >
                                {label}
                            </a>
                        ))}
                        <Link
                            href="/book-now"
                            onClick={() => setMobileOpen(false)}
                            className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-white transition hover:bg-emerald-600"
                        >
                            Book Now
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    );
}
