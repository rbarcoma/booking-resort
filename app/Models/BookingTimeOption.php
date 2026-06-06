<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingTimeOption extends Model
{
    protected $fillable = [
        'label',
        'time_range',
        'status',
        'sort_order',
    ];

    public function getDisplayLabelAttribute(): string
    {
        return "{$this->label}: {$this->time_range}";
    }
}
