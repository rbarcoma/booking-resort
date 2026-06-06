import { Head, router, useForm } from '@inertiajs/react';
import { Eye, ImageIcon, Pencil, Save, Trash2, Video } from 'lucide-react';
import { useState } from 'react';

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
import { Input } from '@/components/ui/input';

type Section = {
    id: number;
    section: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image: string | null;
    contact_number: string | null;
    email: string | null;
    facebook_link: string | null;
    address: string | null;
    map_embed_url: string | null;
    media?: SiteMedia[];
};

type SiteMedia = {
    id: number;
    media_path: string;
    media_type: 'image' | 'video';
    label: string | null;
    sort_order: number;
};

type Props = {
    home: Section;
    about: Section;
    contact: Section;
};

type FieldKey =
    | 'title'
    | 'subtitle'
    | 'description'
    | 'image'
    | 'contact_number'
    | 'email'
    | 'facebook_link'
    | 'address'
    | 'map_embed_url';

type SectionConfig = {
    label: string;
    section: 'home' | 'about' | 'contact';
    fields: FieldKey[];
};

const sectionConfigs: SectionConfig[] = [
    {
        label: 'Home section',
        section: 'home',
        fields: ['title', 'subtitle', 'description', 'image'],
    },
    {
        label: 'About section',
        section: 'about',
        fields: ['title', 'description'],
    },
    {
        label: 'Contact section',
        section: 'contact',
        fields: ['title', 'contact_number', 'email', 'facebook_link', 'address', 'map_embed_url'],
    },
];

export default function LandingPageIndex({ home, about, contact }: Props) {
    const sections = { home, about, contact };
    const [viewSection, setViewSection] = useState<SectionConfig | null>(null);
    const [editSection, setEditSection] = useState<SectionConfig | null>(null);

    return (
        <>
            <Head title="Manage Landing Page" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="space-y-2">
                        <Badge variant="outline" className="w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                            Admin panel
                        </Badge>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Landing page content</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage the public home, about, and contact sections.
                            </p>
                        </div>
                    </div>

                    <Card className="gap-0 py-0">
                        <CardHeader className="py-4">
                            <CardTitle className="text-base">Landing page sections</CardTitle>
                            <CardDescription>
                                Review sections in the table, then open a modal to view details or make changes.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-6 pb-6">
                            <div className="overflow-hidden rounded-lg border bg-background">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[920px] text-sm">
                                        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Section</th>
                                                <th className="px-4 py-3 font-medium">Title</th>
                                                <th className="px-4 py-3 font-medium">Content summary</th>
                                                <th className="px-4 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sectionConfigs.map((config) => {
                                                const data = sections[config.section];

                                                return (
                                                    <tr key={config.section} className="align-top">
                                                        <td className="px-4 py-4 font-medium">{config.label}</td>
                                                        <td className="px-4 py-4">{data.title || '-'}</td>
                                                        <td className="max-w-md px-4 py-4 text-muted-foreground">
                                                            {sectionSummary(data)}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setViewSection(config)}
                                                                >
                                                                    <Eye className="size-4" />
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => setEditSection(config)}
                                                                >
                                                                    <Pencil className="size-4" />
                                                                    Edit
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {viewSection && (
                <ViewSectionDialog
                    config={viewSection}
                    data={sections[viewSection.section]}
                    open={Boolean(viewSection)}
                    onOpenChange={(open) => !open && setViewSection(null)}
                />
            )}

            {editSection && (
                <EditSectionDialog
                    key={editSection.section}
                    config={editSection}
                    data={sections[editSection.section]}
                    open={Boolean(editSection)}
                    onOpenChange={(open) => !open && setEditSection(null)}
                />
            )}
        </>
    );
}

