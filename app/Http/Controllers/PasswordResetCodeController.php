<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetCodeController extends Controller
{
    use PasswordValidationRules;

    private const VERIFIED_EMAIL_SESSION_KEY = 'password_reset_verified_email';

    public function verifyForm(Request $request): Response|RedirectResponse
    {
        $email = (string) $request->query('email', '');

        if ($email === '') {
            return redirect()->route('password.request');
        }

        $request->session()->forget(self::VERIFIED_EMAIL_SESSION_KEY);

        return Inertia::render('auth/verify-reset-code', [
            'email' => $email,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function resetForm(Request $request): Response|RedirectResponse
    {
        $email = (string) $request->session()->get(self::VERIFIED_EMAIL_SESSION_KEY, '');

        if ($email === '') {
            return redirect()->route('password.request');
        }

        return Inertia::render('auth/reset-password', [
            'email' => $email,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $email = (string) $validated['email'];
        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ],
        );

        Mail::raw(
            "Your Q8 Private Resort password reset verification code is {$code}.\n\nThis code expires in {$this->expiryMinutes()} minutes. If you did not request a password reset, you can ignore this email.",
            function ($mail) use ($email) {
                $mail->to($email)->subject('Password Reset Verification Code');
            },
        );

        return redirect()
            ->route('password.code.verify', ['email' => $email])
            ->with('status', 'A 6-digit verification code has been sent to your email.');
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'code' => ['required', 'digits:6'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || $this->codeExpired($record->created_at) || ! Hash::check($validated['code'], $record->token)) {
            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid or has expired.',
            ]);
        }

        $request->session()->put(self::VERIFIED_EMAIL_SESSION_KEY, $validated['email']);

        return redirect()
            ->route('password.code.reset')
            ->with('status', 'Code verified. You can now set a new password.');
    }

    public function reset(Request $request): RedirectResponse
    {
        $email = (string) $request->session()->get(self::VERIFIED_EMAIL_SESSION_KEY, '');

        if ($email === '') {
            throw ValidationException::withMessages([
                'email' => 'Please verify your email code before resetting your password.',
            ]);
        }

        $validated = $request->validate([
            'password' => $this->passwordRules(),
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (! $record || $this->codeExpired($record->created_at)) {
            $request->session()->forget(self::VERIFIED_EMAIL_SESSION_KEY);

            throw ValidationException::withMessages([
                'email' => 'Your verified reset session has expired. Please request a new code.',
            ]);
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->forceFill([
            'password' => $validated['password'],
        ])->save();

        DB::table('password_reset_tokens')
            ->where('email', $email)
            ->delete();

        $request->session()->forget(self::VERIFIED_EMAIL_SESSION_KEY);

        return redirect()
            ->route('login')
            ->with('status', 'Your password has been reset. You can now log in.');
    }

    private function codeExpired(?string $createdAt): bool
    {
        if (! $createdAt) {
            return true;
        }

        return Carbon::parse($createdAt)
            ->addMinutes($this->expiryMinutes())
            ->isPast();
    }

    private function expiryMinutes(): int
    {
        return (int) config('auth.passwords.users.expire', 60);
    }
}
