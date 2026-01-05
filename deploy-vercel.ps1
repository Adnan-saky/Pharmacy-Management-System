# Quick Start: Deploy to Vercel

Write-Host "🚀 Pharmacy Management System - Vercel Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Vercel:" -ForegroundColor White
Write-Host "   vercel login" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy your project:" -ForegroundColor White
Write-Host "   vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Add environment variables (in Vercel Dashboard or CLI):" -ForegroundColor White
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host "   - GOOGLE_SHEETS_SPREADSHEET_ID" -ForegroundColor Gray
Write-Host "   - GOOGLE_SERVICE_ACCOUNT_EMAIL" -ForegroundColor Gray
Write-Host "   - GOOGLE_PRIVATE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy to production:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to proceed
$response = Read-Host "Do you want to login to Vercel now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    vercel login
}
