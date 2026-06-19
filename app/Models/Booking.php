<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ResortOption;

class Booking extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'Pending';

    public const STATUS_CONFIRMED = 'Confirmed';

    public const STATUS_CANCELLED = 'Cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_CANCELLED,
    ];

    private const ALLOWED_STATUS_TRANSITIONS = [
        self::STATUS_PENDING => [
            self::STATUS_CONFIRMED,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_CONFIRMED => [
            self::STATUS_CANCELLED,
        ],
        self::STATUS_CANCELLED => [],
    ];

    protected $fillable = [
        'booking_reference',
        'user_id',
        'full_name',
        'facebook',
        'email',
        'contact_number',
        'resort_option_id',
        'pax',
        'booking_date',
        'booking_time',
        'message',
        'total_price',
        'payment_method',
        'booking_status',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'total_price' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function resortOption()
    {
        return $this->belongsTo(ResortOption::class, 'resort_option_id');
    }

    public function canTransitionTo(string $status): bool
    {
        if ($this->booking_status === $status) {
            return true;
        }

        return in_array(
            $status,
            self::ALLOWED_STATUS_TRANSITIONS[$this->booking_status] ?? [],
            true
        );
    }
}
