# DevTrack Demo Data Seeder (PowerShell)
Write-Host "Seeding DevTrack realistic demo data..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot/../backend"
npm run seed
Write-Host "Demo data seeding complete!" -ForegroundColor Green
