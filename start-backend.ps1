$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$composeFile = Join-Path $repoRoot "Backend\docker-compose.yml"

if (-not (Test-Path $composeFile)) {
    throw "docker-compose.yml not found at $composeFile"
}

$null = docker version 2>$null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running. Start Docker Desktop, wait until it says it is running, then run .\start-backend.ps1 again."
}

Write-Host "Starting Forma backend services from $composeFile..." -ForegroundColor Cyan
docker compose -f $composeFile up --build -d

if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose failed to start the services."
}

Write-Host ""
Write-Host "Backend services are starting." -ForegroundColor Green
Write-Host "Users:      http://localhost:8081"
Write-Host "Projects:   http://localhost:8082"
Write-Host "Commerce:   http://localhost:8083"
Write-Host "Analytics:  http://localhost:8084"
Write-Host "Billing:    http://localhost:8085"
