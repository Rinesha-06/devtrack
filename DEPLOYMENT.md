# DevTrack — Google Cloud Deployment Guide

This document describes how to deploy **DevTrack** to **Google Cloud Platform (GCP)** using **Cloud Run**, **Artifact Registry**, and **Cloud Build**.

---

## 1. Prerequisites

1. An active Google Cloud Project (e.g. `project-b2ff78e3-650d-4af6-9bb`).
2. Google Cloud SDK (`gcloud`) installed and authenticated.
3. Billing enabled on the Google Cloud Project (utilizing your Free Trial credits).

---

## 2. One-Command Automated Deployment

### Windows PowerShell
```powershell
.\scripts\deploy-gcp.ps1 -ProjectId "project-b2ff78e3-650d-4af6-9bb" -Region "asia-south1"
```

### Linux / macOS / WSL
```bash
chmod +x scripts/*.sh
./scripts/deploy-gcp.sh "project-b2ff78e3-650d-4af6-9bb" "asia-south1"
```

---

## 3. Manual Step-by-Step Deployment

If you prefer executing the steps manually:

### Step 1: Set Active Project
```bash
gcloud config set project project-b2ff78e3-650d-4af6-9bb
```

### Step 2: Enable Required Google Cloud APIs
```bash
gcloud services enable \
    run.googleapis.com \
    firestore.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com
```

### Step 3: Create Artifact Registry Docker Repository
```bash
gcloud artifacts repositories create devtrack-repo \
    --repository-format=docker \
    --location=asia-south1 \
    --description="DevTrack container images"
```

### Step 4: Submit Build via Google Cloud Build
Google Cloud Build will execute `cloudbuild.yaml`:
1. Run backend tests.
2. Build frontend and backend.
3. Build multi-stage Docker container.
4. Push image to Artifact Registry.
5. Deploy to Cloud Run.

```bash
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_REGION="asia-south1",_REPO_NAME="devtrack-repo",_SERVICE_NAME="devtrack-app"
```

### Step 5: Verify Deployment
Retrieve the public URL:
```bash
gcloud run services describe devtrack-app --platform=managed --region=asia-south1 --format="value(status.url)"
```

Test health check probe:
```bash
curl https://<SERVICE_URL>/api/health
```

---

## 4. Local Fullstack Execution
To test the complete unified system locally before cloud deployment:

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start unified server
cd backend && npm run build && npm start
```
Open your browser to `http://localhost:8080`.
