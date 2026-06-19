<?php

namespace App\Support;

use Closure;
use Illuminate\Validation\Rules\Password;

class PasswordPolicy
{
    public const SPECIAL_CHARACTERS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    /**
     * @return array<int, mixed>
     */
    public static function rules(bool $confirmed = true): array
    {
        $rules = [
            'required',
            'string',
            Password::default(),
            self::characterRule(),
        ];

        if ($confirmed) {
            $rules[] = 'confirmed';
        }

        return $rules;
    }

    /**
     * @return array<int, string>
     */
    public static function requirements(): array
    {
        return [
            'At least 12 characters',
            'At least one uppercase letter',
            'At least one lowercase letter',
            'At least one number',
            'At least one special character: '.self::SPECIAL_CHARACTERS,
        ];
    }

    protected static function characterRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $password = (string) $value;

            if (strlen($password) < 12) {
                $fail('The :attribute must be at least 12 characters.');
            }

            if (! preg_match('/[A-Z]/', $password)) {
                $fail('The :attribute must contain at least one uppercase letter.');
            }

            if (! preg_match('/[a-z]/', $password)) {
                $fail('The :attribute must contain at least one lowercase letter.');
            }

            if (! preg_match('/[0-9]/', $password)) {
                $fail('The :attribute must contain at least one number.');
            }

            if (! preg_match('/['.preg_quote(self::SPECIAL_CHARACTERS, '/').']/', $password)) {
                $fail('The :attribute must contain at least one special character.');
            }
        };
    }
}
