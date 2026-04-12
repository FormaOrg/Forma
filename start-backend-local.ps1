$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $repoRoot "Backend"
$runRoot = Join-Path $repoRoot ".run"
$pidRoot = Join-Path $runRoot "pids"
$logRoot = Join-Path $runRoot "logs"

$services = @(
    @{ Name = "service-utilisateurs"; Port = 8081 },
    @{ Name = "service-projets"; Port = 8082 },
    @{ Name = "service-commerce"; Port = 8083 },
    @{ Name = "service-analytics"; Port = 8084 },
    @{ Name = "service-billing"; Port = 8085 }
)

New-Item -ItemType Directory -Force -Path $pidRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

foreach ($service in $services) {
    $serviceDir = Join-Path $backendRoot $service.Name
    $pomFile = Join-Path $serviceDir "pom.xml"
    $mavenWrapper = Join-Path $serviceDir "mvnw.cmd"

    if (-not (Test-Path $pomFile)) {
        throw "Missing pom.xml for $($service.Name) at $serviceDir"
    }

    if (-not (Test-Path $mavenWrapper)) {
        throw "Missing mvnw.cmd for $($service.Name) at $serviceDir"
    }

    $pidFile = Join-Path $pidRoot "$($service.Name).pid"
    if (Test-Path $pidFile) {
        $existingPidLine = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        $existingPid = if ($null -ne $existingPidLine) { "$existingPidLine".Trim() } else { "" }
        if ($existingPid) {
            $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
            if ($existingProcess) {
                Write-Host "$($service.Name) is already running with PID $existingPid on port $($service.Port)." -ForegroundColor Yellow
                continue
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    $stdoutLog = Join-Path $logRoot "$($service.Name).out.log"
    $stderrLog = Join-Path $logRoot "$($service.Name).err.log"

    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan

    $process = Start-Process `
        -FilePath $mavenWrapper `
        -ArgumentList "spring-boot:run" `
        -WorkingDirectory $serviceDir `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -PassThru

    Set-Content -Path $pidFile -Value $process.Id
}

Write-Host ""
Write-Host "Backend services launched in the background." -ForegroundColor Green
Write-Host "Logs: $logRoot"
Write-Host "PIDs: $pidRoot"
Write-Host "Users:      http://localhost:8081"
Write-Host "Projects:   http://localhost:8082"
Write-Host "Commerce:   http://localhost:8083"
Write-Host "Analytics:  http://localhost:8084"
Write-Host "Billing:    http://localhost:8085"
