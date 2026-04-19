$ErrorActionPreference = "Stop"

$repoRoot = "G:\Coding\Forma"
$backendRoot = Join-Path $repoRoot "Backend"
$serviceDir = Join-Path $backendRoot "service-projets"
$runRoot = Join-Path $repoRoot ".run"
$pidFile = Join-Path $runRoot "pids\service-projets.pid"
$stdoutLog = Join-Path $runRoot "logs\service-projets.out.log"
$stderrLog = Join-Path $runRoot "logs\service-projets.err.log"
$sharedEnvFile = Join-Path $backendRoot "service-utilisateurs\.env"
$mavenWrapper = Join-Path $serviceDir "mvnw.cmd"

if (Test-Path $sharedEnvFile) {
    Get-Content $sharedEnvFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $sep = $line.IndexOf("=")
        if ($sep -lt 1) { return }
        $name = $line.Substring(0, $sep).Trim()
        $value = $line.Substring($sep + 1).Trim().Trim('"')
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

if (Test-Path $pidFile) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }

$process = Start-Process `
    -FilePath $mavenWrapper `
    -ArgumentList "spring-boot:run" `
    -WorkingDirectory $serviceDir `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

Set-Content -Path $pidFile -Value $process.Id
Write-Host "service-projets starting, PID $($process.Id)"
