import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    email: string;
    status?: string;
};

export default function VerifyResetCode({ email, status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email,
        code: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/verify-reset-code');
    };

    return (
        <>
            <Head title="Verify reset code" />

            {status && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            readOnly
                            disabled
                        />
                        <input type="hidden" name="email" value={data.email} />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code">Verification code</Label>
                        <Input
                            id="code"
                            name="code"
                            inputMode="numeric"
                            maxLength={6}
                            value={data.code}
                            onChange={(event) =>
                                setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            className="mt-1 block w-full text-center tracking-[0.35em]"
                            autoFocus
                            placeholder="000000"
                        />
                        <InputError message={errors.code} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        disabled={processing}
                        data-test="verify-password-reset-code-button"
                    >
                        {processing && <Spinner />}
                        Verify code
                    </Button>
                </div>
            </form>
        </>
    );
}

VerifyResetCode.layout = {
    title: 'Verify code',
    description: 'Enter the 6-digit verification code sent to your email',
};
