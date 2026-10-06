# DevTrack Automated Test Runner (PowerShell)
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Running DevTrack Automated Test Suite" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot/../backend"
$env:USE_LOCAL_DB = "true"
$env:NODE_ENV = "test"

npm test

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nTests encountered failures. Please review output." -ForegroundColor Red
}
exit $LASTEXITCODE
