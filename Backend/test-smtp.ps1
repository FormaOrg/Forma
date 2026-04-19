param(
    [string]$EnvFile = ".env",
    [string]$To
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvMap {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $map = @{}
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
            return
        }

        $parts = $_ -split '=', 2
        if ($parts.Length -eq 2) {
            $map[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $map
}

$envPath = if ([System.IO.Path]::IsPathRooted($EnvFile)) {
    $EnvFile
} else {
    Join-Path $PSScriptRoot $EnvFile
}

$vars = Get-EnvMap -Path $envPath

$username = $vars["SPRING_MAIL_USERNAME"]
$password = $vars["SPRING_MAIL_PASSWORD"]
$hostName = $vars["MAIL_HOST"]
$port = [int]$vars["MAIL_PORT"]
$from = if ($vars.ContainsKey("MAIL_FROM") -and $vars["MAIL_FROM"]) {
    $vars["MAIL_FROM"]
} else {
    $username
}
$fromName = if ($vars.ContainsKey("MAIL_FROM_NAME") -and $vars["MAIL_FROM_NAME"]) {
    $vars["MAIL_FROM_NAME"]
} else {
    "Forma"
}

if (-not $To) {
    $To = $from
}

$subject = "Forma SMTP test $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$body = "SMTP credential verification test from Backend/test-smtp.ps1"

try {
    $client = New-Object System.Net.Mail.SmtpClient($hostName, $port)
    $client.EnableSsl = $true
    $client.UseDefaultCredentials = $false
    $client.DeliveryMethod = [System.Net.Mail.SmtpDeliveryMethod]::Network
    $client.Credentials = New-Object System.Net.NetworkCredential($username, $password)

    $message = New-Object System.Net.Mail.MailMessage
    $message.From = New-Object System.Net.Mail.MailAddress($from, $fromName)
    $null = $message.To.Add($To)
    $message.Subject = $subject
    $message.Body = $body
    $client.Send($message)

    Write-Host "SMTP test passed." -ForegroundColor Green
    Write-Host "Name: $fromName"
    Write-Host "User: $username"
    Write-Host "Host: $hostName"
    Write-Host "Port: $port"
    Write-Host "From: $from"
    Write-Host "To:   $To"
} catch {
    $ex = $_.Exception
    Write-Host "SMTP test failed." -ForegroundColor Red
    Write-Host ("Type: {0}" -f $ex.GetType().FullName)
    Write-Host ("Message: {0}" -f $ex.Message)

    if ($ex.InnerException) {
        Write-Host ("Inner type: {0}" -f $ex.InnerException.GetType().FullName)
        Write-Host ("Inner message: {0}" -f $ex.InnerException.Message)
    }

    exit 1
}
