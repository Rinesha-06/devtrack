# DevTrack Local Development Environment Setup (PowerShell)
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "DevTrack Local Setup (Frontend & Backend)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Backend dependencies
Write-Host "`n[1/3] Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot/../backend"
npm install

# 2. Frontend dependencies
Write-Host "`n[2/3] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot/../frontend"
npm install

# 3. Compile Frontend & Seed Demo Data
Write-Host "`n[3/3] Compiling Frontend & Seeding Initial Data..." -ForegroundColor Yellow
npm run build
Set-Location -Path "$PSScriptRoot/../backend"
npm run seed

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "Setup Completed Successfully!" -ForegroundColor Green
Write-Host "To run backend: cd backend; npm run dev" -ForegroundColor Green
Write-Host "To run frontend: cd frontend; npm run dev" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
