# 🚀 Pteas Yeung Platform — Production Deployment Guide

This document provides complete instructions for deploying the **Pteas Yeung Platform (Room Management System)** using Docker Compose, PostgreSQL 16, MinIO (`room-minio`), and GitHub Actions CI/CD.

---

## 🏗️ 1. Architecture Overview

| Component | Technology | Container Name | Port (Host / Internal) |
| :--- | :--- | :--- | :--- |
| **Reverse Proxy / Gateway** | Nginx Alpine | `pteas_gateway` | `80`, `443` |
| **Frontend UI** | Next.js 16 (App Router) | `pteas_ui` | Internal `3000` |
| **Backend API** | Laravel 13 (PHP 8.3 FPM + Nginx) | `pteas_api` | Internal `80` |
| **Database** | PostgreSQL 16 Alpine | `pteas_postgres` | `5432` |
| **Object Storage** | MinIO S3 | `room-minio` | `9000` (API), `9001` (Console) |
| **Cache & Queue** | Redis Alpine | `pteas_redis` | Internal `6379` |

```
                       ┌────────────────────────────┐
                       │  Nginx Gateway (:80/:443)  │
                       └──────────────┬─────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      ┌─────────────────────┐                   ┌─────────────────────┐
      │  Next.js 16 (UI)    │                   │  Laravel 13 (API)   │
      │   (pteas_ui:3000)   │◄──(Bearer Auth)───┤   (pteas_api:80)    │
      └─────────────────────┘                   └──────────┬──────────┘
                                                           │
                    ┌─────────────────┬────────────────────┼─────────────────┐
                    ▼                 ▼                    ▼                 ▼
             ┌─────────────┐   ┌─────────────┐      ┌─────────────┐   ┌─────────────┐
             │ PostgreSQL  │   │    Redis    │      │  AuditLog   │   │  MinIO S3   │
             │ (:5432)     │   │ (:6379)     │      │  Telemetry  │   │ (room-minio)│
             └─────────────┘   └─────────────┘      └─────────────┘   └─────────────┘
```

---

## 📋 2. Server Requirements & Prerequisites

* **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS (recommended)
* **Hardware Requirements**:
  * Minimum: 2 vCPU, 4 GB RAM, 25 GB SSD
  * Recommended: 4 vCPU, 8 GB RAM, 50 GB SSD
* **Installed Packages on Server**:
  * Docker Engine (>= 24.0)
  * Docker Compose (>= 2.20)
  * Git
  * OpenSSL

To install Docker and Docker Compose on a fresh Ubuntu server:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

---

## ⚙️ 3. Environment Configuration

### Step 1: Clone Repository
```bash
git clone https://github.com/Sophiram/PteasYeung_NextJsWithLaravel.git /var/www/pteas-yeung
cd /var/www/pteas-yeung
```

### Step 2: Configure Production Environment (`.env`)
Copy the production template:
```bash
cp .env.production.example .env
```

Open `.env` and configure your production values:
```ini
# ========================================================
# Domain & Ports
# ========================================================
PORT_HTTP=80
APP_URL=https://pteasyeung.yourdomain.com
FRONTEND_URL=https://pteasyeung.yourdomain.com
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_STORAGE_URL=/storage

# ========================================================
# Laravel Application Key
# Generate key with: docker run --rm -v $(pwd)/pteas-yeung-api:/app composer:2.7 sh -c "cd /app && composer install --no-dev && php artisan key:generate --show"
# ========================================================
APP_NAME="Pteas Yeung Platform"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_APP_KEY_HERE
APP_DEBUG=false

# ========================================================
# Database: PostgreSQL 16
# ========================================================
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=pteas_yeung
DB_USERNAME=pteas_user
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD_HERE

# ========================================================
# Cache & Queue (Redis)
# ========================================================
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis
REDIS_PORT=6379

# ========================================================
# Object Storage (MinIO S3 - Container: room-minio)
# ========================================================
FILESYSTEM_DISK=minio
MINIO_KEY=YOUR_MINIO_ROOT_USER_HERE
MINIO_SECRET=YOUR_MINIO_ROOT_PASSWORD_HERE
MINIO_REGION=us-east-1
MINIO_BUCKET=pteas-yeung
MINIO_ENDPOINT=http://room-minio:9000
MINIO_URL=https://pteasyeung.yourdomain.com:9000/pteas-yeung
MINIO_USE_PATH_STYLE_ENDPOINT=true
```

---

## 🚢 4. Deployment Execution

### Automated Zero-Downtime Deployment
Make the deployment script executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

