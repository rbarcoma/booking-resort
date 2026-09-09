<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public const PAYMENT_METHOD_GCASH = 'GCash';

    public const PAYMENT_TYPE_FULL = 'Full Payment';

    public const PAYMENT_TYPE_DOWN = 'Down Payment';

    public const PAYMENT_TYPES = [
        self::PAYMENT_TYPE_FULL,
        self::PAYMENT_TYPE_DOWN,
    ];

    public const PAYMENT_STATUS_FOR_VERIFICATION = 'For Verification';

    public const PAYMENT_STATUS_DOWN_PAYMENT_PAID = 'Down Payment Paid';

    public const PAYMENT_STATUS_FULLY_PAID = 'Fully Paid';

    public const PAYMENT_STATUS_REJECTED = 'Rejected';

    public const PAYMENT_STATUSES = [
        self::PAYMENT_STATUS_FOR_VERIFICATION,
        self::PAYMENT_STATUS_DOWN_PAYMENT_PAID,
        self::PAYMENT_STATUS_FULLY_PAID,
        self::PAYMENT_STATUS_REJECTED,
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
        'payment_type',
        'amount_paid',
        'remaining_balance',
        'proof_of_payment_path',
        'booking_status',
        'payment_status',
        'payment_reviewed_at',
        'payment_reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'total_price' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'payment_reviewed_at' => 'datetime',
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

    public function paymentReviewer()
    {
        return $this->belongsTo(User::class, 'payment_reviewed_by');
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
