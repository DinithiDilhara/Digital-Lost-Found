. "$PSScriptRoot/Use-DevTools.ps1"
Push-Location $projectRoot
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    npm run dev
} finally { Pop-Location }
