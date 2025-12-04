# Local Security Scan Script (PowerShell)
# Run this before committing to catch security issues early

$ErrorActionPreference = "Continue"
$FAILED = $false

Write-Host ""
Write-Host "🔒 IndiaAI-IDP-Platform Security Scan" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

function Print-Status {
    param($success, $message)
    if ($success) {
        Write-Host "✅ $message" -ForegroundColor Green
    } else {
        Write-Host "❌ $message" -ForegroundColor Red
        $script:FAILED = $true
    }
}

# Frontend Security Checks
Write-Host "📦 Frontend Security Checks" -ForegroundColor Yellow
Write-Host "-----------------------------------"

# Check for React Server Components vulnerability
Write-Host "🔍 Checking for CVE-2025-55182 vulnerable packages..."
$rscCheck = npm ls react-server-dom-webpack react-server-dom-parcel react-server-dom-turbopack 2>$null
if ($rscCheck -match "react-server-dom") {
    Write-Host "❌ CRITICAL: Vulnerable React Server Components packages found!" -ForegroundColor Red
    $FAILED = $true
} else {
    Write-Host "✅ No vulnerable RSC packages detected" -ForegroundColor Green
}

# NPM Audit
Write-Host ""
Write-Host "🔍 Running npm audit..."
$auditResult = npm audit --audit-level=high 2>&1
if ($LASTEXITCODE -eq 0) {
    Print-Status $true "npm audit passed"
} else {
    Print-Status $false "npm audit found vulnerabilities"
    Write-Host $auditResult
}

# ESLint
Write-Host ""
Write-Host "🔍 Running ESLint..."
$lintResult = npm run lint --silent 2>&1
if ($LASTEXITCODE -eq 0) {
    Print-Status $true "ESLint passed"
} else {
    Print-Status $false "ESLint found issues"
}

# TypeScript Check
Write-Host ""
Write-Host "🔍 Running TypeScript type check..."
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Print-Status $true "TypeScript check passed"
} else {
    Print-Status $false "TypeScript check failed"
}

# Build Test
Write-Host ""
Write-Host "🔍 Testing production build..."
$buildResult = npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Print-Status $true "Build successful"
} else {
    Print-Status $false "Build failed"
}

# Backend Security Checks (if Python is available)
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "📦 Backend Security Checks" -ForegroundColor Yellow
    Write-Host "-----------------------------------"
    
    Push-Location backend
    
    # Check if safety is available
    $safetyInstalled = python -c "import safety" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Installing safety for dependency scanning..." -ForegroundColor Yellow
        pip install safety --quiet
    }
    
    # Safety check
    Write-Host "🔍 Running Safety check..."
    $safetyResult = safety check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Print-Status $true "Safety check passed"
    } else {
        Print-Status $false "Safety found vulnerabilities"
        Write-Host $safetyResult
    }
    
    # Check if bandit is available
    $banditInstalled = Get-Command bandit -ErrorAction SilentlyContinue
    if (-not $banditInstalled) {
        Write-Host "⚠️  Installing bandit for security linting..." -ForegroundColor Yellow
        pip install bandit --quiet
    }
    
    # Bandit check
    Write-Host ""
    Write-Host "🔍 Running Bandit security scan..."
    $banditResult = bandit -r app/ -ll 2>&1
    if ($LASTEXITCODE -eq 0) {
        Print-Status $true "Bandit scan passed"
    } else {
        Print-Status $false "Bandit found security issues"
    }
    
    Pop-Location
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
if (-not $FAILED) {
    Write-Host "🎉 All security checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some security checks failed. Please review the output above." -ForegroundColor Red
    exit 1
}
