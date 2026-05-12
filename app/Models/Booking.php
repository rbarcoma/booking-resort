<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ResortOption;
use App\Models\BookingCalendarEntry;

class Booking extends Model
{
    use HasFactory;

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

    public function calendarEntries()
    {
        return $this->hasMany(BookingCalendarEntry::class);
    }
}
