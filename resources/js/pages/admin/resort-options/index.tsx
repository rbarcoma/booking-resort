import { Head, router, useForm } from '@inertiajs/react';
import { ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
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

type GalleryImage = {
    id: number;
    label?: string | null;
    image_path: string;
    sort_order?: number;
};

type Option = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    max_pax: number;
    description: string | null;
    status: string;
    images?: GalleryImage[];
};

type Props = {
    options: Option[];
};

export default function ResortOptionsIndex({ options }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const createForm = useForm({
        name: '',
        price: '',
        max_pax: '',
        description: '',
        status: 'active',
        image: null as File | null,
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/resort-options', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Manage Resort Options" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <Badge variant="outline" className="mb-2 w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                                Admin panel
                            </Badge>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Resort options</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage each pool category, cover image, and gallery images for the landing page carousel.
                                </p>
                            </div>
                        </div>
                        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="size-4" />
                            Add category
                        </Button>
                    </div>

                    <Dialog
                        open={createOpen}
                        onOpenChange={(open) => {
                            setCreateOpen(open);

                            if (!open) {
                                createForm.clearErrors();
                            }
                        }}
                    >
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Add new category</DialogTitle>
                                <DialogDescription>Create a new resort offering.</DialogDescription>
                            </DialogHeader>

                            <form onSubmit={submitCreate} className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category name</label>
                                    <Input
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Upper Pool, Lower Pool..."
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-sm text-red-500">{createForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Price</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={createForm.data.price}
                                        onChange={(e) => createForm.setData('price', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {createForm.errors.price && (
                                        <p className="text-sm text-red-500">{createForm.errors.price}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max pax</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={createForm.data.max_pax}
                                        onChange={(e) => createForm.setData('max_pax', e.target.value)}
                                        placeholder="Enter max pax"
                                    />
                                    {createForm.errors.max_pax && (
                                        <p className="text-sm text-red-500">{createForm.errors.max_pax}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <select
                                        value={createForm.data.status}
                                        onChange={(e) => createForm.setData('status', e.target.value)}
                                        className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {createForm.errors.status && (
                                        <p className="text-sm text-red-500">{createForm.errors.status}</p>
                                    )}
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        rows={4}
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        placeholder="Short description for this category..."
                                        className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    />
                                    {createForm.errors.description && (
                                        <p className="text-sm text-red-500">{createForm.errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-sm font-medium">Cover image</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => createForm.setData('image', e.target.files?.[0] || null)}
                                    />
                                    {createForm.errors.image && (
                                        <p className="text-sm text-red-500">{createForm.errors.image}</p>
                                    )}
                                </div>

                                <DialogFooter className="lg:col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCreateOpen(false)}
                                        disabled={createForm.processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={createForm.processing}>
                                        <Plus className="size-4" />
                                        {createForm.processing ? 'Saving...' : 'Add category'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <div className="grid gap-4 xl:grid-cols-2">
                        {options.map((option) => (
                            <EditOptionCard key={option.id} option={option} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function EditOptionCard({ option }: { option: Option }) {
    const form = useForm({
        name: option.name,
        price: option.price.toString(),
        max_pax: option.max_pax.toString(),
        description: option.description || '',
        status: option.status,
        image: null as File | null,
    });

    const galleryForm = useForm({
        images: [] as File[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'put',
        }));

        form.post(`/admin/resort-options/${option.id}`, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const uploadGalleryImages = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const selectedFiles = Array.from(files);
        galleryForm.setData('images', selectedFiles);

        router.post(
            `/admin/resort-options/${option.id}/images`,
            {
                images: selectedFiles,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => galleryForm.reset(),
            },
        );
    };

    const deleteGalleryImage = (imageId: number) => {
        router.delete(`/admin/resort-option-images/${imageId}`, {
            preserveScroll: true,
        });
    };

    return (
        <Card className="gap-0">
            <CardHeader className="flex-row items-start justify-between py-4">
                <div>
                    <CardTitle className="text-base">{option.name}</CardTitle>
                    <CardDescription>Slug: {option.slug}</CardDescription>
                </div>

                <Badge
                    className={
                        option.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                    }
                >
                    {option.status}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
                <form onSubmit={submit} className="space-y-4">
                    <div className="overflow-hidden rounded-lg border bg-muted/20">
                        {option.image ? (
                            <img
                                src={option.image}
                                alt={option.name}
                                className="h-44 w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                                <ImageIcon className="mr-2 size-4" />
                                No cover image uploaded
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category name</label>
                            <Input
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            {form.errors.name && <p className="text-sm text-red-500">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.price}
                                onChange={(e) => form.setData('price', e.target.value)}
                            />
                            {form.errors.price && (
                                <p className="text-sm text-red-500">{form.errors.price}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max pax</label>
                            <Input
                                type="number"
                                min="1"
                                value={form.data.max_pax}
                                onChange={(e) => form.setData('max_pax', e.target.value)}
                            />
                            {form.errors.max_pax && (
                                <p className="text-sm text-red-500">{form.errors.max_pax}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <select
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value)}
                                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {form.errors.status && (
                                <p className="text-sm text-red-500">{form.errors.status}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                rows={4}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            />
                            {form.errors.description && (
                                <p className="text-sm text-red-500">{form.errors.description}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Replace cover image</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => form.setData('image', e.target.files?.[0] || null)}
                            />
                            {form.errors.image && (
                                <p className="text-sm text-red-500">{form.errors.image}</p>
                            )}
                        </div>
                    </div>

                    <Button type="submit" size="sm" disabled={form.processing}>
                        <Pencil className="size-4" />
                        {form.processing ? 'Updating...' : 'Update category'}
                    </Button>
                </form>

                <div className="border-t pt-5">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold">Gallery images</h3>
                        <p className="text-sm text-muted-foreground">
                            Add multiple images for the left and right slider on the landing page.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Upload gallery images</label>
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => uploadGalleryImages(e.target.files)}
                            />
                            {galleryForm.errors.images && (
                                <p className="mt-2 text-sm text-red-500">{galleryForm.errors.images}</p>
                            )}
                        </div>

                        {option.images && option.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {option.images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="overflow-hidden rounded-lg border bg-background"
                                    >
                                        <img
                                            src={image.image_path}
                                            alt={image.label || option.name}
                                            className="h-28 w-full object-cover"
                                        />

                                        <div className="flex items-center justify-between gap-2 p-2">
                                            <span className="truncate text-xs text-muted-foreground">
                                                {image.label || 'Gallery image'}
                                            </span>

                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="destructive"
                                                onClick={() => deleteGalleryImage(image.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                No gallery images yet.
                            </div>
                        )}

                        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                            Suggested images: billiards, videoke, kitchen, rooms, comfort room, cottages, and other pool inclusions.
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