function ViewSectionDialog({
    config,
    data,
    open,
    onOpenChange,
}: {
    config: SectionConfig;
    data: Section;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-4xl [&>*]:min-w-0">
                <DialogHeader>
                    <DialogTitle>{config.label}</DialogTitle>
                    <DialogDescription>Complete landing page section details.</DialogDescription>
                </DialogHeader>

                <div className={config.fields.includes('image') || config.section === 'about' ? 'grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]' : 'grid min-w-0 gap-3'}>
                    <div className="grid min-w-0 gap-3">
                        {config.fields.filter((field) => field !== 'image').map((field) => (
                            <DetailItem key={field} label={fieldLabel(field)} value={fieldValue(data, field)} />
                        ))}
                    </div>

                    {config.section === 'about' && (
                        <div className="min-w-0 rounded-lg border bg-background p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">Media library</p>
                                <span className="text-xs text-muted-foreground">
                                    {aboutMediaItems(data).length} uploaded
                                </span>
                            </div>

                            {aboutMediaItems(data).length > 0 ? (
                                <div className="max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2">
                                    <div className="flex w-max gap-3">
                                        {aboutMediaItems(data).map((media) => (
                                            <MediaPreviewCard key={media.id} media={media} />
                                        ))}
                                    </div>
                                </div>
                            ) : data.image ? (
                                <img
                                    src={`/storage/${data.image}`}
                                    alt={config.label}
                                    className="h-72 w-full rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                    <ImageIcon className="mr-2 size-4" />
                                    No media uploaded.
                                </div>
                            )}
                        </div>
                    )}

                    {config.fields.includes('image') && (
                        <div className="min-w-0 rounded-lg border bg-background p-3">
                            <p className="mb-3 text-sm font-semibold">Image</p>
                            {data.image ? (
                                <img
                                    src={`/storage/${data.image}`}
                                    alt={config.label}
                                    className="h-72 w-full rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                    <ImageIcon className="mr-2 size-4" />
                                    No image uploaded.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditSectionDialog({
    config,
    data,
    open,
    onOpenChange,
}: {
    config: SectionConfig;
    data: Section;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        description: data.description || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        facebook_link: data.facebook_link || '',
        address: data.address || '',
        map_embed_url: data.map_embed_url || '',
        image: null as File | null,
    });
    const mediaForm = useForm({
        media: [] as File[],
    });
    const [mediaUploading, setMediaUploading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/landing-page/${config.section}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const submitMedia = () => {
        const payload = new FormData();

        mediaForm.data.media.forEach((file) => {
            payload.append('media[]', file);
        });

        setMediaUploading(true);
        setMediaError(null);

        router.post('/admin/landing-page/about/media', payload, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                mediaForm.reset();
            },
            onError: (errors) => {
                setMediaError(
                    String(errors.media || errors['media.0'] || 'The selected media files could not be uploaded.'),
                );
            },
            onFinish: () => setMediaUploading(false),
        });
    };

    const deleteMedia = (mediaId: number) => {
        router.delete(`/admin/landing-page/media/${mediaId}`, {
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-4xl [&>*]:min-w-0">
                <DialogHeader>
                    <DialogTitle>Edit {config.label.toLowerCase()}</DialogTitle>
                    <DialogDescription>Update this section without changing the code.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="min-w-0 space-y-4">
                    {config.fields.includes('image') && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Current image</label>

                            <div className="overflow-hidden rounded-lg border bg-muted/20">
                                {data.image ? (
                                    <img
                                        src={`/storage/${data.image}`}
                                        alt={config.label}
                                        className="h-56 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                                        <ImageIcon className="mr-2 size-4" />
                                        No image uploaded
                                    </div>
                                )}
                            </div>

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => form.setData('image', e.target.files?.[0] || null)}
                            />
                            {form.errors.image && <p className="text-sm text-red-500">{form.errors.image}</p>}
                        </div>
                    )}

                    {config.section === 'about' && (
                        <div className="min-w-0 space-y-4 overflow-hidden rounded-lg border bg-muted/20 p-4">
                            <div>
                                <h3 className="text-sm font-semibold">About media library</h3>
                                <p className="text-sm text-muted-foreground">
                                    Upload multiple images or videos for the public About section.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) => {
                                        mediaForm.setData('media', Array.from(e.target.files || []));
                                        setMediaError(null);
                                    }}
                                />
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                        Supported: JPG, PNG, WEBP, MP4, MOV, WEBM, OGG.
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={mediaUploading || mediaForm.data.media.length === 0}
                                        onClick={submitMedia}
                                    >
                                        <Save className="size-4" />
                                        {mediaUploading ? 'Uploading...' : 'Upload media'}
                                    </Button>
                                </div>
                                {mediaError && <p className="text-sm text-red-500">{mediaError}</p>}
                            </div>

                            {aboutMediaItems(data).length > 0 ? (
                                <div className="max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2">
                                    <div className="flex w-max gap-3">
                                    {aboutMediaItems(data).map((media) => (
                                        <div key={media.id} className="w-52 shrink-0 overflow-hidden rounded-lg border bg-background">
                                            <MediaPreview media={media} className="h-32 w-full object-cover" />
                                            <div className="flex items-center justify-between gap-2 p-2">
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {media.media_type === 'video' ? 'Video' : 'Image'}
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    className="size-8"
                                                    onClick={() => deleteMedia(media.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
                                    No about media uploaded yet.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {config.fields.includes('title') && (
                            <Field
                                label="Title"
                                value={form.data.title}
                                onChange={(value) => form.setData('title', value)}
                                error={form.errors.title}
                            />
                        )}

                        {config.fields.includes('subtitle') && (
                            <Field
                                label="Subtitle"
                                value={form.data.subtitle}
                                onChange={(value) => form.setData('subtitle', value)}
                                error={form.errors.subtitle}
                            />
                        )}

                        {config.fields.includes('contact_number') && (
                            <Field
                                label="Contact number"
                                value={form.data.contact_number}
                                onChange={(value) => form.setData('contact_number', value)}
                                error={form.errors.contact_number}
                            />
                        )}

                        {config.fields.includes('email') && (
                            <Field
                                label="Email"
                                value={form.data.email}
                                onChange={(value) => form.setData('email', value)}
                                error={form.errors.email}
                            />
                        )}

                        {config.fields.includes('facebook_link') && (
                            <Field
                                label="Facebook link"
                                value={form.data.facebook_link}
                                onChange={(value) => form.setData('facebook_link', value)}
                                error={form.errors.facebook_link}
                            />
                        )}

                        {config.fields.includes('description') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Description"
                                value={form.data.description}
                                onChange={(value) => form.setData('description', value)}
                                error={form.errors.description}
                            />
                        )}

                        {config.fields.includes('address') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Address"
                                value={form.data.address}
                                onChange={(value) => form.setData('address', value)}
                                error={form.errors.address}
                            />
                        )}

                        {config.fields.includes('map_embed_url') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Google Maps embed URL"
                                value={form.data.map_embed_url}
                                onChange={(value) => form.setData('map_embed_url', value)}
                                error={form.errors.map_embed_url}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={form.processing}>
                            <Save className="size-4" />
                            {form.processing ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MediaPreviewCard({ media }: { media: SiteMedia }) {
    return (
        <div className="w-56 shrink-0 overflow-hidden rounded-lg border bg-background">
            <MediaPreview media={media} className="h-36 w-full object-cover" />
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                {media.media_type === 'video' ? <Video className="size-4" /> : <ImageIcon className="size-4" />}
                <span className="truncate">{media.label || (media.media_type === 'video' ? 'About video' : 'About image')}</span>
            </div>
        </div>
    );
}

function MediaPreview({ media, className }: { media: SiteMedia; className: string }) {
    const src = `/storage/${media.media_path}`;

    if (media.media_type === 'video') {
        return (
            <video
                src={src}
                className={className}
                controls
                muted
                playsInline
            />
        );
    }

    return (
        <img
            src={src}
            alt={media.label || 'About media'}
            className={className}
        />
    );
}

function Field({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    error,
    className = '',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-medium">{label}</label>
            <textarea
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="max-w-full min-w-0 overflow-hidden rounded-lg border bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-2 max-w-full min-w-0 whitespace-pre-wrap break-all text-sm font-medium [overflow-wrap:anywhere]">
                {value || '-'}
            </div>
        </div>
    );
}

function sectionSummary(data: Section) {
    const summary = data.description || data.subtitle || data.address || data.contact_number || 'No content available.';

    return truncateText(summary, 140);
}

function aboutMediaItems(data: Section) {
    return data.media || [];
}

function fieldValue(data: Section, field: FieldKey) {
    return data[field] || '-';
}

function fieldLabel(field: FieldKey) {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
        .replace('Url', 'URL');
}

function truncateText(value: string, maxLength: number) {
    return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
