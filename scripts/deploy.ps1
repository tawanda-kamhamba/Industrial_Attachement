# Build the React frontend and copy output into app/ for Apache (XAMPP).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $root "frontend"
$app = Join-Path $root "app"
$htaccess = Join-Path $app ".htaccess"
$htaccessBackup = $null

if (Test-Path $htaccess) {
  $htaccessBackup = Get-Content $htaccess -Raw
}

Push-Location $frontend
npm run build
Pop-Location

$dist = Join-Path $frontend "dist"
if (-not (Test-Path $dist)) {
  throw "Build failed: dist/ not found"
}

if (Test-Path $app) {
  Get-ChildItem $app -Force | Remove-Item -Recurse -Force
} else {
  New-Item -ItemType Directory -Path $app | Out-Null
}

Copy-Item -Path (Join-Path $dist "*") -Destination $app -Recurse -Force

if ($htaccessBackup) {
  Set-Content -Path $htaccess -Value $htaccessBackup -NoNewline
} else {
  @"
# SPA fallback for client-side routing
RewriteEngine On
RewriteBase /iasms/app/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
"@ | Set-Content -Path $htaccess
}

Write-Host "Deployed to $app"
