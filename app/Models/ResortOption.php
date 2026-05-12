<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ResortOptionImage;
use Illuminate\Database\Eloquent\Model;


class ResortOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'image',
        'price',
        'max_pax',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function images()
    {
        return $this->hasMany(ResortOptionImage::class)->orderBy('sort_order');
    }
}
