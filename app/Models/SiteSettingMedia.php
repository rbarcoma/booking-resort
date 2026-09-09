<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSettingMedia extends Model
{
    use HasFactory;

    public const POOLS = ['upper' => 'Upper Pool', 'lower' => 'Lower Pool'];

    public const CATEGORIES = [
        'room' => 'Room',
        'pool' => 'Pool',
        'kitchen' => 'Kitchen',
        'cottage' => 'Cottage',
        'others' => 'Others',
    ];

    protected $table = 'site_setting_media';

    protected $fillable = [
        'site_setting_id',
        'media_path',
        'media_type',
        'label',
        'sort_order',
        'pool',
        'category',
    ];

    public static function galleryOptions(): array
    {
        return [
            'pools' => collect(self::POOLS)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
            'categories' => collect(self::CATEGORIES)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
        ];
    }

    public function siteSetting(): BelongsTo
    {
        return $this->belongsTo(SiteSetting::class);
    }
}
