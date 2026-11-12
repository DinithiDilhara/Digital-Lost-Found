param([string]$ConfigFile)
. "$PSScriptRoot/Use-DevTools.ps1"
if ($ConfigFile) {
    foreach ($line in Get-Content -LiteralPath $ConfigFile) {
        if ($line -match '^(DB_URL|DB_USER|DB_PASSWORD)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
}
if (!$env:DB_USER -or !$env:DB_PASSWORD) { throw 'Set DB_USER and DB_PASSWORD in .env first.' }
if (!$env:DB_URL) { $env:DB_URL = 'jdbc:mysql://127.0.0.1:3306/digital_lost_found' }
if ($env:DB_URL -notmatch '^jdbc:mysql://([^/:?]+):(\d+)/([A-Za-z0-9_]+)(?:\?.*)?$') {
    throw 'DB_URL must contain an explicit host, port and database name (letters, digits, underscores).'
}
$dbHost = $Matches[1]; $dbPort = $Matches[2]; $dbName = $Matches[3]
if (!(Get-Command mysql -ErrorAction SilentlyContinue)) { throw 'Add MySQL Server bin to PATH first.' }
$previousMysqlPassword = $env:MYSQL_PWD
try {
    # Password is passed only in this child process environment, never command arguments or logs.
    $env:MYSQL_PWD = $env:DB_PASSWORD
    $schema = (Get-Content (Join-Path $projectRoot 'database/schema.sql') -Raw).Replace('digital_lost_found', $dbName)
    $schema | mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" --default-character-set=utf8mb4
    if ($LASTEXITCODE -ne 0) { throw 'Could not connect to MySQL or apply base schema. No tables were dropped.' }
    Get-Content (Join-Path $projectRoot 'database/migrations/001_shared_reports_and_sessions.sql') -Raw |
        mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" "--database=$dbName" --default-character-set=utf8mb4 --batch | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed. Check schema compatibility and rerun after fixing the cause.' }
    Get-Content (Join-Path $projectRoot 'database/migrations/002_private_messaging.sql') -Raw |
        mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" "--database=$dbName" --default-character-set=utf8mb4 --batch | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Private messaging migration failed. Check schema compatibility and rerun after fixing the cause.' }
    $claimsMigration = Join-Path $projectRoot 'database/migrations/003_found_claims.sql'
    if (Test-Path -LiteralPath $claimsMigration) {
        Get-Content $claimsMigration -Raw |
            mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" "--database=$dbName" --default-character-set=utf8mb4 --batch | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Found-claims migration failed. Check schema compatibility and rerun after fixing the cause.' }
    }
    Get-Content (Join-Path $projectRoot 'database/migrations/004_notifications.sql') -Raw |
        mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" "--database=$dbName" --default-character-set=utf8mb4 --batch | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Notifications migration failed. Check schema compatibility and rerun after fixing the cause.' }
    mysql --protocol=TCP "--host=$dbHost" "--port=$dbPort" "--user=$env:DB_USER" "--database=$dbName" --execute='SELECT DATABASE(), VERSION(); SHOW TABLES; SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS lost_reports FROM lost_items; SELECT COUNT(*) AS found_reports FROM found_items;'
    if ($LASTEXITCODE -ne 0) { throw 'Database verification failed.' }
} finally { $env:MYSQL_PWD = $previousMysqlPassword }
