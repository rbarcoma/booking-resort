<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'section',
        'title',
        'subtitle',
        'description',
        'image',
        'contact_number',
        'email',
        'facebook_link',
        'address',
        'map_embed_url',
    ];

    public function media(): HasMany
    {
        return $this->hasMany(SiteSettingMedia::class)->orderBy('sort_order')->orderBy('id');
    }
}
