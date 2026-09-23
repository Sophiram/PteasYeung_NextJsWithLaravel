# ☁️ Multi-Cloud Deployment Guide: Next.js on Vercel & Laravel on AWS / Google Cloud

This guide provides end-to-end instructions for deploying:
* **Frontend**: Next.js 16 (`pteas-yeung-ui`) on **Vercel**
* **Backend**: Laravel 13 API (`pteas-yeung-api`) on **Google Cloud (Cloud Run)** or **Amazon Web Services (AWS App Runner / ECS)**
* **Database**: Managed **PostgreSQL 16** (Google Cloud SQL or AWS RDS)
* **Object Storage**: S3-compatible cloud storage (AWS S3 or Google Cloud Storage)

---

## 📐 Architecture Overview

```
 ┌────────────────────────────────┐         HTTPS / REST API         ┌────────────────────────────────┐
 │     Next.js 16 on VERCEL       │ ───────────────────────────────► │    Laravel 13 on GCP or AWS    │
 │ (https://pteasyeung.vercel.app)│ ◄─────────────────────────────── │ (Cloud Run / AWS App Runner)   │
 └────────────────────────────────┘      CORS & Bearer Auth Header   └───────────────┬────────────────┘
                                                                                     │
                                                      ┌──────────────────────────────┴─────────────────────────────┐
                                                      ▼                                                            ▼
                                        ┌───────────────────────────┐                                ┌───────────────────────────┐
                                        │  PostgreSQL 16 (Managed)  │                                │  S3 / GCS Object Storage  │
                                        │  (Cloud SQL or AWS RDS)   │                                │  (Room & Receipt Assets)  │
                                        └───────────────────────────┘                                └───────────────────────────┘
```

---

## 🚀 Part 1: Deploy Frontend to Vercel

Since both frontend and backend are in a single unified Git repository (monorepo), Vercel must be instructed to build from the `pteas-yeung-ui` directory.

### Method A: Connect via Vercel Web Dashboard (Recommended)

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository: `Sophiram/PteasYeung_NextJsWithLaravel`.
4. In the **Configure Project** screen, configure the following:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click **Edit** and select **`pteas-yeung-ui`** ⚠️ *(Critical)*
   * **Build Command**: `npm run build` (default)
   * **Output Directory**: `.next` (default)
   * **Install Command**: `npm install` (default)
5. Under **Environment Variables**, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` | Your Cloud Run / AWS backend URL with `/api` |
| `NEXT_PUBLIC_STORAGE_URL` | `https://api.yourdomain.com/storage` | Public storage URL for room images |

6. Click **Deploy**. Vercel will build the frontend and provide your production URL (e.g., `https://pteas-yeung-ui.vercel.app`).

### Method B: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend directory
cd pteas-yeung-ui

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

---

## ☁️ Part 2: Deploy Backend to Google Cloud (GCP)

**Google Cloud Run** is the best serverless choice for containerized Laravel:
* Scales to zero when idle (extremely cost-effective).
* Native support for Dockerfile (`pteas-yeung-api/Dockerfile`).
* Automated HTTPS and free SSL certificates.

### Step 1: Install & Initialize Google Cloud SDK
```bash
# Log in to Google Cloud
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### Step 2: Create a Cloud SQL (PostgreSQL 16) Instance
```bash
# 1. Create Cloud SQL PostgreSQL instance
gcloud sql instances create pteas-postgres \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=asia-southeast1 \
    --root-password="YOUR_STRONG_DB_PASSWORD"

# 2. Create database
gcloud sql databases create pteas_yeung --instance=pteas-postgres

# 3. Create database user
gcloud sql users create pteas_user --instance=pteas-postgres --password="YOUR_STRONG_DB_PASSWORD"
```

### Step 3: Build & Push Docker Image to Google Artifact Registry
```bash
# Create repository in Artifact Registry
gcloud artifacts repositories create pteas-repo \
    --repository-format=docker \
    --location=asia-southeast1

# Build and submit image from API directory
gcloud builds submit pteas-yeung-api \
    --tag asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/pteas-repo/pteas-api:latest
```

### Step 4: Deploy to Cloud Run
```bash
# Get your Cloud SQL Connection Name:
# Format: YOUR_GCP_PROJECT_ID:asia-southeast1:pteas-postgres
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe pteas-postgres --format='value(connectionName)')

# Deploy container to Cloud Run
gcloud run deploy pteas-api \
    --image asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/pteas-repo/pteas-api:latest \
    --platform managed \
    --region asia-southeast1 \
    --allow-unauthenticated \
    --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
    --set-env-vars "APP_NAME=PteasYeung,APP_ENV=production,APP_DEBUG=false,APP_KEY=base64:YOUR_APP_KEY" \
    --set-env-vars "FRONTEND_URL=https://pteas-yeung-ui.vercel.app" \
    --set-env-vars "DB_CONNECTION=pgsql,DB_HOST=/cloudsql/$INSTANCE_CONNECTION_NAME,DB_PORT=5432,DB_DATABASE=pteas_yeung,DB_USERNAME=pteas_user,DB_PASSWORD=YOUR_STRONG_DB_PASSWORD" \
    --set-env-vars "FILESYSTEM_DISK=s3,AWS_DEFAULT_REGION=us-east-1,AWS_BUCKET=pteas-yeung-bucket"
