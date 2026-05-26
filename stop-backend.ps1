$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$composeFile = Join-Path $repoRoot "Backend\docker-compose.yml"

if (-not (Test-Path $composeFile)) {
    throw "docker-compose.yml not found at $composeFile"
}

Write-Host "Stopping Forma backend service..." -ForegroundColor Yellow
docker compose -f $composeFile down

if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose failed to stop the services."
}

Write-Host "Backend service stopped." -ForegroundColor Green
