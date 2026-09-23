<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('storage:minio-init', function () {
    $this->info('Initializing MinIO storage bucket and policies...');
    try {
        $disk = 'minio';
        $bucketName = config("filesystems.disks.{$disk}.bucket", 'pteas-yeung');
        $s3Client = \Illuminate\Support\Facades\Storage::disk($disk)->getClient();

        $existingBuckets = array_column($s3Client->listBuckets()['Buckets'] ?? [], 'Name');
        if (!in_array($bucketName, $existingBuckets, true)) {
            $this->info("Creating bucket '{$bucketName}' in MinIO...");
            $s3Client->createBucket(['Bucket' => $bucketName]);
            $this->info("Bucket '{$bucketName}' created successfully.");
        } else {
            $this->comment("Bucket '{$bucketName}' already exists.");
        }

        // Configure public read policy
        $this->info("Configuring public read policy on '{$bucketName}'...");
        $policy = json_encode([
            'Version' => '2012-10-17',
            'Statement' => [
                [
                    'Sid' => 'PublicReadGetObject',
                    'Effect' => 'Allow',
                    'Principal' => '*',
                    'Action' => ['s3:GetObject'],
                    'Resource' => ["arn:aws:s3:::{$bucketName}/*"]
                ]
            ]
        ]);

        $s3Client->putBucketPolicy([
            'Bucket' => $bucketName,
            'Policy' => $policy,
        ]);

        $this->info("✅ MinIO bucket '{$bucketName}' is initialized and publicly accessible!");
    } catch (\Throwable $e) {
        $this->error("Failed to initialize MinIO: " . $e->getMessage());
        return 1;
    }
    return 0;
})->purpose('Initialize MinIO bucket and apply public read policy');
