import { Head, router, useForm } from '@inertiajs/react';
import { ListChecks, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_protected: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: AdminUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Props = {
    users: PaginatedUsers;
    summary: {
        totalAdmins: number;
    };
    currentUserId: number;
    errors?: {
        user?: string;
    };
    filters: {
        search: string;
        per_page: number;
    };
};

export default function AdminUsersIndex({
    users,
    summary,
    currentUserId,
    errors,
    filters,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
    });
    const { data: tableData, setData: setTableData, get } = useForm({
        search: filters.search || '',
        per_page: String(filters.per_page || 10),
    });
    const firstFilterRender = useRef(true);

    useEffect(() => {
        if (firstFilterRender.current) {
            firstFilterRender.current = false;
            return;
        }

        const timeout = window.setTimeout(() => {
            get('/admin/users', {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                showProgress: false,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [tableData.search, tableData.per_page, get]);

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();

        createForm.post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Manage Users" />

            <div className="min-h-screen bg-muted/30">
                <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <Badge
                                variant="outline"
                                className="mb-2 w-fit rounded-md px-2 py-1 text-[11px] uppercase"
                            >
                                Admin panel
                            </Badge>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    User management
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage admin login accounts for the booking
                                    system.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="size-4" />
                            Add admin
                        </Button>
                    </div>

                    {errors?.user && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                            {errors.user}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MiniStat
                            label="Admin accounts"
                            value={summary.totalAdmins}
                            tone="admins"
                        />
                        <MiniStat label="Showing" value={users.data.length} tone="showing" />
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add admin user</DialogTitle>
                                <DialogDescription>
                                    Create a new staff login for the admin side.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={submitCreate} className="space-y-4">
                                <UserFields
                                    data={createForm.data}
                                    errors={createForm.errors}
                                    setData={createForm.setData}
                                    passwordLabel="Password"
                                    passwordPlaceholder="At least 8 characters"
                                />

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCreateOpen(false)}
                                        disabled={createForm.processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={createForm.processing}
                                    >
                                        <Plus className="size-4" />
                                        {createForm.processing
                                            ? 'Saving...'
                                            : 'Add admin'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {editingUser && (
                        <EditUserDialog
                            user={editingUser}
                            open={Boolean(editingUser)}
                            onOpenChange={(open) => {
                                if (!open) setEditingUser(null);
                            }}
                        />
                    )}

                    {deletingUser && (
                        <DeleteUserDialog
                            user={deletingUser}
                            open={Boolean(deletingUser)}
                            onOpenChange={(open) => {
                                if (!open) setDeletingUser(null);
                            }}
                        />
                    )}

                    <Card className="gap-0 py-0">
                        <CardHeader className="py-4">
                            <div className="flex items-center gap-2">
                                <div>
                                    <CardTitle className="text-base">
                                        Admin accounts
                                    </CardTitle>
                                    <CardDescription>
                                        Customers book without accounts, so only
                                        staff/admin users appear here.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Show</span>
                                    <select
                                        value={tableData.per_page}
                                        onChange={(e) => setTableData('per_page', e.target.value)}
                                        className="flex h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                    >
                                        <option value="10">10</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span className="text-sm text-muted-foreground">entries</span>
                                </div>

                                <div className="relative w-full sm:max-w-md">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={tableData.search}
                                        onChange={(e) => setTableData('search', e.target.value)}
                                        placeholder="Search name or email"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardContent className="px-6 pb-6">
                            {
                                <>
                                    <div className="overflow-hidden rounded-lg border bg-background mt-4">
                                        <div className="overflow-x-auto">
                                        <table className="w-full min-w-[920px] text-sm">
                                            <thead className="bg-muted/50">
                                                <tr className="border-b">
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Created
                                                    </th>
                                                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.data.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="border-b align-top last:border-b-0"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium">
                                                                {user.name}
                                                            </div>
                                                            {user.id ===
                                                                currentUserId && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    Current
                                                                    account
                                                                </div>
                                                            )}
                                                            {user.is_protected && (
                                                                <div className="text-xs font-medium text-indigo-700">
                                                                    Primary administrator
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                                                                Admin
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {user.created_at}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setEditingUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        setDeletingUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        user.id ===
                                                                            currentUserId ||
                                                                        user.is_protected
                                                                    }
                                                                    title={
                                                                        user.is_protected
                                                                            ? "This is the system's primary administrator account and cannot be deleted."
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {users.data.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                            No recent users found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>

                                    {users.data.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {users.from ?? 0} to{' '}
                                            {users.to ?? 0} of {users.total}{' '}
                                            admin users
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {users.links.map((link, index) => (
                                                <Button
                                                    key={`${link.label}-${index}`}
                                                    type="button"
                                                    size="sm"
                                                    variant={
                                                        link.active
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    disabled={!link.url}
                                                    onClick={() => {
                                                        if (link.url) {
                                                            router.get(
                                                                link.url,
                                                                {},
                                                                {
                                                                    preserveState: true,
                                                                    preserveScroll: true,
                                                                    replace: true,
                                                                    showProgress: false,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    )}
                                </>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function DeleteUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: AdminUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.delete(`/admin/users/${user.id}`, {
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
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (!nextOpen) {
                    form.clearErrors();
                    form.reset();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm delete</DialogTitle>
                    <DialogDescription>
                        Enter your admin password to delete {user.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                        This removes the admin login account. Customer bookings
                        are not deleted.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Your password
                        </label>
                        <Input
                            type="password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                            autoFocus
                            placeholder="Enter your password"
                        />
                        {form.errors.password && (
                            <p className="text-sm text-red-500">
                                {form.errors.password}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
                            disabled={form.processing}
                        >
                            <Trash2 className="size-4" />
                            {form.processing ? 'Deleting...' : 'Delete user'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: AdminUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'put',
        }));

        form.post(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (!nextOpen) {
                    form.clearErrors();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit admin user</DialogTitle>
                    <DialogDescription>
                        {user.is_protected
                            ? 'This primary administrator account is system protected.'
                            : "Update this admin account's basic information."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <BasicUserFields
                        data={form.data}
                        errors={form.errors}
                        setData={form.setData}
                        disabled={user.is_protected}
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={form.processing}
                        >
                            <Pencil className="size-4" />
                            {form.processing ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function BasicUserFields({
    data,
    errors,
    setData,
    disabled = false,
}: {
    data: {
        name: string;
        email: string;
    };
    errors: Partial<Record<'name' | 'email', string>>;
    setData: (key: 'name' | 'email', value: string) => void;
    disabled?: boolean;
}) {
    return (
        <>
            <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Admin name"
                    disabled={disabled}
                />
                {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Email address</label>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="admin@example.com"
                    disabled={disabled}
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                )}
            </div>

            {disabled && (
                <p className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200">
                    This is the system's primary administrator account and its
                    identity cannot be changed here.
                </p>
            )}
        </>
    );
}

function UserFields({
    data,
    errors,
    setData,
    passwordLabel,
    passwordPlaceholder,
}: {
    data: {
        name: string;
        email: string;
        password: string;
    };
    errors: Partial<Record<'name' | 'email' | 'password', string>>;
    setData: (key: 'name' | 'email' | 'password', value: string) => void;
    passwordLabel: string;
    passwordPlaceholder: string;
}) {
    return (
        <>
            <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Admin name"
                />
                {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="admin@example.com"
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{passwordLabel}</label>
                <Input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder={passwordPlaceholder}
                />
                {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                )}
            </div>
        </>
    );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: 'admins' | 'showing' }) {
    const styles = {
        admins: {
            card: 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/30 dark:bg-indigo-500/15',
            accent: 'bg-indigo-500',
            icon: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-950/40',
            label: 'text-indigo-800 dark:text-indigo-200',
            value: 'text-indigo-950 dark:text-indigo-50',
            helper: 'Staff login accounts',
            iconNode: <ShieldCheck className="size-5" />,
        },
        showing: {
            card: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/15',
            accent: 'bg-sky-500',
            icon: 'bg-sky-600 text-white shadow-sky-200 dark:shadow-sky-950/40',
            label: 'text-sky-800 dark:text-sky-200',
            value: 'text-sky-950 dark:text-sky-50',
            helper: 'Rows on this page',
            iconNode: <ListChecks className="size-5" />,
        },
    }[tone];

    return (
        <Card className={`gap-0 overflow-hidden ${styles.card}`}>
            <div className={`h-1 ${styles.accent}`} />
            <CardContent className="flex items-center justify-between gap-4 py-5">
                <div>
                    <p className={`text-xs font-medium tracking-wide uppercase ${styles.label}`}>
                    {label}
                </p>
                    <p className={`mt-2 text-3xl font-semibold ${styles.value}`}>{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{styles.helper}</p>
                </div>
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
                    {styles.iconNode}
                </div>
            </CardContent>
        </Card>
    );
}
