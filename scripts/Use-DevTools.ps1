# Dot-source this file to configure this terminal only. No system PATH changes.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (Test-Path (Join-Path $projectRoot '.env')) {
    foreach ($line in Get-Content (Join-Path $projectRoot '.env')) {
        if ($line -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$' -and $Matches[1] -in @('DB_URL','DB_USER','DB_PASSWORD','JAVA_HOME','PORT','COOKIE_SECURE','VITE_API_TARGET','VITE_HOST')) {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
}
if (!$env:JAVA_HOME) {
    $jdk = Get-ChildItem (Join-Path $projectRoot '.local') -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
    elseif (Test-Path 'C:\Program Files\JetBrains\PyCharm Edu 2022.2.2\jbr\bin\javac.exe') {
        $env:JAVA_HOME = 'C:\Program Files\JetBrains\PyCharm Edu 2022.2.2\jbr'
    }
}
if ($env:JAVA_HOME) { $env:PATH = "$env:JAVA_HOME\bin;$env:PATH" }
$mavenBin = Join-Path $projectRoot '.local\apache-maven-3.9.11\bin'
if (Test-Path $mavenBin) { $env:PATH = "$mavenBin;$env:PATH" }
$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
if (Test-Path $mysqlBin) { $env:PATH = "$mysqlBin;$env:PATH" }
