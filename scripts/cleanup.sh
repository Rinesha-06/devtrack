#!/usr/bin/env bash
# ============================================================
# DevTrack Teardown & Resource Cleanup Script (Bash)
# ============================================================
set -e

PROJECT_ID=${1:-"project-b2ff78e3-650d-4af6-9bb"}
REGION=${2:-"asia-south1"}
REPO_NAME="devtrack-repo"
SERVICE_NAME="devtrack-app"

echo "===================================================="
echo "DevTrack Cloud Cleanup (Academic)"
echo "===================================================="

read -p "Are you sure you want to delete DevTrack cloud resources? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

echo "[1/3] Deleting Cloud Run service '$SERVICE_NAME'..."
gcloud run services delete "$SERVICE_NAME" --platform=managed --region="$REGION" --quiet || true

echo "[2/3] Deleting Artifact Registry repository '$REPO_NAME'..."
gcloud artifacts repositories delete "$REPO_NAME" --location="$REGION" --quiet || true

echo "[3/3] Done."
