<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\PasswordPolicy;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use RuntimeException;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    public const PRIMARY_ADMIN_PROTECTED_MESSAGE = "This is the system's primary administrator account and cannot be deleted.";

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if (! $user->isPrimaryAdministrator()) {
                return;
            }

            $user->name = static::primaryAdministratorName();
            $user->email = static::primaryAdministratorEmail();
            $user->role = 'admin';
            $user->email_verified_at ??= now();
        });

        static::deleting(function (User $user) {
            if ($user->isPrimaryAdministrator()) {
                throw new RuntimeException(static::PRIMARY_ADMIN_PROTECTED_MESSAGE);
            }
        });
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPrimaryAdministrator(): bool
    {
        $protectedEmail = static::primaryAdministratorEmail();

        return Str::lower((string) $this->email) === $protectedEmail
            || Str::lower((string) $this->getOriginal('email')) === $protectedEmail;
    }

    public static function primaryAdministratorName(): string
    {
        return (string) config('system.primary_admin.name', 'Renante Barcoma');
    }

    public static function primaryAdministratorEmail(): string
    {
        return Str::lower((string) config('system.primary_admin.email', 'renantebarcoma1@gmail.com'));
    }

    public static function primaryAdministratorPassword(): string
    {
        $password = config('system.primary_admin.password');

        if (! is_string($password) || trim($password) === '') {
            throw new RuntimeException('PRIMARY_ADMIN_PASSWORD is required and must be set to a strong password.');
        }

        Validator::make(
            [
                'password' => $password,
                'password_confirmation' => $password,
            ],
            [
                'password' => PasswordPolicy::rules(),
            ]
        )->validate();

        return $password;
    }

    public static function ensurePrimaryAdministratorExists(): self
    {
        $user = static::firstOrNew([
            'email' => static::primaryAdministratorEmail(),
        ]);

        if (! $user->exists) {
            $user->password = static::primaryAdministratorPassword();
        }

        $user->name = static::primaryAdministratorName();
        $user->role = 'admin';
        $user->email_verified_at ??= now();
        $user->save();

        return $user;
    }

    /**
     * Get all bookings of the user.
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
