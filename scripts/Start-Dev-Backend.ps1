$ErrorActionPreference = 'Stop'

$port = if ($env:PORT) { [int]$env:PORT } else { 5000 }
$healthUrl = "http://127.0.0.1:$port/api/health"
$projectRoot = Split-Path $PSScriptRoot -Parent

try {
    $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
    if ($health.StatusCode -eq 200) {
        Write-Host "Reusing the existing Digital Lost & Found backend on port $port."
        while ($true) {
            Start-Sleep -Seconds 2
            try {
                $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
                if ($health.StatusCode -ne 200) { break }
            } catch {
                break
            }
        }
        throw "The existing Digital Lost & Found backend on port $port is no longer healthy."
    }
} catch {
    if ($_.Exception.Message -like 'The existing Digital Lost & Found backend*') { throw }
    # No healthy application is listening yet; start the backend below.
}

$probe = [System.Net.Sockets.TcpClient]::new()
try {
    $attempt = $probe.ConnectAsync('127.0.0.1', $port)
    try { $null = $attempt.Wait(500) } catch { }
    if ($probe.Connected) {
        throw "Port $port is already in use by another service. Stop it or set PORT to an unused port."
    }
} finally {
    $probe.Dispose()
}

Push-Location (Join-Path $projectRoot 'backend')
try {
    mvn -q compile dependency:build-classpath "-Dmdep.outputFile=target\runtime-classpath.txt"
    if ($LASTEXITCODE -ne 0) { throw 'Backend compilation failed.' }
    $deps = Get-Content 'target\runtime-classpath.txt'
    java -cp ('target\classes;' + $deps) com.digitallostfound.server.Server
} finally {
    Pop-Location
}