### What `deploy.sh` Does Automatically:
1. Validates that `.env` is properly present.
2. Pulls the latest commits from the Git repository.
3. Builds the Docker images (`pteas_ui` with Next.js Turbopack build and `pteas_api` with PHP 8.3 FPM + Nginx).
4. Launches the database (`pteas_postgres`), cache (`pteas_redis`), and storage (`room-minio`) services.
5. Deploys the application containers with zero-downtime rolling replacement.
6. Executes Laravel database migrations (`php artisan migrate --force --graceful`).
7. Warms up route, configuration, and view caches.
8. Prunes dangling Docker images to conserve server disk space.

---

## 🪣 5. MinIO S3 Storage Setup (`room-minio`)

1. **Access the MinIO Web Console**:
   Open `http://your-server-ip:9001` in your browser.
2. **Log In**:
   Use your configured `MINIO_KEY` and `MINIO_SECRET`.
3. **Create the Bucket**:
   * Bucket Name: `pteas-yeung`
4. **Set Public Read Access Policy**:
   * Navigate to **Buckets** $\rightarrow$ `pteas-yeung` $\rightarrow$ **Access Policy**.
   * Change policy to **Public** (or add a prefix `*` with read-only permission).
   * This ensures room images and receipts display properly on the frontend.

Alternatively, use the MinIO Client (`mc`) inside Docker:
```bash
docker compose exec room-minio mc alias set local http://localhost:9000 $MINIO_KEY $MINIO_SECRET
docker compose exec room-minio mc mb local/pteas-yeung || true
docker compose exec room-minio mc anonymous set public local/pteas-yeung
```

---

## 🔒 6. SSL / HTTPS Setup with Nginx & Certbot

To secure the platform with free SSL certificates from Let's Encrypt:

### Step 1: Install Certbot on Host
```bash
sudo apt-get install -y certbot
```

### Step 2: Obtain Certificate
```bash
sudo certbot certonly --standalone -d pteasyeung.yourdomain.com
```

### Step 3: Update Gateway Configuration
Mount the SSL certificates inside `docker-compose.yml` under the `gateway` service:
```yaml
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
```

Add the HTTPS server block to `docker/nginx/nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name pteasyeung.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pteasyeung.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pteasyeung.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /storage/ {
        proxy_pass http://backend/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔄 7. CI/CD Setup with GitHub Actions

The repository includes two pre-configured GitHub Actions workflows in `.github/workflows/`:
1. **`ci.yml`**: Runs automatically on every push or pull request to `main` / `master` / `develop`.
   * Sets up PHP 8.3 with `pdo_pgsql`, `pgsql`, and `pdo_sqlite`.
   * Runs the PHPUnit / Pest test suite.
   * Compiles the Next.js production build (`npm run build`) and checks TypeScript types.
2. **`deploy.yml`**: Automatically deploys code to the production server upon push to `main` or manual trigger (`workflow_dispatch`).

### Required GitHub Repository Secrets
Go to your GitHub repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** and add:

| Secret Name | Value Example | Description |
| :--- | :--- | :--- |
| `SERVER_HOST` | `142.93.xxx.xxx` | Production server public IP or domain |
| `SERVER_USER` | `ubuntu` or `root` | SSH user |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Private SSH key with server access |
| `SERVER_PORT` | `22` | SSH port (defaults to 22) |
| `DEPLOY_PATH` | `/var/www/pteas-yeung` | Project root path on the server |

---

## 🛠️ 8. Useful Operations & Commands

### View Container Status
```bash
docker compose ps
```

### View Real-Time Logs
```bash
# All services
docker compose logs -f

# API logs only
docker compose logs -f api

# Gateway logs only
docker compose logs -f gateway
```

### Run Migrations & Seeders
```bash
# Run pending migrations
docker compose exec api php artisan migrate --force

# Seed initial roles, permissions, and admin account
docker compose exec api php artisan db:seed --force
```

### Database Backup & Restore (PostgreSQL)
```bash
# Backup database to a file
docker compose exec -T postgres pg_dump -U pteas_user -d pteas_yeung > backup_$(date +%F).sql

# Restore database from a file
cat backup_2026-09-23.sql | docker compose exec -T postgres psql -U pteas_user -d pteas_yeung
```

### Restart a Specific Service
```bash
docker compose restart api
docker compose restart ui
docker compose restart room-minio
```

---

## ❓ 9. Troubleshooting & FAQ

### Q1: API shows "Database connection timeout (postgres:5432)"
* Ensure the `postgres` container is up: `docker compose ps postgres`.
* Check database logs: `docker compose logs postgres`.
* Verify that `DB_PASSWORD` and `POSTGRES_PASSWORD` match in your `.env`.

### Q2: Room images return 403 Forbidden or broken images
* Open MinIO Console at `http://your-server-ip:9001`.
* Confirm the bucket `pteas-yeung` exists and its Access Policy is set to **Public**.

### Q3: Next.js API requests return 401 Unauthorized
* Clear your browser cookies (`access_token`, `user_role`).
* Verify that your token has not expired and that the `APP_KEY` in `.env` has remained constant.
