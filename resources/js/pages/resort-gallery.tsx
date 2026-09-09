import { Head } from '@inertiajs/react';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import LandingNavbar from '@/components/landing-navbar';
import MessengerButton from '@/components/messenger-button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { GalleryCategory, PoolKey } from '@/types/gallery';

type GalleryImage = { id: number; url: string; label: string | null };
type GalleryPool = {
    id: PoolKey;
    label: string;
    categories: {
        id: GalleryCategory;
        label: string;
        images: GalleryImage[];
    }[];
};

export default function ResortGallery({
    pools,
    messengerUrl,
}: {
    pools: GalleryPool[];
    messengerUrl: string;
}) {
    const [messengerMinimized, setMessengerMinimized] = useState(false);
    const [selected, setSelected] = useState<{
        image: GalleryImage;
        title: string;
    } | null>(null);

    return (
        <>
            <Head title="Resort Gallery" />
            <div className="min-h-screen bg-white text-slate-800 dark:bg-[#07110f] dark:text-slate-100">
                <LandingNavbar />
                <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
                    <div>
                        <a
                            href="/#about"
                            className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                            <ArrowLeft className="size-4" /> Back to About Us
                        </a>
                        <p className="mt-8 text-xs font-medium tracking-[0.22em] text-emerald-600 uppercase">
                            Explore Q8 Private Resort
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Resort gallery
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                            Explore the rooms, pools, kitchens, cottages, and
                            more in each pool area.
                        </p>
                        <nav
                            aria-label="Pool sections"
                            className="mt-6 flex flex-wrap gap-3"
                        >
                            {pools.map((pool) => (
                                <a
                                    key={pool.id}
                                    href={`#${pool.id}-pool`}
                                    className="rounded-md bg-[#163f38] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d5248]"
                                >
                                    {pool.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {pools.map((pool) => (
                        <section
                            key={pool.id}
                            id={`${pool.id}-pool`}
                            aria-labelledby={`${pool.id}-title`}
                            className="scroll-mt-24 space-y-8 rounded-2xl border border-slate-200 bg-[#eef6f3]/60 p-5 sm:p-8 dark:border-white/10 dark:bg-[#0b1714]"
                        >
                            <div className="border-b border-slate-200 pb-5 dark:border-white/10">
                                <h2
                                    id={`${pool.id}-title`}
                                    className="text-2xl font-semibold tracking-tight"
                                >
                                    {pool.label}
                                </h2>
                                <nav
                                    aria-label={`${pool.label} categories`}
                                    className="mt-4 flex flex-wrap gap-x-5 gap-y-2"
                                >
                                    {pool.categories.map((category) => (
                                        <a
                                            key={category.id}
                                            href={`#${pool.id}-${category.id}`}
                                            className="text-sm text-emerald-700 hover:underline dark:text-emerald-300"
                                        >
                                            {category.label}{' '}
                                            <span className="text-slate-500 dark:text-slate-400">
                                                ({category.images.length})
                                            </span>
                                        </a>
                                    ))}
                                </nav>
                            </div>
                            {pool.categories.map((category) => (
                                <section
                                    key={category.id}
                                    id={`${pool.id}-${category.id}`}
                                    aria-labelledby={`${pool.id}-${category.id}-title`}
                                    className="scroll-mt-24"
                                >
                                    <h3
                                        id={`${pool.id}-${category.id}-title`}
                                        className="mb-4 text-lg font-semibold"
                                    >
                                        {category.label}
                                    </h3>
                                    {category.images.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {category.images.map(
                                                (image, index) => {
                                                    const title = `${pool.label} · ${category.label}`;
                                                    const caption =
                                                        image.label &&
                                                        image.label !==
                                                            'About image'
                                                            ? image.label
                                                            : `${category.label} ${index + 1}`;

                                                    return (
                                                        <button
                                                            key={image.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelected({
                                                                    image,
                                                                    title,
                                                                })
                                                            }
                                                            aria-label={`View ${title}: ${caption}`}
                                                            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-white/10 dark:bg-white/5"
                                                        >
                                                            <div className="overflow-hidden">
                                                                <img
                                                                    src={
                                                                        image.url
                                                                    }
                                                                    alt={`${title}: ${caption}`}
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                                                                />
                                                            </div>
                                                            <p className="px-4 py-3 text-sm font-medium">
                                                                {caption}
                                                            </p>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    ) : (
                                        <p className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                                            <ImageIcon className="size-4 shrink-0" />{' '}
                                            No {category.label.toLowerCase()}{' '}
                                            photos added for {pool.label} yet.
                                        </p>
                                    )}
                                </section>
                            ))}
                        </section>
                    ))}
                </main>
                <footer className="bg-[#0b211e] px-4 pt-7 pb-28 text-center text-sm text-white/80">
                    © 2026 Q8 Private Resort. All rights reserved.
                </footer>
            </div>
            <Dialog
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent
                    className="h-fit max-h-[calc(100dvh-8rem-env(safe-area-inset-bottom,0px))] sm:max-w-4xl"
                    // Keep Messenger in the modal's focus scope and fixed to the viewport.
                    style={{
                        inset: '0 0 calc(6rem + env(safe-area-inset-bottom, 0px))',
                        margin: 'auto',
                        translate: 'none',
                        transform: 'none',
                        animation: 'none',
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {selected?.title || 'Resort photo'}
                        </DialogTitle>
                        <DialogDescription>
                            {selected?.image.label ||
                                'View the full resort photo.'}
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <img
                            src={selected.image.url}
                            alt={`${selected.title}: ${selected.image.label || 'Resort photo'}`}
                            className="max-h-[calc(100dvh-14rem)] w-full rounded-lg object-contain"
                        />
                    )}
                    <MessengerButton
                        url={messengerUrl}
                        minimized={messengerMinimized}
                        onMinimizedChange={setMessengerMinimized}
                    />
                </DialogContent>
            </Dialog>
            {!selected && (
                <MessengerButton
                    url={messengerUrl}
                    minimized={messengerMinimized}
                    onMinimizedChange={setMessengerMinimized}
                />
            )}
        </>
    );
}
