# ============================================================
# DevTrack Teardown & Resource Cleanup Script (PowerShell)
# Use this script after academic presentation to ensure zero lingering costs
# ============================================================

param(
    [string]$ProjectId = "project-b2ff78e3-650d-4af6-9bb",
    [string]$Region = "asia-south1",
    [string]$RepoName = "devtrack-repo",
    [string]$ServiceName = "devtrack-app"
)

Write-Host "====================================================" -ForegroundColor Red
Write-Host "DevTrack Resource Teardown (Academic Cleanup)" -ForegroundColor Red
Write-Host "Target Project: $ProjectId" -ForegroundColor Red
Write-Host "====================================================" -ForegroundColor Red

$confirm = Read-Host "Are you sure you want to delete DevTrack cloud resources? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Cleanup aborted by user." -ForegroundColor Yellow
    exit 0
}

# 1. Delete Cloud Run Service
Write-Host "`n[1/3] Deleting Cloud Run service '$ServiceName'..." -ForegroundColor Yellow
gcloud run services delete $ServiceName --platform=managed --region=$Region --quiet

# 2. Delete Artifact Registry Repository
Write-Host "`n[2/3] Deleting Artifact Registry repository '$RepoName'..." -ForegroundColor Yellow
gcloud artifacts repositories delete $RepoName --location=$Region --quiet

# 3. Clean local build artifacts
Write-Host "`n[3/3] Cleaning local dist folders..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot/../frontend/dist"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot/../backend/dist"

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "Cleanup completed! All potential cost-generating resources removed." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
