# PowerShell script to install PostgreSQL for testing
# Run this script as Administrator

Write-Host "Installing PostgreSQL via winget..." -ForegroundColor Cyan

# Check if winget is available
try {
    $wingetVersion = winget --version
    Write-Host "Winget version: $wingetVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Winget is not installed. Please install Windows Package Manager." -ForegroundColor Red
    Write-Host "Download from: https://github.com/microsoft/winget-cli/releases" -ForegroundColor Yellow
    exit 1
}

# Install PostgreSQL
Write-Host "`nInstalling PostgreSQL 15..." -ForegroundColor Cyan
winget install --id PostgreSQL.PostgreSQL.15 --accept-source-agreements --accept-package-agreements

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PostgreSQL installed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your terminal/IDE" -ForegroundColor Yellow
    Write-Host "2. Start PostgreSQL service (should auto-start)" -ForegroundColor Yellow
    Write-Host "3. Run: pnpm test" -ForegroundColor Yellow
    Write-Host "`nDefault credentials:" -ForegroundColor Cyan
    Write-Host "  Username: postgres" -ForegroundColor White
    Write-Host "  Password: <you set during install>" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "`nIf the password is different from 'postgres', update .env file:" -ForegroundColor Cyan
    Write-Host "  TEST_DB_PASSWORD=your_password" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to install PostgreSQL" -ForegroundColor Red
    Write-Host "Please try manual installation from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}
