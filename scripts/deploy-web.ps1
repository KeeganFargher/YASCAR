# First-time deployment script for YASCAR website to Cloudflare Pages
# Run this from the repository root

Write-Host "🚀 YASCAR Web - First Time Deploy" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if wrangler is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build shared packages
Write-Host "`n🔧 Building shared packages..." -ForegroundColor Yellow
npm run build --workspace=@yascar/types --if-present

# Build website
Write-Host "`n🏗️ Building website..." -ForegroundColor Yellow
npm run build --workspace=@yascar/web
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build website" -ForegroundColor Red
    exit 1
}

# Deploy to Cloudflare Pages
Write-Host "`n☁️ Deploying to Cloudflare Pages..." -ForegroundColor Yellow
Write-Host "   (You may be prompted to login to Cloudflare)" -ForegroundColor Gray

Push-Location apps/web
npx wrangler pages deploy dist --project-name=yascar-web
$deployResult = $LASTEXITCODE
Pop-Location

if ($deployResult -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "   Your site is live at: https://yascar-web.pages.dev" -ForegroundColor Cyan
    Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to Cloudflare Dashboard → Pages → yascar-web → Custom domains"
    Write-Host "   2. Add your custom domain (e.g., yascar.keeganfargher.co.za)"
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
