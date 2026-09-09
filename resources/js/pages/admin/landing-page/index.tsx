import { Head, useForm } from '@inertiajs/react';
import { Eye, ImageIcon, Pencil, Save } from 'lucide-react';
import { useState } from 'react';

import AboutMediaManager, { AboutMediaLibrary } from '@/components/about-media-manager';
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
import type { GalleryOptions, SiteMedia } from '@/types/gallery';

type Section = {
    id: number;
    section: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image: string | null;
    image_url: string | null;
    contact_number: string | null;
    gcash_name: string | null;
    gcash_number: string | null;
    gcash_qr_code: string | null;
    email: string | null;
    facebook_link: string | null;
    messenger_link: string | null;
    address: string | null;
    map_embed_url: string | null;
    media?: SiteMedia[];
};

type Props = {
    home: Section;
    about: Section;
    contact: Section;
    galleryOptions: GalleryOptions;
};

type FieldKey =
    | 'title'
    | 'subtitle'
    | 'description'
    | 'image'
    | 'contact_number'
    | 'gcash_name'
    | 'gcash_number'
    | 'email'
    | 'facebook_link'
    | 'messenger_link'
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
        fields: ['title', 'contact_number', 'gcash_name', 'gcash_number', 'email', 'facebook_link', 'messenger_link', 'address', 'map_embed_url'],
    },
];

