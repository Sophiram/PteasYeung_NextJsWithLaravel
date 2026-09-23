#!/bin/sh
set -e

echo "🚀 Booting Pteas Yeung API container..."

# Create storage symlink if not present
if [ ! -L /var/www/html/public/storage ]; then
    echo "🔗 Creating storage symlink..."
    php artisan storage:link || true
fi

# Wait for database availability if configured
if [ "$DB_CONNECTION" = "pgsql" ] || [ "$DB_CONNECTION" = "mysql" ]; then
    echo "⏳ Checking database connection ($DB_CONNECTION)..."
    php -r '
    $connected = false;
    $conn = getenv("DB_CONNECTION") ?: "pgsql";
    $defaultPort = ($conn === "mysql") ? 3306 : 5432;
    $host = getenv("DB_HOST") ?: "postgres";
    $port = getenv("DB_PORT") ?: $defaultPort;
    for ($i = 0; $i < 30; $i++) {
        $fp = @fsockopen($host, (int)$port, $errno, $errstr, 2);
        if ($fp) {
            fclose($fp);
            $connected = true;
            break;
        }
        sleep(1);
    }
    if (!$connected) {
        fwrite(STDERR, "Database connection timeout ($host:$port)\n");
        exit(1);
    }
    '
fi

# Auto migrate on production startup if enabled
if [ "$AUTO_MIGRATE" = "true" ] || [ "$APP_ENV" = "production" ]; then
    echo "📦 Running database migrations..."
    php artisan migrate --force --graceful || true
fi

# Auto initialize MinIO bucket if minio disk is selected
if [ "$FILESYSTEM_DISK" = "minio" ]; then
    echo "🪣 Initializing MinIO configuration..."
    php -r '
    $endpoint = getenv("MINIO_ENDPOINT") ?: "http://room-minio:9000";
    echo "MinIO Endpoint: " . $endpoint . PHP_EOL;
    ' || true
fi

# Cache configurations for speed in production
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Optimizing Laravel caches..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Ensure storage and bootstrap/cache permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ Pteas Yeung API is ready!"

# Start supervisord to manage php-fpm and nginx
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
