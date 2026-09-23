<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageStorageService
{
    /**
     * Determine the active storage disk for images.
     * Supports: 'minio', 's3', 'public'.
     */
    public static function getActiveDisk(): string
    {
        $configured = env('FILESYSTEM_DISK', 'public');

        if (in_array($configured, ['minio', 's3', 'public'], true)) {
            return $configured;
        }

        // If MinIO settings are provided
        if (env('MINIO_KEY') || env('MINIO_ENDPOINT')) {
            return 'minio';
        }

        if (env('AWS_ACCESS_KEY_ID') && env('AWS_BUCKET')) {
            return 's3';
        }

        return 'public';
    }

    /**
     * Store an uploaded image to MinIO, S3, or public storage and return its public URL.
     */
    public static function store(UploadedFile $file, string $folder = 'rooms'): string
    {
        $disk = self::getActiveDisk();
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid() . '_' . time() . '.' . $extension;
        $path = $file->storeAs($folder, $filename, $disk);

        if ($disk === 'minio' || $disk === 's3') {
            return Storage::disk($disk)->url($path);
        }

        // For local public storage:
        $baseUrl = rtrim(env('APP_URL', 'http://localhost:8000'), '/');
        if (!str_contains($baseUrl, ':') && app()->environment('local')) {
            $baseUrl = 'http://localhost:8000';
        }

        return $baseUrl . '/storage/' . $path;
    }

    /**
     * Upload an image (alias for store).
     */
    public static function upload(UploadedFile $file, string $folder = 'rooms'): string
    {
        return self::store($file, $folder);
    }

    /**
     * Delete an image from storage (supports MinIO, S3, or local disk).
     */
    public static function delete(?string $imageUrl): bool
    {
        if (empty($imageUrl)) {
            return false;
        }

        $disk = self::getActiveDisk();

        // 1. Full URL with MinIO / S3 or Local
        if (str_contains($imageUrl, 'http://') || str_contains($imageUrl, 'https://')) {
            $parsedUrl = parse_url($imageUrl, PHP_URL_PATH);
            
            // Check MinIO bucket prefix
            $bucket = config("filesystems.disks.{$disk}.bucket");
            if ($bucket && str_starts_with(ltrim($parsedUrl, '/'), $bucket . '/')) {
                $relativeObjectPath = substr(ltrim($parsedUrl, '/'), strlen($bucket) + 1);
                if (Storage::disk($disk)->exists($relativeObjectPath)) {
                    return Storage::disk($disk)->delete($relativeObjectPath);
                }
            }

            // Check local /storage/
            if (str_contains($imageUrl, '/storage/')) {
                $localPath = preg_replace('#^.*?/storage/#', '', $imageUrl);
                if (Storage::disk('public')->exists($localPath)) {
                    return Storage::disk('public')->delete($localPath);
                }
            }

            $directPath = ltrim($parsedUrl, '/');
            if (Storage::disk($disk)->exists($directPath)) {
                return Storage::disk($disk)->delete($directPath);
            }
        }

        // 2. Relative path
        $cleanPath = ltrim(preg_replace('#^/?(storage/)?#', '', $imageUrl), '/');
        if (Storage::disk('public')->exists($cleanPath)) {
            return Storage::disk('public')->delete($cleanPath);
        }

        if (Storage::disk($disk)->exists($cleanPath)) {
            return Storage::disk($disk)->delete($cleanPath);
        }

        return false;
    }
}
