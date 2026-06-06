import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

type TimeOption = {
    id: number;
    label: string;
    time_range: string;
    display_label: string;
    status: string;
    sort_order: number;
};

type Props = {
    options: Option[];
    timeOptions: TimeOption[];
};

const PAGE_SIZE_OPTIONS = [10, 50, 100];

export default function ResortOptionsIndex({ options, timeOptions }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [viewOption, setViewOption] = useState<Option | null>(null);
    const [editOption, setEditOption] = useState<Option | null>(null);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const [categoryPageSize, setCategoryPageSize] = useState(10);
    const createForm = useForm({
        name: '',
        price: '',
        max_pax: '',
        description: '',
        status: 'active',
        images: [] as File[],
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

    const filteredOptions = options.filter((option) => {
        const query = categorySearch.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return [
            option.name,
            option.slug,
            option.status,
            option.description || '',
            String(option.price),
            String(option.max_pax),
        ].some((value) => value.toLowerCase().includes(query));
    });
    const categoryTotalPages = Math.max(1, Math.ceil(filteredOptions.length / categoryPageSize));
    const categoryPageNumber = Math.min(categoryPage, categoryTotalPages);
    const paginatedOptions = filteredOptions.slice(
        (categoryPageNumber - 1) * categoryPageSize,
        categoryPageNumber * categoryPageSize,
    );

    return (
        <>
            <Head title="Manage Resort Options" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div>
                        <div>
                            <Badge variant="outline" className="mb-2 w-fit rounded-md px-2 py-1 text-[11px] uppercase">
                                Admin panel
                            </Badge>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Resort options</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage pool categories, booking schedules, and image libraries for the booking flow.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="gap-0">
                        <CardHeader className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-base">Categories</CardTitle>
                                <CardDescription>
                                    Review categories in the table, then open a modal to view details or make changes.
                                </CardDescription>
                            </div>

                            <Button type="button" size="sm" className="shrink-0" onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4" />
                                Add category
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Show</span>
                                    <select
                                        value={categoryPageSize}
                                        onChange={(e) => {
                                            setCategoryPageSize(Number(e.target.value));
                                            setCategoryPage(1);
                                        }}
                                        className="flex h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-sm text-muted-foreground">entries</span>
                                </div>

                                <div className="relative w-full sm:max-w-md">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={categorySearch}
                                        onChange={(e) => {
                                            setCategorySearch(e.target.value);
                                            setCategoryPage(1);
                                        }}
                                        placeholder="Search category, price, pax, status"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border bg-background">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-sm">
                                        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Category Name</th>
                                                <th className="px-4 py-3 font-medium">Price</th>
                                                <th className="px-4 py-3 font-medium">Max Pax</th>
                                                <th className="px-4 py-3 font-medium">Status</th>
                                                <th className="px-4 py-3 font-medium">Description</th>
                                                <th className="px-4 py-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {paginatedOptions.length > 0 ? (
                                                paginatedOptions.map((option) => (
                                                    <tr key={option.id} className="align-top">
                                                        <td className="px-4 py-3 font-medium">{option.name}</td>
                                                        <td className="px-4 py-3">{formatCurrency(option.price)}</td>
                                                        <td className="px-4 py-3">{option.max_pax}</td>
                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={option.status} />
                                                        </td>
                                                        <td className="max-w-sm px-4 py-3 text-muted-foreground">
                                                            {truncateText(option.description || 'No description available.', 120)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setViewOption(option)}
                                                                >
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => setEditOption(option)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                        {options.length > 0 ? 'No resort categories match your search.' : 'No resort categories found.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <PaginationControls
                                itemName="categories"
                                page={categoryPageNumber}
                                totalPages={categoryTotalPages}
                                totalItems={filteredOptions.length}
                                pageSize={categoryPageSize}
                                onPageChange={setCategoryPage}
                            />
                        </CardContent>
                    </Card>

                    <BookingTimeOptionsPanel timeOptions={timeOptions} />
                </div>
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
                        <CategoryFields
                            data={createForm.data}
                            errors={createForm.errors}
                            setData={createForm.setData}
                            imageHelpText="The first selected image becomes the cover; the rest are added to the gallery."
                        />

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

            <ViewOptionModal
                option={viewOption}
                timeOptions={timeOptions}
                onOpenChange={(open) => !open && setViewOption(null)}
            />

            <EditOptionModal
                option={editOption}
                onOpenChange={(open) => !open && setEditOption(null)}
            />
        </>
    );
}

function CategoryFields({
    data,
    errors,
    setData,
    imageHelpText,
}: {
    data: {
        name: string;
        price: string;
        max_pax: string;
        description: string;
        status: string;
        images: File[];
    };
    errors: Partial<Record<keyof typeof data, string>>;
    setData: (key: keyof typeof data, value: string | File[]) => void;
    imageHelpText: string;
}) {
    return (
        <>
            <div className="space-y-2">
                <label className="text-sm font-medium">Category name</label>
                <Input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Upper Pool, Lower Pool..."
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    placeholder="0.00"
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Max pax</label>
                <Input
                    type="number"
                    min="1"
                    value={data.max_pax}
                    onChange={(e) => setData('max_pax', e.target.value)}
                    placeholder="Enter max pax"
                />
                {errors.max_pax && <p className="text-sm text-red-500">{errors.max_pax}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>

            <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                    rows={4}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Short description for this category..."
                    className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Images</label>
                <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setData('images', Array.from(e.target.files || []))}
                />
                <p className="text-xs text-muted-foreground">{imageHelpText}</p>
                {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
            </div>
        </>
    );
}

function ViewOptionModal({
    option,
    timeOptions,
    onOpenChange,
}: {
    option: Option | null;
    timeOptions: TimeOption[];
    onOpenChange: (open: boolean) => void;
}) {
    if (!option) {
        return null;
    }

    return (
        <Dialog open={Boolean(option)} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{option.name}</DialogTitle>
                    <DialogDescription>Complete resort category details.</DialogDescription>
                </DialogHeader>

                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <div className="min-w-0 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailItem label="Category Name" value={option.name} />
                            <DetailItem label="Price" value={formatCurrency(option.price)} />
                            <DetailItem label="Maximum Pax" value={String(option.max_pax)} />
                            <DetailItem label="Status" value={<StatusBadge status={option.status} />} />
                            <DetailItem label="Slug" value={option.slug} />
                            <DetailItem label="Gallery Images" value={String(option.images?.length || 0)} />
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                            <p className="mt-2 whitespace-pre-line text-sm">
                                {option.description || 'No description available.'}
                            </p>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Booking Schedules
                            </p>
                            {timeOptions.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {timeOptions.map((timeOption) => (
                                        <Badge
                                            key={timeOption.id}
                                            variant="outline"
                                            className={
                                                timeOption.status === 'active'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                    : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                                            }
                                        >
                                            {timeOption.display_label}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-muted-foreground">No booking schedules configured.</p>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <ImagePreview title="Cover Image" image={option.image} alt={option.name} />

                        <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">Gallery Images</p>
                                <span className="text-xs text-muted-foreground">{option.images?.length || 0} uploaded</span>
                            </div>

                            {option.images && option.images.length > 0 ? (
                                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                                    <div className="flex h-[190px] w-max gap-3">
                                        {option.images.map((image) => (
                                            <div key={image.id} className="w-52 shrink-0 overflow-hidden rounded-lg border">
                                                <img
                                                    src={image.image_path}
                                                    alt={image.label || option.name}
                                                    className="h-32 w-full object-cover"
                                                />
                                                <div className="p-2 text-xs text-muted-foreground">
                                                    {image.label || `Gallery image ${image.sort_order || ''}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    No gallery images yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditOptionModal({
    option,
    onOpenChange,
}: {
    option: Option | null;
    onOpenChange: (open: boolean) => void;
}) {
    if (!option) {
        return null;
    }

    return (
        <Dialog open={Boolean(option)} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Edit {option.name}</DialogTitle>
                    <DialogDescription>Update category details and manage its image library.</DialogDescription>
                </DialogHeader>

                <EditOptionForm option={option} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

function EditOptionForm({ option, onDone }: { option: Option; onDone: () => void }) {
    const form = useForm({
        name: option.name,
        price: option.price.toString(),
        max_pax: option.max_pax.toString(),
        description: option.description || '',
        status: option.status,
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
            onSuccess: onDone,
        });
    };

    const deleteGalleryImage = (imageId: number) => {
        router.delete(`/admin/resort-option-images/${imageId}`, {
            preserveScroll: true,
        });
    };

    const makeCoverImage = (imageId: number) => {
        router.post(
            `/admin/resort-option-images/${imageId}/cover`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <form onSubmit={submit} className="min-w-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <CategoryFields
                        data={form.data}
                        errors={form.errors}
                        setData={form.setData}
                        imageHelpText="New images are added to the library. Use the Cover button to change the cover image."
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onDone} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        <Pencil className="size-4" />
                        {form.processing ? 'Updating...' : 'Update category'}
                    </Button>
                </DialogFooter>
            </form>

            <div className="min-w-0 space-y-4">
                <ImagePreview title="Current Cover" image={option.image} alt={option.name} />

                <div className="min-w-0 overflow-hidden rounded-lg border bg-background p-3">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold">Image library</h3>
                        <p className="text-sm text-muted-foreground">
                            Review gallery images and choose which one should be the cover.
                        </p>
                    </div>

                    {option.images && option.images.length > 0 ? (
                        <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                            <div className="flex h-[190px] w-max gap-3">
                            {option.images.map((image) => (
                                <div key={image.id} className="w-52 shrink-0 overflow-hidden rounded-lg border bg-background">
                                    <img
                                        src={image.image_path}
                                        alt={image.label || option.name}
                                        className="h-28 w-full object-cover"
                                    />

                                    <div className="flex items-center justify-between gap-2 p-2">
                                        <span className="truncate text-xs text-muted-foreground">
                                            {image.label || 'Gallery image'}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => makeCoverImage(image.id)}
                                            >
                                                Cover
                                            </Button>

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
                                </div>
                            ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            No gallery images yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BookingTimeOptionsPanel({ timeOptions }: { timeOptions: TimeOption[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTimeOption, setEditTimeOption] = useState<TimeOption | null>(null);
    const [timeSearch, setTimeSearch] = useState('');
    const [timePage, setTimePage] = useState(1);
    const [timePageSize, setTimePageSize] = useState(10);

    const filteredTimeOptions = timeOptions.filter((timeOption) => {
        const query = timeSearch.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return [
            timeOption.label,
            timeOption.time_range,
            timeOption.display_label,
            timeOption.status,
            String(timeOption.sort_order),
        ].some((value) => value.toLowerCase().includes(query));
    });
    const timeTotalPages = Math.max(1, Math.ceil(filteredTimeOptions.length / timePageSize));
    const timePageNumber = Math.min(timePage, timeTotalPages);
    const paginatedTimeOptions = filteredTimeOptions.slice(
        (timePageNumber - 1) * timePageSize,
        timePageNumber * timePageSize,
    );

    return (
        <>
            <Card className="gap-0">
                <CardHeader className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            Booking time settings
                        </CardTitle>
                        <CardDescription>
                            Add Morning, Evening, Whole Day, or custom schedule ranges for the customer booking form.
                        </CardDescription>
                    </div>

                    <Button type="button" size="sm" className="shrink-0" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Add time
                    </Button>
                </CardHeader>

                <CardContent>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show</span>
                            <select
                                value={timePageSize}
                                onChange={(e) => {
                                    setTimePageSize(Number(e.target.value));
                                    setTimePage(1);
                                }}
                                className="flex h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-muted-foreground">entries</span>
                        </div>

                        <div className="relative w-full sm:max-w-md">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={timeSearch}
                                onChange={(e) => {
                                    setTimeSearch(e.target.value);
                                    setTimePage(1);
                                }}
                                placeholder="Search schedule, time range, status"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border bg-background">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Schedule Name</th>
                                        <th className="px-4 py-3 font-medium">Time Range</th>
                                        <th className="px-4 py-3 font-medium">Sort Order</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginatedTimeOptions.length > 0 ? (
                                        paginatedTimeOptions.map((timeOption) => (
                                            <tr key={timeOption.id}>
                                                <td className="px-4 py-3 font-medium">{timeOption.label}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{timeOption.time_range}</td>
                                                <td className="px-4 py-3">{timeOption.sort_order}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={timeOption.status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => setEditTimeOption(timeOption)}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                {timeOptions.length > 0
                                                    ? 'No booking time schedules match your search.'
                                                    : 'No booking time schedules found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <PaginationControls
                        itemName="booking time schedules"
                        page={timePageNumber}
                        totalPages={timeTotalPages}
                        totalItems={filteredTimeOptions.length}
                        pageSize={timePageSize}
                        onPageChange={setTimePage}
                    />
                </CardContent>
            </Card>

            <CreateBookingTimeModal open={createOpen} onOpenChange={setCreateOpen} />
            <EditBookingTimeModal
                timeOption={editTimeOption}
                onOpenChange={(open) => !open && setEditTimeOption(null)}
            />
        </>
    );
}

function CreateBookingTimeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const form = useForm({
        label: '',
        time_range: '',
        status: 'active',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post('/admin/resort-options/time-options', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);

                if (!isOpen) {
                    form.clearErrors();
                }
            }}
        >
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add booking time</DialogTitle>
                    <DialogDescription>Create a schedule option for the customer booking form.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <BookingTimeFields
                        data={{
                            ...form.data,
                            sort_order: '',
                        }}
                        errors={form.errors}
                        setData={(key, value) => {
                            if (key !== 'sort_order') {
                                form.setData(key, value);
                            }
                        }}
                        showSortOrder={false}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.processing}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={form.processing}>
                            <Plus className="size-4" />
                            {form.processing ? 'Adding...' : 'Add time'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditBookingTimeModal({
    timeOption,
    onOpenChange,
}: {
    timeOption: TimeOption | null;
    onOpenChange: (open: boolean) => void;
}) {
    if (!timeOption) {
        return null;
    }

    return <EditBookingTimeForm key={timeOption.id} timeOption={timeOption} onOpenChange={onOpenChange} />;
}

function EditBookingTimeForm({
    timeOption,
    onOpenChange,
}: {
    timeOption: TimeOption;
    onOpenChange: (open: boolean) => void;
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const form = useForm({
        label: timeOption.label,
        time_range: timeOption.time_range,
        status: timeOption.status,
        sort_order: timeOption.sort_order.toString(),
    });
    const deleteForm = useForm({
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'put',
        }));

        form.post(`/admin/resort-options/time-options/${timeOption.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const destroy = (e: React.FormEvent) => {
        e.preventDefault();

        deleteForm.delete(`/admin/resort-options/time-options/${timeOption.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                deleteForm.reset();
                setDeleteOpen(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <>
        <Dialog open={Boolean(timeOption)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit booking time</DialogTitle>
                    <DialogDescription>{timeOption.display_label}</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <BookingTimeFields
                        data={form.data}
                        errors={form.errors}
                        setData={form.setData}
                        showSortOrder
                    />

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="size-4" />
                            Delete
                        </Button>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={form.processing}>
                                <Pencil className="size-4" />
                                {form.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog
            open={deleteOpen}
            onOpenChange={(nextOpen) => {
                setDeleteOpen(nextOpen);

                if (!nextOpen) {
                    deleteForm.clearErrors();
                    deleteForm.reset();
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm delete</DialogTitle>
                    <DialogDescription>
                        Enter your admin password to delete {timeOption.display_label}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={destroy} className="space-y-4">
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                        This removes the booking time schedule from the booking form.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your password</label>
                        <Input
                            type="password"
                            value={deleteForm.data.password}
                            onChange={(e) => deleteForm.setData('password', e.target.value)}
                            autoFocus
                            placeholder="Enter your password"
                        />
                        {deleteForm.errors.password && (
                            <p className="text-sm text-red-500">{deleteForm.errors.password}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            disabled={deleteForm.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={deleteForm.processing}>
                            <Trash2 className="size-4" />
                            {deleteForm.processing ? 'Deleting...' : 'Delete booking time'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    );
}

function BookingTimeFields({
    data,
    errors,
    setData,
    showSortOrder,
}: {
    data: {
        label: string;
        time_range: string;
        status: string;
        sort_order: string;
    };
    errors: Partial<Record<keyof typeof data, string>>;
    setData: (key: keyof typeof data, value: string) => void;
    showSortOrder: boolean;
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <label className="text-sm font-medium">Schedule name</label>
                <Input
                    value={data.label}
                    onChange={(e) => setData('label', e.target.value)}
                    placeholder="Morning, Evening, Whole Day..."
                />
                {errors.label && <p className="text-sm text-red-500">{errors.label}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Time range</label>
                <Input
                    value={data.time_range}
                    onChange={(e) => setData('time_range', e.target.value)}
                    placeholder="7am to 5pm"
                />
                {errors.time_range && <p className="text-sm text-red-500">{errors.time_range}</p>}
            </div>

            {showSortOrder && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Sort order</label>
                    <Input
                        type="number"
                        min="0"
                        value={data.sort_order}
                        onChange={(e) => setData('sort_order', e.target.value)}
                    />
                    {errors.sort_order && <p className="text-sm text-red-500">{errors.sort_order}</p>}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-2 text-sm font-medium">{value}</div>
        </div>
    );
}

function ImagePreview({ title, image, alt }: { title: string; image: string | null; alt: string }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="mb-3 text-sm font-semibold">{title}</p>
            {image ? (
                <img src={image} alt={alt} className="h-64 w-full rounded-md object-cover" />
            ) : (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    No cover image uploaded.
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge
            className={
                status === 'active'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200'
                    : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            }
        >
            {status}
        </Badge>
    );
}

function PaginationControls({
    itemName,
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
}: {
    itemName: string;
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}) {
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {start} to {end} of {totalItems} {itemName}
            </p>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                </span>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function formatCurrency(value: string | number) {
    return Number(value).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    });
}

function truncateText(value: string, maxLength: number) {
    return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
