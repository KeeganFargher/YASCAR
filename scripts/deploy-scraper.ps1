# YASCAR Scraper Deployment Script
# Run from the repository root: .\scripts\deploy-scraper.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== YASCAR Scraper Deployment ===" -ForegroundColor Cyan

# Check if wrangler is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npx not found. Make sure Node.js is installed." -ForegroundColor Red
    exit 1
}

Set-Location "$PSScriptRoot\..\apps\scraper"

# Step 1: Check login
Write-Host "`n[1/6] Checking Cloudflare login..." -ForegroundColor Yellow
$whoami = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Opening browser..." -ForegroundColor Yellow
    npx wrangler login
}
Write-Host "Logged in!" -ForegroundColor Green

# Step 2: Create D1 database (idempotent - will fail if exists, that's ok)
Write-Host "`n[2/6] Creating D1 database..." -ForegroundColor Yellow
$d1Result = npx wrangler d1 create yascar-codes 2>&1 | Out-String
if ($d1Result -match "database_id\s*=\s*`"([^`"]+)`"") {
    $dbId = $Matches[1]
    Write-Host "Created database with ID: $dbId" -ForegroundColor Green
    Write-Host ">>> UPDATE wrangler.toml with this database_id <<<" -ForegroundColor Magenta
} elseif ($d1Result -match "already exists") {
    Write-Host "Database already exists" -ForegroundColor Green
} else {
    Write-Host $d1Result
}

# Step 3: Apply schema
Write-Host "`n[3/6] Applying D1 schema..." -ForegroundColor Yellow
npx wrangler d1 execute yascar-codes --remote --file=schema.sql --yes
Write-Host "Schema applied!" -ForegroundColor Green

# Step 4: Create queue
Write-Host "`n[4/6] Creating queue..." -ForegroundColor Yellow
$queueResult = npx wrangler queues create shift-codes-queue 2>&1
if ($queueResult -match "already exists") {
    Write-Host "Queue already exists" -ForegroundColor Green
} else {
    Write-Host "Queue created!" -ForegroundColor Green
}

# Step 5: Create R2 bucket
Write-Host "`n[5/6] Creating R2 bucket..." -ForegroundColor Yellow
$r2Result = npx wrangler r2 bucket create shift 2>&1
if ($r2Result -match "already exists") {
    Write-Host "Bucket already exists" -ForegroundColor Green
} else {
    Write-Host "Bucket created!" -ForegroundColor Green
}

# Step 6: Deploy worker
Write-Host "`n[6/6] Deploying worker..." -ForegroundColor Yellow
npx wrangler deploy

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "  1. Update wrangler.toml with database_id if prompted above"
Write-Host "  2. Enable public access on R2 bucket 'shift' in dashboard"
Write-Host "  3. (Optional) Add custom domain to R2 bucket"
