import { Head, useForm } from '@inertiajs/react';
import { ImageIcon, Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function LandingPageIndex({ home, about, contact }: Props) {
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

                    <div className="space-y-6">
                        <SectionForm
                            title="Home section"
                            section="home"
                            data={home}
                            fields={['title', 'subtitle', 'description', 'image']}
                        />

                        <SectionForm
                            title="About section"
                            section="about"
                            data={about}
                            fields={['title', 'description', 'image']}
                        />

                        <SectionForm
                            title="Contact section"
                            section="contact"
                            data={contact}
                            fields={[
                                'title',
                                'contact_number',
                                'email',
                                'facebook_link',
                                'address',
                                'map_embed_url',
                            ]}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function SectionForm({
    title,
    section,
    data,
    fields,
}: {
    title: string;
    section: string;
    data: Section;
    fields: FieldKey[];
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/landing-page/${section}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <Card className="gap-0">
            <CardHeader className="py-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>Update this section without changing the code.</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    {fields.includes('image') && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Current image</label>

                            <div className="overflow-hidden rounded-lg border bg-muted/20">
                                {data.image ? (
                                    <img
                                        src={`/storage/${data.image}`}
                                        alt={title}
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

                    <div className="grid gap-4 md:grid-cols-2">
                        {fields.includes('title') && (
                            <Field
                                label="Title"
                                value={form.data.title}
                                onChange={(value) => form.setData('title', value)}
                                error={form.errors.title}
                            />
                        )}

                        {fields.includes('subtitle') && (
                            <Field
                                label="Subtitle"
                                value={form.data.subtitle}
                                onChange={(value) => form.setData('subtitle', value)}
                                error={form.errors.subtitle}
                            />
                        )}

                        {fields.includes('contact_number') && (
                            <Field
                                label="Contact number"
                                value={form.data.contact_number}
                                onChange={(value) => form.setData('contact_number', value)}
                                error={form.errors.contact_number}
                            />
                        )}

                        {fields.includes('email') && (
                            <Field
                                label="Email"
                                value={form.data.email}
                                onChange={(value) => form.setData('email', value)}
                                error={form.errors.email}
                            />
                        )}

                        {fields.includes('facebook_link') && (
                            <Field
                                label="Facebook link"
                                value={form.data.facebook_link}
                                onChange={(value) => form.setData('facebook_link', value)}
                                error={form.errors.facebook_link}
                            />
                        )}

                        {fields.includes('description') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Description"
                                value={form.data.description}
                                onChange={(value) => form.setData('description', value)}
                                error={form.errors.description}
                            />
                        )}

                        {fields.includes('address') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Address"
                                value={form.data.address}
                                onChange={(value) => form.setData('address', value)}
                                error={form.errors.address}
                            />
                        )}

                        {fields.includes('map_embed_url') && (
                            <TextAreaField
                                className="md:col-span-2"
                                label="Google Maps embed URL"
                                value={form.data.map_embed_url}
                                onChange={(value) => form.setData('map_embed_url', value)}
                                error={form.errors.map_embed_url}
                            />
                        )}
                    </div>

                    <Button type="submit" size="sm" disabled={form.processing}>
                        <Save className="size-4" />
                        {form.processing ? 'Saving...' : 'Save changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
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
