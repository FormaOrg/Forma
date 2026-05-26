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
    Write-Warning "Docker Compose failed to start the services. Falling back to local startup."
    $localStartScript = Join-Path $repoRoot "start-backend-local.ps1"
    if (-not (Test-Path $localStartScript)) {
        throw "Docker Compose failed to start the services, and $localStartScript was not found."
    }

    try {
        & $localStartScript
    } catch {
        throw "Local backend startup also failed: $($_.Exception.Message)"
    }

    Write-Host ""
    Write-Host "Docker startup failed, but local backend fallback is running." -ForegroundColor Yellow
    return
}

Write-Host "Waiting for containers to stabilize..." -ForegroundColor Cyan
Start-Sleep -Seconds 12

$containerNames = @(
    "forma_backend"
)

$runningContainers = @()
foreach ($containerName in $containerNames) {
    $isRunning = docker inspect -f "{{.State.Running}}" $containerName 2>$null
    if ($LASTEXITCODE -eq 0 -and "$isRunning".Trim() -eq "true") {
        $runningContainers += $containerName
    }
}

if ($runningContainers.Count -ne $containerNames.Count) {
    Write-Warning "One or more Docker containers exited during startup."
    Write-Host ""
    Write-Host "Container status:" -ForegroundColor Yellow
    docker compose -f $composeFile ps
    Write-Host ""
    Write-Host "Recent logs from failed services:" -ForegroundColor Yellow
    docker compose -f $composeFile logs --tail 40
    Write-Host ""
    Write-Warning "Docker backend startup did not complete successfully."
    return
}

Write-Host ""
Write-Host "Backend service is starting." -ForegroundColor Green
Write-Host "Backend:    http://localhost:8081"
