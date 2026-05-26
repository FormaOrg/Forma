$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $repoRoot "Backend"
$runRoot = Join-Path $repoRoot ".run"
$pidRoot = Join-Path $runRoot "pids"
$logRoot = Join-Path $runRoot "logs"
$sharedEnvFile = Join-Path $backendRoot "service-utilisateurs/.env"

if (Test-Path $sharedEnvFile) {
    Get-Content $sharedEnvFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            return
        }

        $separatorIndex = $line.IndexOf("=")
        if ($separatorIndex -lt 1) {
            return
        }

        $name = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim().Trim('"')
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$services = @(
    @{ Name = "service-utilisateurs"; DisplayName = "forma-backend"; Port = 8081 }
)

New-Item -ItemType Directory -Force -Path $pidRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

foreach ($service in $services) {
    $serviceDir = Join-Path $backendRoot $service.Name
    $pomFile = Join-Path $serviceDir "pom.xml"
    $mavenWrapper = Join-Path $serviceDir "mvnw.cmd"
    $serviceLabel = if ($service.DisplayName) { $service.DisplayName } else { $service.Name }

    if (-not (Test-Path $pomFile)) {
        throw "Missing pom.xml for $serviceLabel at $serviceDir"
    }

    if (-not (Test-Path $mavenWrapper)) {
        throw "Missing mvnw.cmd for $serviceLabel at $serviceDir"
    }

    $pidFile = Join-Path $pidRoot "$($service.Name).pid"
    if (Test-Path $pidFile) {
        $existingPidLine = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        $existingPid = if ($null -ne $existingPidLine) { "$existingPidLine".Trim() } else { "" }
        if ($existingPid) {
            $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
            if ($existingProcess) {
                Write-Host "Stopping $serviceLabel (PID $existingPid) before restart..." -ForegroundColor Yellow
                Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    $stdoutLog = Join-Path $logRoot "$($service.Name).out.log"
    $stderrLog = Join-Path $logRoot "$($service.Name).err.log"

    Write-Host "Starting $serviceLabel on port $($service.Port)..." -ForegroundColor Cyan

    $process = Start-Process `
        -FilePath $mavenWrapper `
        -ArgumentList "clean spring-boot:run" `
        -WorkingDirectory $serviceDir `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -PassThru

    Set-Content -Path $pidFile -Value $process.Id
}

Write-Host ""
Write-Host "Backend service launched in the background." -ForegroundColor Green
Write-Host "Logs: $logRoot"
Write-Host "PIDs: $pidRoot"
Write-Host "Backend:    http://localhost:8081"
