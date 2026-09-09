<?php

namespace App\Support;

use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use League\Flysystem\FilesystemException;
use Throwable;

class MediaStorage
{
    public static function diskName(): string
    {
        return (string) config('filesystems.uploads_disk', 'public');
    }

    public static function store(UploadedFile $file, string $directory, string $field = 'images'): string
    {
        try {
            $path = $file->store($directory, [
                'disk' => self::diskName(),
                'visibility' => 'public',
            ]);
        } catch (FilesystemException $exception) {
            report($exception);
            $path = false;
        }

        if (! $path) {
            throw ValidationException::withMessages([
                $field => 'The file could not be saved. Please try again or contact the administrator.',
            ]);
        }

        return $path;
    }

    /** Save database records together, cleaning up new files if any upload or save fails. */
    public static function persist(Closure $callback): mixed
    {
        $paths = [];
        $store = function (UploadedFile $file, string $directory, string $field = 'images') use (&$paths): string {
            $path = self::store($file, $directory, $field);
            $paths[] = $path;

            return $path;
        };

        try {
            return DB::transaction(fn () => $callback($store));
        } catch (Throwable $exception) {
            foreach ($paths as $path) {
                try {
                    self::delete($path);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }
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

    public static function deleteAfterCommit(?string $path): void
    {
        DB::afterCommit(function () use ($path) {
            try {
                self::delete($path);
            } catch (Throwable $exception) {
                // A cleanup failure must not remove the newly committed replacement.
                report($exception);
            }
        });
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (self::isAbsoluteUrl($path)) {
            return $path;
        }

        // Older records may contain a public URL path instead of a disk-relative path.
        $path = preg_replace('#^/?(?:storage|media)/#', '', $path);

        if (str_starts_with($path, '/')) {
            return $path;
        }

        $disk = self::diskName();

        if (config("filesystems.disks.{$disk}.driver") === 'local') {
            $baseUrl = config('filesystems.public_media_url');

            if ($baseUrl) {
                return rtrim($baseUrl, '/').'/'.implode('/', array_map('rawurlencode', explode('/', $path)));
            }

            // Use the current browser origin and serve directly from the configured disk.
            // This works without a storage symlink, including across Docker/host paths.
            return route('media.show', ['path' => $path], absolute: false);
        }

        return Storage::disk($disk)->url($path);
    }

    private static function isAbsoluteUrl(string $path): bool
    {
        return preg_match('/^https?:\/\//i', $path) === 1;
    }
}