```

### Step 5: Run Database Migrations on Cloud Run
```bash
gcloud run jobs create pteas-migrate \
    --image asia-southeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/pteas-repo/pteas-api:latest \
    --region asia-southeast1 \
    --command "php" \
    --args "artisan,migrate,--force" \
    --set-cloudsql-instances $INSTANCE_CONNECTION_NAME

gcloud run jobs execute pteas-migrate --region asia-southeast1
```

---

## 🟧 Part 3: Deploy Backend to Amazon Web Services (AWS)

**AWS App Runner** or **AWS Elastic Container Service (ECS)** is the recommended option on AWS.

### Step 1: Create Amazon RDS for PostgreSQL 16
1. Open the **Amazon RDS** console.
2. Click **Create Database**:
   * **Engine**: PostgreSQL (Version: 16.x)
   * **Template**: Free Tier or Dev/Test
   * **DB Instance Identifier**: `pteas-postgres`
   * **Master Username**: `pteas_user`
   * **Master Password**: Set a strong password
   * **VPC**: Default VPC (ensure security group allows port 5432 inbound)
   * **Initial Database Name**: `pteas_yeung`

### Step 2: Push Docker Image to Amazon ECR
```bash
# 1. Log in to AWS ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# 2. Create ECR repository
aws ecr create-repository --repository-name pteas-api --region ap-southeast-1

# 3. Build & Tag
docker build -t pteas-api ./pteas-yeung-api
docker tag pteas-api:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/pteas-api:latest

# 4. Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/pteas-api:latest
```

### Step 3: Deploy via AWS App Runner
1. Open the **AWS App Runner** console $\rightarrow$ **Create service**.
2. **Repository type**: Container registry $\rightarrow$ Amazon ECR.
3. Select `pteas-api:latest`.
4. Configure service environment variables:
   * `APP_NAME`: `PteasYeung`
   * `APP_ENV`: `production`
   * `APP_DEBUG`: `false`
   * `APP_KEY`: `base64:YOUR_APP_KEY`
   * `FRONTEND_URL`: `https://pteas-yeung-ui.vercel.app`
   * `DB_CONNECTION`: `pgsql`
   * `DB_HOST`: `pteas-postgres.xxxxxx.ap-southeast-1.rds.amazonaws.com`
   * `DB_PORT`: `5432`
   * `DB_DATABASE`: `pteas_yeung`
   * `DB_USERNAME`: `pteas_user`
   * `DB_PASSWORD`: `YOUR_STRONG_PASSWORD`
   * `FILESYSTEM_DISK`: `s3`
   * `AWS_ACCESS_KEY_ID`: `YOUR_S3_KEY`
   * `AWS_SECRET_ACCESS_KEY`: `YOUR_S3_SECRET`
   * `AWS_BUCKET`: `your-s3-bucket-name`
   * `AWS_DEFAULT_REGION`: `ap-southeast-1`
5. Click **Create & Deploy**. App Runner provides an HTTPS URL (e.g., `https://xxxxxx.ap-southeast-1.awsapprunner.com`).

---

## 🔗 Part 4: Connect Vercel Frontend to Cloud Backend

Now that your backend is deployed:

1. Copy your Cloud Run / App Runner URL:
   * Example: `https://pteas-api-xxxx-as.a.run.app`
2. Go to your **Vercel Project Settings** $\rightarrow$ **Environment Variables**:
   * Update `NEXT_PUBLIC_API_URL` to:
     ```text
     https://pteas-api-xxxx-as.a.run.app/api
     ```
3. Update `FRONTEND_URL` on your Cloud backend:
   * Set `FRONTEND_URL` to your Vercel domain:
     ```text
     https://pteas-yeung-ui.vercel.app
     ```
4. **CORS & Sanctum**:
   * The backend's `config/cors.php` has already been pre-configured to automatically allow all `https://*.vercel.app` domains!
   * Cookies and Bearer tokens will transmit smoothly between Vercel and your cloud backend.

---

## 🔄 Part 5: Automated GitHub Actions CI/CD for Vercel & Cloud

### 1. Vercel Auto-Deployment
Vercel automatically deploys every push to the `main` branch when connected to your GitHub repository.

### 2. Backend Cloud Deployment via GitHub Actions
Add the following workflow to `.github/workflows/deploy-backend-cloud.yml` to automatically build and deploy the backend on every commit to `main`:

```yaml
name: Deploy Backend to Cloud

on:
  push:
    branches: [ main ]
    paths:
      - 'pteas-yeung-api/**'
      - '.github/workflows/deploy-backend-cloud.yml'

jobs:
  deploy-cloud:
    name: Build & Deploy to Google Cloud Run
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build and Push Docker Container
        run: |
          gcloud builds submit pteas-yeung-api \
            --tag asia-southeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/pteas-repo/pteas-api:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy pteas-api \
            --image asia-southeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/pteas-repo/pteas-api:${{ github.sha }} \
            --region asia-southeast1
```

---

## 🛠️ Summary Checklist

- [x] **Monorepo Structure**: Frontend (`pteas-yeung-ui`) and Backend (`pteas-yeung-api`) in one Git repo.
- [x] **CORS Pre-configured**: `allowed_origins_patterns` permits `https://*.vercel.app`.
- [x] **PostgreSQL 16**: Supported across Cloud SQL and AWS RDS.
- [x] **Vercel Root Directory**: Set to `pteas-yeung-ui`.
- [x] **Cloud Backend Endpoint**: Connected to `NEXT_PUBLIC_API_URL` on Vercel.
