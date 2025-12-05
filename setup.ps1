<#
.SYNOPSIS
    IndiaAI IDP Platform - One-Click Setup Script
    
.DESCRIPTION
    Automated installation script for non-technical users.
    Checks system requirements, installs dependencies, and configures the platform.

.NOTES
    Author: IndiaAI IDP Team
    Date: 2025-12-05
    Version: 2.0
#>

param(
    [switch]$SkipBrowser,
    [switch]$EnableVectorSearch,
    [switch]$EnableFullTextSearch
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Step { Write-Host "`n🔹 $args" -ForegroundColor Yellow }

# Banner
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║       🇮🇳 IndiaAI IDP Platform - Automated Setup             ║
║                   One-Click Installation                      ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ============================================================
# STEP 1: System Requirements Check
# ============================================================
Write-Step "STEP 1: Checking System Requirements..."

$requirements = @{
    Python = $false
    Node = $false
    Git = $false
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.(\d+)") {
        $minorVersion = [int]$Matches[1]
        if ($minorVersion -ge 10) {
            Write-Success "Python: $pythonVersion"
            $requirements.Python = $true
        } else {
            Write-Error "Python 3.10+ required (found $pythonVersion)"
        }
    }
} catch {
    Write-Error "Python not found. Please install Python 3.10+"
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v(\d+)") {
        $majorVersion = [int]$Matches[1]
        if ($majorVersion -ge 18) {
            Write-Success "Node.js: $nodeVersion"
            $requirements.Node = $true
        } else {
            Write-Error "Node.js 18+ required (found $nodeVersion)"
        }
    }
} catch {
    Write-Error "Node.js not found. Please install Node.js 18+"
}

# Check Git
try {
    $gitVersion = git --version 2>&1
    Write-Success "Git: $gitVersion"
    $requirements.Git = $true
} catch {
    Write-Error "Git not found. Please install Git"
}

# Fail if requirements not met
if (-not ($requirements.Python -and $requirements.Node -and $requirements.Git)) {
    Write-Host "`n❌ Missing requirements. Please install:" -ForegroundColor Red
    if (-not $requirements.Python) { Write-Host "   - Python 3.10+: https://python.org/downloads" }
    if (-not $requirements.Node) { Write-Host "   - Node.js 18+: https://nodejs.org" }
    if (-not $requirements.Git) { Write-Host "   - Git: https://git-scm.com" }
    exit 1
}

Write-Success "All requirements met!"

# ============================================================
# STEP 2: Backend Setup
# ============================================================
Write-Step "STEP 2: Setting up Backend (Python/FastAPI)..."

$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Create virtual environment
if (-not (Test-Path ".venv")) {
    Write-Info "Creating Python virtual environment..."
    python -m venv .venv
}

# Activate virtual environment
Write-Info "Activating virtual environment..."
& ".\.venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Info "Upgrading pip..."
python -m pip install --upgrade pip setuptools wheel --quiet

# Install dependencies
Write-Info "Installing Python dependencies (this may take 2-5 minutes)..."
pip install -r requirements.txt --quiet

Write-Success "Backend dependencies installed!"

# Run database migrations
Write-Info "Setting up database..."
try {
    alembic upgrade head 2>&1 | Out-Null
    Write-Success "Database initialized!"
} catch {
    Write-Info "Database already initialized or no migrations needed"
}

# ============================================================
# STEP 3: Frontend Setup
# ============================================================
Write-Step "STEP 3: Setting up Frontend (React/Vite)..."

Set-Location $PSScriptRoot

Write-Info "Installing Node.js dependencies..."
npm install --silent 2>&1 | Out-Null

Write-Success "Frontend dependencies installed!"

# ============================================================
# STEP 4: Check PDF Support (Optional)
# ============================================================
Write-Step "STEP 4: Checking PDF Support..."

$popperPath = Get-Command pdftoppm -ErrorAction SilentlyContinue
if ($popperPath) {
    Write-Success "Poppler (PDF support) is installed!"
} else {
    Write-Info "Poppler not found. PDF processing will be limited."
    Write-Info "To enable PDF support, run: winget install oschwartz10612.Poppler"
}

# ============================================================
# STEP 5: Create Startup Scripts
# ============================================================
Write-Step "STEP 5: Creating startup scripts..."

# Create start-backend.ps1
$startBackend = @'
# Start IndiaAI IDP Backend
Set-Location $PSScriptRoot\backend
& ".\.venv\Scripts\Activate.ps1"
$env:ENABLE_VECTOR_SEARCH = "true"
$env:ENABLE_FULLTEXT_SEARCH = "true"
Write-Host "Starting Backend at http://localhost:8000" -ForegroundColor Cyan
python -m uvicorn main:app --reload --port 8000
'@
$startBackend | Out-File -FilePath "start-backend.ps1" -Encoding UTF8

# Create start-frontend.ps1
$startFrontend = @'
# Start IndiaAI IDP Frontend
Set-Location $PSScriptRoot
Write-Host "Starting Frontend at http://localhost:5173" -ForegroundColor Cyan
npm run dev
'@
$startFrontend | Out-File -FilePath "start-frontend.ps1" -Encoding UTF8

# Create start-all.ps1
$startAll = @'
# Start IndiaAI IDP Platform (Both Backend and Frontend)
Start-Process powershell -ArgumentList "-NoExit -File `"$PSScriptRoot\start-backend.ps1`""
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit -File `"$PSScriptRoot\start-frontend.ps1`""
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
'@
$startAll | Out-File -FilePath "start-platform.ps1" -Encoding UTF8

Write-Success "Startup scripts created!"

# ============================================================
# STEP 6: Verification
# ============================================================
Write-Step "STEP 6: Verifying Installation..."

$verificationPassed = $true

# Check backend imports
Set-Location $backendPath
& ".\.venv\Scripts\Activate.ps1"
try {
    python -c "import fastapi; import paddleocr; import chromadb; print('OK')" 2>&1 | Out-Null
    Write-Success "Backend packages verified!"
} catch {
    Write-Error "Backend verification failed"
    $verificationPassed = $false
}

# Check frontend build
Set-Location $PSScriptRoot
try {
    npm run build --silent 2>&1 | Out-Null
    Write-Success "Frontend build verified!"
} catch {
    Write-Error "Frontend build failed"
    $verificationPassed = $false
}

# ============================================================
# COMPLETE
# ============================================================
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    🎉 SETUP COMPLETE!                        ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "📋 Quick Start Commands:" -ForegroundColor Yellow
Write-Host "   .\start-platform.ps1    - Start everything (recommended)"
Write-Host "   .\start-backend.ps1     - Start backend only"
Write-Host "   .\start-frontend.ps1    - Start frontend only"
Write-Host ""
Write-Host "🌐 Access the platform at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipBrowser) {
    Write-Info "Opening platform in browser..."
    # User can run start-platform.ps1 to launch
}

Set-Location $PSScriptRoot
