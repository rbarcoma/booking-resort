import { usePage } from '@inertiajs/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export function FlashToast() {
    const { flash } = usePage<FlashProps>().props;
    const message = flash?.success || flash?.error || null;
    const type = flash?.error ? 'error' : 'success';
    const [visible, setVisible] = useState(Boolean(message));

    const toastId = useMemo(() => `${type}-${message ?? ''}`, [message, type]);

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return;
        }

        setVisible(true);
        const timeout = window.setTimeout(() => setVisible(false), 4200);

        return () => window.clearTimeout(timeout);
    }, [toastId, message]);

    if (!message || !visible) {
        return null;
    }

    const isError = type === 'error';
    const Icon = isError ? XCircle : CheckCircle2;

    return (
        <div className="fixed top-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
            <div
                className={
                    isError
                        ? 'overflow-hidden rounded-xl border border-red-200 bg-red-50 text-red-800 shadow-lg'
                        : 'overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-lg'
                }
                role="status"
                aria-live="polite"
            >
                <div className={isError ? 'h-1 bg-red-500' : 'h-1 bg-emerald-500'} />
                <div className="flex items-start gap-3 p-4">
                    <div
                        className={
                            isError
                                ? 'mt-0.5 rounded-lg bg-red-600 p-1.5 text-white'
                                : 'mt-0.5 rounded-lg bg-emerald-600 p-1.5 text-white'
                        }
                    >
                        <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{isError ? 'Action failed' : 'Success'}</p>
                        <p className="mt-1 text-sm leading-5">{message}</p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 hover:bg-black/5"
                        onClick={() => setVisible(false)}
                        aria-label="Close notification"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
