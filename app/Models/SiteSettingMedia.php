<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSettingMedia extends Model
{
    use HasFactory;

    protected $table = 'site_setting_media';

    protected $fillable = [
        'site_setting_id',
        'media_path',
        'media_type',
        'label',
        'sort_order',
    ];

    public function siteSetting(): BelongsTo
    {
        return $this->belongsTo(SiteSetting::class);
    }
}
