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
    $pidLine = Get-Content $pidFile.FullName -ErrorAction SilentlyContinue | Select-Object -First 1
    $servicePid = if ($null -ne $pidLine) { "$pidLine".Trim() } else { "" }

    if (-not $servicePid) {
        Remove-Item $pidFile.FullName -Force -ErrorAction SilentlyContinue
        continue
    }

    $process = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Stopping $serviceName (PID $servicePid)..." -ForegroundColor Yellow
        Stop-Process -Id $servicePid -Force
    } else {
        Write-Host "$serviceName is not running anymore." -ForegroundColor DarkYellow
    }

    Remove-Item $pidFile.FullName -Force -ErrorAction SilentlyContinue
}

Write-Host "Local backend services stopped." -ForegroundColor Green
