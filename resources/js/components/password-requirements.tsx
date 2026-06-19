import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type PasswordCheck = {
    id: string;
    label: string;
    passed: boolean;
};

export function getPasswordChecks(password: string): PasswordCheck[] {
    return [
        {
            id: 'length',
            label: 'At least 12 characters',
            passed: password.length >= 12,
        },
        {
            id: 'uppercase',
            label: 'Contains uppercase letter',
            passed: /[A-Z]/.test(password),
        },
        {
            id: 'lowercase',
            label: 'Contains lowercase letter',
            passed: /[a-z]/.test(password),
        },
        {
            id: 'number',
            label: 'Contains number',
            passed: /[0-9]/.test(password),
        },
        {
            id: 'special',
            label: 'Contains special character',
            passed: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
        },
    ];
}

export function getPasswordStrength(password: string) {
    const passed = getPasswordChecks(password).filter((check) => check.passed).length;

    if (passed === 5) {
        return {
            label: 'Strong',
            className: 'bg-emerald-500',
            textClassName: 'text-emerald-700 dark:text-emerald-300',
            width: 'w-full',
        };
    }

    if (passed >= 3) {
        return {
            label: 'Medium',
            className: 'bg-amber-500',
            textClassName: 'text-amber-700 dark:text-amber-300',
            width: 'w-2/3',
        };
    }

    return {
        label: 'Weak',
        className: 'bg-red-500',
        textClassName: 'text-red-700 dark:text-red-300',
        width: 'w-1/3',
    };
}

export function PasswordRequirements({ password }: { password: string }) {
    const checks = getPasswordChecks(password);
    const strength = getPasswordStrength(password);

    return (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-medium text-muted-foreground">
                    Password strength
                </span>
                <span className={cn('font-semibold', strength.textClassName)}>
                    {strength.label}
                </span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', strength.width, strength.className)} />
            </div>
            <ul className="grid gap-1.5">
                {checks.map((check) => (
                    <li
                        key={check.id}
                        className={cn(
                            'flex items-center gap-2',
                            check.passed
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-muted-foreground',
                        )}
                    >
                        {check.passed ? (
                            <Check className="size-3.5" />
                        ) : (
                            <X className="size-3.5" />
                        )}
                        <span>{check.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
