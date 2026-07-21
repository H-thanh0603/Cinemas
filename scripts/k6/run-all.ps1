# Run k6 load tests via Docker against local Next.js
# Usage: pwsh scripts/k6/run-all.ps1
# Requires: Docker, app on :3000, LOADTEST_SECRET in .env

$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://host.docker.internal:3000" }
$Secret = if ($env:LOADTEST_SECRET) { $env:LOADTEST_SECRET } else { "loadtest-dev-secret" }
$ResultsDir = Join-Path $PSScriptRoot "results"
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

function Run-K6 {
  param(
    [string]$Name,
    [string]$Script,
    [int]$Vus,
    [string]$Duration,
    [string]$BookRatio = "0"
  )
  Write-Host "`n======== $Name VUs=$Vus duration=$Duration ========" -ForegroundColor Cyan
  $scriptPath = Join-Path $PSScriptRoot $Script
  $outJson = Join-Path $ResultsDir "$Name-vus$Vus.json"
  $outTxt = Join-Path $ResultsDir "$Name-vus$Vus.txt"

  $envArgs = @(
    "-e", "BASE_URL=$BaseUrl",
    "-e", "LOADTEST_SECRET=$Secret",
    "-e", "VUS=$Vus",
    "-e", "DURATION=$Duration",
    "-e", "BOOK_RATIO=$BookRatio"
  )

  # Mount script; use host.docker.internal for Windows Docker Desktop
  docker run --rm `
    @envArgs `
    -v "${scriptPath}:/scripts/test.js:ro" `
    grafana/k6:0.54.0 run /scripts/test.js `
    2>&1 | Tee-Object -FilePath $outTxt

  if (Test-Path (Join-Path $PSScriptRoot "results-last.json")) {
    Copy-Item (Join-Path $PSScriptRoot "results-last.json") $outJson -Force -ErrorAction SilentlyContinue
  }
}

# Health check
try {
  $h = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 10
  Write-Host "App OK status=$($h.StatusCode)"
} catch {
  Write-Host "App not reachable on localhost:3000 — start npm run start first" -ForegroundColor Red
  exit 1
}

# Smoke secret
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3000/api/loadtest/scenario" `
    -Headers @{ "x-loadtest-secret" = $Secret } -UseBasicParsing -TimeoutSec 15
  Write-Host "Loadtest API OK: $($r.Content.Substring(0, [Math]::Min(120, $r.Content.Length)))..."
} catch {
  Write-Host "Loadtest API failed — set LOADTEST_SECRET=$Secret in .env and restart app" -ForegroundColor Red
  exit 1
}

# Ladder: 100 → 500 → 1000
Run-K6 -Name "browse" -Script "browse.js" -Vus 100 -Duration "30s"
Run-K6 -Name "mixed" -Script "mixed.js" -Vus 100 -Duration "45s" -BookRatio "0.1"

Run-K6 -Name "browse" -Script "browse.js" -Vus 500 -Duration "30s"
Run-K6 -Name "mixed" -Script "mixed.js" -Vus 500 -Duration "45s" -BookRatio "0.1"

Run-K6 -Name "browse" -Script "browse.js" -Vus 1000 -Duration "30s"
Run-K6 -Name "mixed" -Script "mixed.js" -Vus 1000 -Duration "45s" -BookRatio "0.05"

Write-Host "`nResults in $ResultsDir" -ForegroundColor Green
