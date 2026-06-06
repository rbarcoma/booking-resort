import { Form, Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    lockoutSeconds?: number;
};

export default function Login({
    status,
    canResetPassword,
    lockoutSeconds = 0,
}: Props) {
    const [remainingSeconds, setRemainingSeconds] = useState(lockoutSeconds);
    const isLocked = remainingSeconds > 0;
    const countdown = useMemo(() => {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [remainingSeconds]);

    useEffect(() => {
        setRemainingSeconds(lockoutSeconds);
    }, [lockoutSeconds]);

    useEffect(() => {
        if (remainingSeconds <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [remainingSeconds]);

    return (
        <>
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {isLocked && (
                                <div className="rounded-lg border border-red-700/60 bg-red-950/40 px-4 py-3 text-sm text-red-100">
                                    <p className="font-medium">Too many failed login attempts.</p>
                                    <p className="mt-1">
                                        Please try again in {countdown}. The login form will unlock automatically.
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    disabled={isLocked}
                                />
                                <InputError message={isLocked ? undefined : errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    disabled={isLocked}
                                />
                                <InputError message={isLocked ? undefined : errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    disabled={isLocked}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing || isLocked}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {isLocked ? `Try again in ${countdown}` : 'Log in'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
