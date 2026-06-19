<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaStorage
{
    public static function diskName(): string
    {
        return (string) config('filesystems.uploads_disk', 'public');
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, [
            'disk' => self::diskName(),
            'visibility' => 'public',
        ]);
    }

    public static function delete(?string $path): void
    {
        if (! $path || self::isAbsoluteUrl($path)) {
            return;
        }

        $disk = Storage::disk(self::diskName());

        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (self::isAbsoluteUrl($path)) {
            return $path;
        }

        if (str_starts_with($path, '/')) {
            return url($path);
        }

        return Storage::disk(self::diskName())->url($path);
    }

    private static function isAbsoluteUrl(string $path): bool
    {
        return preg_match('/^https?:\/\//i', $path) === 1;
    }
}
