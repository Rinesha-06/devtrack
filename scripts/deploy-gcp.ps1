# ============================================================
# DevTrack Automated Google Cloud Deployment Script (PowerShell)
# Architecture: Scale-to-Zero Cloud Run + Firestore + Artifact Registry
# Cost Risk: LOW (Strict Academic Free Tier Compliance)
# ============================================================

param(
    [string]$ProjectId = "project-b2ff78e3-650d-4af6-9bb",
    [string]$Region = "asia-south1",
    [string]$RepoName = "devtrack-repo",
    [string]$ServiceName = "devtrack-app"
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "DevTrack Google Cloud Deployment Initialized" -ForegroundColor Cyan
Write-Host "Target Project: $ProjectId" -ForegroundColor Cyan
Write-Host "Target Region:  $Region" -ForegroundColor Cyan
Write-Host "Cost Profile:   Scale-to-Zero (Free Tier Protected)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Configure gcloud project
Write-Host "`n[1/5] Setting gcloud active project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# 2. Enable Required Scale-to-Zero Services
Write-Host "`n[2/5] Enabling Serverless Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    firestore.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    logging.googleapis.com `
    monitoring.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[Notice] Service enablement encountered a billing precondition." -ForegroundColor Yellow
    Write-Host "Ensure your Free Trial billing account is linked to project '$ProjectId' via Google Cloud Console." -ForegroundColor Yellow
    Write-Host "Console link: https://console.cloud.google.com/billing/linkedaccount?project=$ProjectId" -ForegroundColor Cyan
    exit 1
}

# 3. Create Artifact Registry Docker Repository
Write-Host "`n[3/5] Verifying Artifact Registry Repository ($RepoName)..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $RepoName --location=$Region 2>&1
if ($repoExists -like "*NOT_FOUND*") {
    Write-Host "Creating Docker repository '$RepoName' in $Region..." -ForegroundColor Yellow
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --description="DevTrack container images"
}

# 4. Submit Build via Google Cloud Build
Write-Host "`n[4/5] Executing Cloud Build Pipeline..." -ForegroundColor Yellow
gcloud builds submit `
    --config=cloudbuild.yaml `
    --substitutions=_REGION=$Region,_REPO_NAME=$RepoName,_SERVICE_NAME=$ServiceName

# 5. Retrieve Deployed Cloud Run Service URL
Write-Host "`n[5/5] Fetching Cloud Run Deployment Status..." -ForegroundColor Yellow
$serviceUrl = gcloud run services describe $ServiceName --platform=managed --region=$Region --format="value(status.url)"

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "DevTrack Successfully Deployed to Google Cloud Run!" -ForegroundColor Green
Write-Host "Service URL:  $serviceUrl" -ForegroundColor Green
Write-Host "Health Probe: $serviceUrl/api/health" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
