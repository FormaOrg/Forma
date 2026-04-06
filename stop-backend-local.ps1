$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidRoot = Join-Path $repoRoot ".run\pids"

if (-not (Test-Path $pidRoot)) {
    Write-Host "No local backend PID directory found." -ForegroundColor Yellow
    exit 0
}

$pidFiles = Get-ChildItem $pidRoot -Filter *.pid -ErrorAction SilentlyContinue
if (-not $pidFiles) {
    Write-Host "No local backend services appear to be running." -ForegroundColor Yellow
    exit 0
}

foreach ($pidFile in $pidFiles) {
    $serviceName = [System.IO.Path]::GetFileNameWithoutExtension($pidFile.Name)
    $pid = (Get-Content $pidFile.FullName | Select-Object -First 1).Trim()

    if (-not $pid) {
        Remove-Item $pidFile.FullName -Force -ErrorAction SilentlyContinue
        continue
    }

    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Stopping $serviceName (PID $pid)..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force
    } else {
        Write-Host "$serviceName is not running anymore." -ForegroundColor DarkYellow
    }

    Remove-Item $pidFile.FullName -Force -ErrorAction SilentlyContinue
}

Write-Host "Local backend services stopped." -ForegroundColor Green
