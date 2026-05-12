<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResortOptionImage extends Model
{
    protected $fillable = [
        'resort_option_id',
        'image_path',
        'label',
        'sort_order',
    ];

    public function resortOption()
    {
        return $this->belongsTo(ResortOption::class);
    }
}