export default function LandingPageIndex({ home, about, contact, galleryOptions }: Props) {
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
                    galleryOptions={galleryOptions}
                    config={viewSection}
                    data={sections[viewSection.section]}
                    open={Boolean(viewSection)}
                    onOpenChange={(open) => !open && setViewSection(null)}
                />
            )}

            {editSection && (
                <EditSectionDialog
                    key={editSection.section}
                    galleryOptions={galleryOptions}
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
    galleryOptions,
    open,
    onOpenChange,
}: {
    config: SectionConfig;
    data: Section;
    galleryOptions: GalleryOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={config.section === 'about' ? 'sm:max-w-4xl' : 'sm:max-w-3xl'}>
                <DialogHeader>
                    <DialogTitle>{config.label}</DialogTitle>
                    <DialogDescription>Complete landing page section details.</DialogDescription>
                </DialogHeader>

                <div className={config.fields.includes('image') ? 'grid min-w-0 items-start gap-3 sm:grid-cols-2' : 'grid min-w-0 items-start gap-3'}>
                    <div className={`grid min-w-0 content-start items-start gap-2 ${config.fields.includes('image') ? '' : 'sm:grid-cols-2'}`}>
                        {config.fields.filter((field) => field !== 'image').map((field) => (
                            <DetailItem
                                key={field}
                                label={fieldLabel(field)}
                                value={fieldValue(data, field)}
                                className={field === 'address' || field === 'map_embed_url' ? 'sm:col-span-2' : ''}
                            />
                        ))}
                    </div>

                    {config.section === 'about' && (
                        <AboutMediaLibrary media={aboutMediaItems(data)} options={galleryOptions} />
                    )}

                    {config.fields.includes('image') && (
                        <div className="min-w-0 rounded-lg border bg-background p-3">
                            <p className="mb-2 text-sm font-semibold">Image</p>
                            {sectionImageUrl(data) ? (
                                <img
                                    src={sectionImageUrl(data) || ''}
                                    alt={config.label}
                                    className="h-44 w-full rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                    <ImageIcon className="mr-2 size-4" />
                                    No image uploaded.
                                </div>
                            )}
                        </div>
                    )}

                    {config.section === 'contact' && (
                        <div className="min-w-0 rounded-lg border bg-background p-3">
                            <p className="mb-2 text-sm font-semibold">GCash QR code</p>
                            {data.gcash_qr_code ? (
                                <img
                                    src={data.gcash_qr_code}
                                    alt="GCash QR code"
                                    className="mx-auto max-h-48 rounded-md object-contain"
                                />
                            ) : (
                                <div className="flex min-h-12 items-center justify-center rounded-md border border-dashed p-2 text-sm text-muted-foreground">
                                    <ImageIcon className="mr-2 size-4" />
                                    No GCash QR code uploaded.
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
    galleryOptions,
    open,
    onOpenChange,
}: {
    config: SectionConfig;
    data: Section;
    galleryOptions: GalleryOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        description: data.description || '',
        contact_number: data.contact_number || '',
        gcash_name: data.gcash_name || '',
        gcash_number: data.gcash_number || '',
        gcash_qr_code: null as File | null,
        email: data.email || '',
        facebook_link: data.facebook_link || '',
        messenger_link: data.messenger_link || '',
        address: data.address || '',
        map_embed_url: data.map_embed_url || '',
        image: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/landing-page/${config.section}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={config.section === 'about' ? 'sm:max-w-4xl' : 'sm:max-w-3xl'}>
                <DialogHeader>
                    <DialogTitle>Edit {config.label.toLowerCase()}</DialogTitle>
                    <DialogDescription>Update this section without changing the code.</DialogDescription>
                </DialogHeader>

                {config.section === 'about' && (
                    <AboutMediaManager media={aboutMediaItems(data)} options={galleryOptions} />
                )}

                <form onSubmit={submit} className="min-w-0 space-y-3">
                    {config.fields.includes('image') && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current image</label>

                            <div className="overflow-hidden rounded-lg border bg-muted/20">
                                {sectionImageUrl(data) ? (
                                    <img
                                        src={sectionImageUrl(data) || ''}
                                        alt={config.label}
                                        className="h-40 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                                        <ImageIcon className="mr-2 size-4" />
                                        No image uploaded
                                    </div>
                                )}
                            </div>

                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => form.setData('image', e.target.files?.[0] || null)}
                            />
                            <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP up to 5 MB.</p>
                            {form.errors.image && <p className="text-sm text-red-500">{form.errors.image}</p>}
                        </div>
                    )}



                    <div className="grid items-start gap-x-3 gap-y-3 sm:grid-cols-2">
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

                        {config.fields.includes('gcash_name') && (
                            <Field
                                label="GCash account name"
                                hint="Owner's registered GCash name, shown during payment."
                                value={form.data.gcash_name}
                                onChange={(value) => form.setData('gcash_name', value)}
                                error={form.errors.gcash_name}
                            />
                        )}

                        {config.fields.includes('gcash_number') && (
                            <Field
                                label="GCash number"
                                value={form.data.gcash_number}
                                onChange={(value) => form.setData('gcash_number', value)}
                                error={form.errors.gcash_number}
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
                                hint="Public Page URL for the Contact section, not a chat link."
                                value={form.data.facebook_link}
                                onChange={(value) => form.setData('facebook_link', value)}
                                error={form.errors.facebook_link}
                            />
                        )}

                        {config.fields.includes('messenger_link') && (
                            <Field
                                label="Messenger link"
                                hint="facebook.com/messages/t/... or m.me link for all Messenger buttons."
                                value={form.data.messenger_link}
                                onChange={(value) => form.setData('messenger_link', value)}
                                error={form.errors.messenger_link}
                            />
                        )}

                        {config.fields.includes('description') && (
                            <TextAreaField
                                className="sm:col-span-2"
                                label="Description"
                                value={form.data.description}
                                onChange={(value) => form.setData('description', value)}
                                error={form.errors.description}
                            />
                        )}

                        {config.fields.includes('address') && (
                            <TextAreaField
                                label="Address"
                                value={form.data.address}
                                onChange={(value) => form.setData('address', value)}
                                error={form.errors.address}
                            />
                        )}

                        {config.fields.includes('map_embed_url') && (
                            <TextAreaField
                                className="sm:col-span-2"
                                label="Google Maps embed URL"
                                hint="Google Maps → Share → Embed a map → Copy HTML. Paste that HTML or its embed URL."
                                value={form.data.map_embed_url}
                                onChange={(value) => form.setData('map_embed_url', value)}
                                error={form.errors.map_embed_url}
                            />
                        )}

                        {config.section === 'contact' && (
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">GCash QR code</label>
                                {data.gcash_qr_code && (
                                    <img
                                        src={data.gcash_qr_code}
                                        alt="Current GCash QR code"
                                        className="h-40 w-full rounded-lg border bg-white object-contain p-2"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => form.setData('gcash_qr_code', e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP up to 5 MB.</p>
                                {form.errors.gcash_qr_code && (
                                    <p className="text-sm text-red-500">{form.errors.gcash_qr_code}</p>
                                )}
                            </div>
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



function Field({
    label,
    hint,
    value,
    onChange,
    error,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function TextAreaField({
    label,
    hint,
    value,
    onChange,
    error,
    className = '',
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-sm font-medium">{label}</label>
            <textarea
                rows={2}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-16 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function DetailItem({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`max-w-full min-w-0 self-start overflow-hidden rounded-lg border bg-background px-3 py-2 ${className}`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-1 max-w-full min-w-0 whitespace-pre-wrap text-sm font-medium [overflow-wrap:anywhere]">
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

function sectionImageUrl(data: Section) {
    return data.image_url || data.image;
}

function fieldValue(data: Section, field: FieldKey) {
    return data[field] || '-';
}

function fieldLabel(field: FieldKey) {
    if (field === 'gcash_name') {
        return 'GCash account name';
    }

    if (field === 'gcash_number') {
        return 'GCash number';
    }

    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
        .replace('Url', 'URL');
}

function truncateText(value: string, maxLength: number) {
    return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
