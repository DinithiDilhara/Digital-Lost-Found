. "$PSScriptRoot/Use-DevTools.ps1"
if (!(Get-Command java -ErrorAction SilentlyContinue) -or !(Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw 'JDK 17+ and Maven are required. See README.md.'
}
if (!$env:DB_USER -or !$env:DB_PASSWORD) { throw 'Set DB_USER and DB_PASSWORD in the root .env file first.' }
$backendPort = if ($env:PORT) { [int]$env:PORT } else { 5000 }
$portProbe = [System.Net.Sockets.TcpClient]::new()
try {
    $attempt = $portProbe.ConnectAsync('127.0.0.1', $backendPort)
    try { $null = $attempt.Wait(500) } catch { }
    if ($portProbe.Connected) { throw "Port $backendPort is in use. Stop the existing backend before rebuilding/restarting." }
} finally { $portProbe.Dispose() }
Push-Location (Join-Path $projectRoot 'backend')
try {
    java -version
    mvn -version
    mvn -B -ntp "-Dmaven.repo.local=$projectRoot/.local/m2" package
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
    # A stable runtime copy prevents a later Maven build from replacing an open JAR.
    $runtimeJar = Join-Path $projectRoot '.local/backend-running.jar'
    Copy-Item -LiteralPath 'target/digital-lost-found-backend-1.0-SNAPSHOT.jar' -Destination $runtimeJar
    java -jar $runtimeJar
} finally { Pop-Location }
