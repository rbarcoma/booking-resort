<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingCalendarEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'calendar_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'calendar_date' => 'date',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
