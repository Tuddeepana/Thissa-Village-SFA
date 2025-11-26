# Quick Start Script for Windows PowerShell
# Run this after PostgreSQL is installed and database is created

Write-Host "🚀 VinoPOS Backend Quick Setup" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

Write-Host ""

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
Write-Host "   (When prompted, enter migration name like: 'init')" -ForegroundColor Cyan
npm run prisma:migrate

Write-Host ""

# Seed database
Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server, run:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Default admin credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@vinopos.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
