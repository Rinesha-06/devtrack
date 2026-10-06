#!/usr/bin/env bash
# ============================================================
# DevTrack Automated Google Cloud Deployment Script (Bash)
# ============================================================
set -e

PROJECT_ID=${1:-"project-b2ff78e3-650d-4af6-9bb"}
REGION=${2:-"asia-south1"}
REPO_NAME="devtrack-repo"
SERVICE_NAME="devtrack-app"

echo "===================================================="
echo "DevTrack Google Cloud Deployment Initialized"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "===================================================="

# 1. Project Config
gcloud config set project "$PROJECT_ID"

# 2. Enable Serverless APIs
echo "[1/4] Enabling Serverless APIs..."
gcloud services enable \
    run.googleapis.com \
    firestore.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

# 3. Create Artifact Registry if missing
echo "[2/4] Verifying Artifact Registry..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="DevTrack container images"
fi

# 4. Submit Cloud Build
echo "[3/4] Submitting Cloud Build Pipeline..."
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_REGION="$REGION",_REPO_NAME="$REPO_NAME",_SERVICE_NAME="$SERVICE_NAME"

# 5. Service URL
echo "[4/4] Retrieving Deployed URL..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform=managed --region="$REGION" --format="value(status.url)")

echo "===================================================="
echo "DevTrack Live URL: $SERVICE_URL"
echo "===================================================="
