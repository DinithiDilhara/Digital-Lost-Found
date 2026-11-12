# Portable, project-local Maven. Does not change machine/user PATH.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$toolsDir = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Force $toolsDir | Out-Null
$archive = Join-Path $toolsDir 'apache-maven-3.9.11-bin.zip'
$checksum = "$archive.sha512"
$base = 'https://archive.apache.org/dist/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.zip'
if (!(Test-Path (Join-Path $toolsDir 'apache-maven-3.9.11/bin/mvn.cmd'))) {
    Invoke-WebRequest -Uri $base -OutFile $archive
    Invoke-WebRequest -Uri "$base.sha512" -OutFile $checksum
    $expectedHash = (Get-Content $checksum -Raw).Trim().Split(' ')[0]
    if ((Get-FileHash $archive -Algorithm SHA512).Hash -ne $expectedHash) { throw 'Maven checksum mismatch.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $toolsDir
}
. "$PSScriptRoot/Use-DevTools.ps1"
mvn -version
if ($LASTEXITCODE -ne 0) { throw 'Maven requires a compatible JAVA_HOME. See README.md.' }
