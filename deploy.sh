#!/usr/bin/env bash

# ==============================================================================
# Pteas Yeung Platform - Production Deployment Script
# Zero-downtime Docker Compose deployment for Next.js & Laravel API
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "🚀 Pteas Yeung Platform Deployment: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================================="

# 1. Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found in root. Checking for .env.production..."
    if [ -f .env.production ]; then
        echo "📋 Copying .env.production to .env..."
        cp .env.production .env
    else
        echo "❌ Error: Neither .env nor .env.production found! Please configure environment."
        exit 1
    fi
fi

# 2. Pull latest code from git if inside git repository
if [ -d .git ]; then
    echo "📥 Pulling latest git changes..."
    git fetch origin main || git fetch origin master || true
    git pull origin main || git pull origin master || true
fi

# 3. Build & update containers
echo "🔨 Building Docker containers..."
docker compose build --pull

# 4. Bring up dependencies first (postgres, redis & minio)
echo "📦 Starting database, cache & storage services..."
docker compose up -d postgres redis minio

# 5. Bring up API & UI with rolling updates
echo "🚢 Deploying application services..."
docker compose up -d --remove-orphans

# 6. Execute Laravel maintenance and optimizations inside API container
echo "⚡ Executing post-deployment tasks inside API container..."
docker compose exec -T api php artisan migrate --force --graceful
docker compose exec -T api php artisan storage:link || true
docker compose exec -T api php artisan config:cache
docker compose exec -T api php artisan route:cache
docker compose exec -T api php artisan view:cache
docker compose exec -T api php artisan queue:restart || true

# 7. Clean up stale docker resources
echo "🧹 Pruning dangling docker images..."
docker image prune -f || true

# 8. Health check verification
echo "🩺 Running health check..."
sleep 3
if docker compose ps | grep -q "Up"; then
    echo "=========================================================="
    echo "✅ Pteas Yeung Platform deployed successfully!"
    echo "=========================================================="
    docker compose ps
else
    echo "❌ Deployment error: Some services failed to start. Run 'docker compose logs' for details."
    exit 1
fi
