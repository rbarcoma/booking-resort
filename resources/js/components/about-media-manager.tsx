import { Link, useForm } from '@inertiajs/react';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    GalleryCategory,
    GalleryOptions,
    PoolKey,
    SiteMedia,
} from '@/types/gallery';

const selectClass =
    'h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-ring';

export default function AboutMediaManager({
    media,
    options,
}: {
    media: SiteMedia[];
    options: GalleryOptions;
}) {
    const form = useForm({
        media: [] as File[],
        pool: '' as PoolKey | '',
        category: '' as GalleryCategory | '',
    });
    const [inputKey, setInputKey] = useState(0);

    const upload = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/landing-page/about/media', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('media');
                setInputKey((key) => key + 1);
            },
        });
    };

    return (
        <div className="min-w-0 space-y-3 rounded-lg border bg-muted/20 p-3">
            <div>
                <h3 className="text-sm font-semibold">About media library</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Upload a batch to one pool and category. Images appear in
                    that group on the See All page; videos remain in the
                    landing-page showcase.
                </p>
                <Link
                    href="/gallery"
                    className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
                >
                    View public gallery
                </Link>
            </div>
            <form
                onSubmit={upload}
                className="space-y-2 rounded-lg border bg-background p-3"
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                        <span>Pool</span>
                        <select
                            required
                            value={form.data.pool}
                            onChange={(event) =>
                                form.setData(
                                    'pool',
                                    event.target.value as PoolKey,
                                )
                            }
                            className={selectClass}
                        >
                            <option value="" disabled>
                                Select a pool
                            </option>
                            {options.pools.map((pool) => (
                                <option key={pool.value} value={pool.value}>
                                    {pool.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                        <span>Category</span>
                        <select
                            required
                            value={form.data.category}
                            onChange={(event) =>
                                form.setData(
                                    'category',
                                    event.target.value as GalleryCategory,
                                )
                            }
                            className={selectClass}
                        >
                            <option value="" disabled>
                                Select a category
                            </option>
                            {options.categories.map((category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label className="block space-y-1 text-sm font-medium">
                    <span>Images or videos</span>
                    <Input
                        key={inputKey}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,video/ogg,audio/ogg,.ogg"
                        multiple
                        required
                        onChange={(event) =>
                            form.setData(
                                'media',
                                Array.from(event.target.files || []),
                            )
                        }
                    />
                </label>
                <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP, MP4, MOV, WEBM, or OGG. Up to 50 MB per
                    file. All selected files use the pool and category above.
                </p>
                <FormErrors errors={form.errors} />
                {form.progress && (
                    <p role="status" className="text-xs text-muted-foreground">
                        Uploading: {form.progress.percentage}%
                    </p>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={
                        form.processing ||
                        !form.data.media.length ||
                        !form.data.pool ||
                        !form.data.category
                    }
                >
                    <Save className="size-4" />{' '}
                    {form.processing ? 'Uploading...' : 'Upload media'}
                </Button>
            </form>
            <AboutMediaLibrary media={media} options={options} editable />
        </div>
    );
}

export function AboutMediaLibrary({
    media,
    options,
    editable = false,
}: {
    media: SiteMedia[];
    options: GalleryOptions;
    editable?: boolean;
}) {
    const unassigned = media.filter(
        (item) =>
            !options.pools.some((pool) => pool.value === item.pool) ||
            !options.categories.some(
                (category) => category.value === item.category,
            ),
    );

    return (
        <div className={editable ? 'space-y-3' : 'grid items-start gap-3 md:grid-cols-2'}>
            {options.pools.map((pool) => (
                <section
                    key={pool.value}
                    className="min-w-0 space-y-3 rounded-lg border bg-background p-3"
                >
                    <h4 className="font-semibold">{pool.label}</h4>
                    {options.categories.map((category) => {
                        const images = media.filter(
                            (item) =>
                                item.pool === pool.value &&
                                item.category === category.value,
                        );

                        return (
                            <div key={category.value} className="space-y-2">
                                <h5 className="text-sm font-medium">
                                    {category.label}{' '}
                                    <span className="text-muted-foreground">
                                        ({images.length})
                                    </span>
                                </h5>
                                {images.length > 0 ? (
                                    <div
                                        className={`grid items-start gap-2 ${editable ? 'sm:grid-cols-2' : 'grid-cols-2'}`}
                                    >
                                        {images.map((item) => (
                                            <MediaCard
                                                key={`${item.id}-${item.pool}-${item.category}-${item.label}`}
                                                media={item}
                                                options={options}
                                                editable={editable}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No media uploaded.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </section>
            ))}
            {unassigned.length > 0 && (
                <section className="min-w-0 space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 md:col-span-2">
                    <h4 className="font-semibold">
                        Needs grouping ({unassigned.length})
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        These existing files are preserved in the About
                        showcase. Assign a pool and category to include images
                        in the public gallery.
                    </p>
                    <div
                        className={`grid items-start gap-2 ${editable ? 'sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}
                    >
                        {unassigned.map((item) => (
                            <MediaCard
                                key={`${item.id}-${item.pool}-${item.category}-${item.label}`}
                                media={item}
                                options={options}
                                editable={editable}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function MediaCard({
    media,
    options,
    editable,
}: {
    media: SiteMedia;
    options: GalleryOptions;
    editable: boolean;
}) {
    const form = useForm({
        pool: media.pool || '',
        category: media.category || '',
        label: media.label || '',
    });
    const deletion = useForm({});
    const [confirmDelete, setConfirmDelete] = useState(false);
    const src = media.media_url || media.media_path;

    const save = (event: React.FormEvent) => {
        event.preventDefault();
        form.patch(`/admin/landing-page/media/${media.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-w-0 overflow-hidden rounded-lg border bg-background">
            {media.media_type === 'video' ? (
                <video
                    src={src}
                    className="h-32 w-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                />
            ) : (
                <img
                    src={src}
                    alt={media.label || 'About image'}
                    className={editable ? 'h-32 w-full object-cover' : 'h-28 w-full object-cover'}
                    loading="lazy"
                />
            )}
            {editable ? (
                <form onSubmit={save} className="space-y-2 p-2.5">
                    <label className="block space-y-1 text-xs font-medium">
                        <span>Pool</span>
                        <select
                            required
                            value={form.data.pool}
                            onChange={(event) =>
                                form.setData('pool', event.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="" disabled>
                                Select a pool
                            </option>
                            {options.pools.map((pool) => (
                                <option key={pool.value} value={pool.value}>
                                    {pool.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block space-y-1 text-xs font-medium">
                        <span>Category</span>
                        <select
                            required
                            value={form.data.category}
                            onChange={(event) =>
                                form.setData('category', event.target.value)
                            }
                            className={selectClass}
                        >
                            <option value="" disabled>
                                Select a category
                            </option>
                            {options.categories.map((category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block space-y-1 text-xs font-medium">
                        <span>Caption (optional)</span>
                        <Input
                            value={form.data.label}
                            maxLength={255}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                        />
                    </label>
                    <FormErrors
                        errors={{ ...form.errors, ...deletion.errors }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                form.processing ||
                                deletion.processing ||
                                !form.data.pool ||
                                !form.data.category
                            }
                        >
                            {form.processing ? 'Saving...' : 'Save grouping'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={form.processing || deletion.processing}
                            onClick={() => setConfirmDelete(!confirmDelete)}
                            aria-label={`Delete ${media.label || 'media'}`}
                        >
                            <Trash2 className="size-4" /> Delete
                        </Button>
                    </div>
                    {form.recentlySuccessful && (
                        <p role="status" className="text-xs text-emerald-600">
                            Grouping saved.
                        </p>
                    )}
                    {confirmDelete && (
                        <div className="space-y-2 rounded-md border border-destructive/40 p-3">
                            <p className="text-xs">
                                Delete this file from the About showcase and
                                gallery?
                            </p>
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={
                                    deletion.processing || form.processing
                                }
                                onClick={() =>
                                    deletion.delete(
                                        `/admin/landing-page/media/${media.id}`,
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {deletion.processing
                                    ? 'Deleting...'
                                    : 'Confirm delete'}
                            </Button>
                        </div>
                    )}
                </form>
            ) : (
                <p className="p-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    {media.label ||
                        (media.media_type === 'video'
                            ? 'About video'
                            : 'About image')}
                </p>
            )}
        </div>
    );
}

function FormErrors({ errors }: { errors: Record<string, string> }) {
    return Object.entries(errors).map(([field, message]) => (
        <p key={field} role="alert" className="text-sm text-red-500">
            {message}
        </p>
    ));
}
