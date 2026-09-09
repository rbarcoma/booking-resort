<?php

namespace App\Http\Controllers;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaController extends Controller
{
    public function show(Request $request, string $path): BinaryFileResponse
    {
        $diskName = MediaStorage::diskName();
        abort_unless(config("filesystems.disks.{$diskName}.driver") === 'local', 404);

        // Only public upload directories are eligible. Payment proofs remain admin-only.
        abort_unless(preg_match('#^(site-settings|resort-options|resort-option-gallery)/#', $path), 404);
        abort_if(str_contains($path, '\\') || str_contains($path, "\0") || in_array('..', explode('/', $path), true), 404);

        $disk = Storage::disk($diskName);
        $root = realpath($disk->path(''));
        $file = realpath($disk->path($path));

        abort_unless($root && $file && str_starts_with($file, $root.DIRECTORY_SEPARATOR) && is_file($file), 404);

        $mime = mime_content_type($file);
        abort_unless(in_array($mime, [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/x-ms-bmp',
            'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'audio/ogg', 'application/ogg',
        ], true), 404);

        $response = response()->file($file, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ])->setAutoEtag()->setAutoLastModified();

        $response->isNotModified($request);

        return $response;
    }
}
