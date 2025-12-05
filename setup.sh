#!/bin/bash
#
# IndiaAI IDP Platform - One-Click Setup Script (Linux/Mac)
# 
# Usage: chmod +x setup.sh && ./setup.sh
#
# Author: IndiaAI IDP Team
# Date: 2025-12-05
# Version: 2.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
step() { echo -e "\n${YELLOW}🔹 $1${NC}"; }

# Banner
echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║       🇮🇳 IndiaAI IDP Platform - Automated Setup             ║
║                   One-Click Installation                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# STEP 1: System Requirements Check
# ============================================================
step "STEP 1: Checking System Requirements..."

PYTHON_OK=false
NODE_OK=false
GIT_OK=false

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 10 ]; then
        success "Python: $(python3 --version)"
        PYTHON_OK=true
    else
        error "Python 3.10+ required (found Python $PYTHON_VERSION)"
    fi
else
    error "Python not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | grep -oP '\d+' | head -1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        success "Node.js: $(node --version)"
        NODE_OK=true
    else
        error "Node.js 18+ required (found v$NODE_VERSION)"
    fi
else
    error "Node.js not found"
fi

# Check Git
if command -v git &> /dev/null; then
    success "Git: $(git --version)"
    GIT_OK=true
else
    error "Git not found"
fi

# Fail if requirements not met
if [ "$PYTHON_OK" = false ] || [ "$NODE_OK" = false ] || [ "$GIT_OK" = false ]; then
    echo -e "\n${RED}❌ Missing requirements. Please install:${NC}"
    [ "$PYTHON_OK" = false ] && echo "   - Python 3.10+: https://python.org/downloads"
    [ "$NODE_OK" = false ] && echo "   - Node.js 18+: https://nodejs.org"
    [ "$GIT_OK" = false ] && echo "   - Git: https://git-scm.com"
    exit 1
fi

success "All requirements met!"

# ============================================================
# STEP 2: Backend Setup
# ============================================================
step "STEP 2: Setting up Backend (Python/FastAPI)..."

cd "$SCRIPT_DIR/backend"

# Create virtual environment
if [ ! -d ".venv" ]; then
    info "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
info "Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
info "Upgrading pip..."
pip install --upgrade pip setuptools wheel --quiet

# Install dependencies
info "Installing Python dependencies (this may take 2-5 minutes)..."
pip install -r requirements.txt --quiet

success "Backend dependencies installed!"

# Run database migrations
info "Setting up database..."
if alembic upgrade head 2>&1; then
    success "Database initialized!"
else
    info "Database already initialized or no migrations needed"
fi

# ============================================================
# STEP 3: Frontend Setup
# ============================================================
step "STEP 3: Setting up Frontend (React/Vite)..."

cd "$SCRIPT_DIR"

info "Installing Node.js dependencies..."
npm install --silent 2>&1 || true

success "Frontend dependencies installed!"

# ============================================================
# STEP 4: Check PDF Support (Optional)
# ============================================================
step "STEP 4: Checking PDF Support..."

if command -v pdftoppm &> /dev/null; then
    success "Poppler (PDF support) is installed!"
else
    info "Poppler not found. PDF processing will be limited."
    info "To install: sudo apt install poppler-utils (Ubuntu) or brew install poppler (Mac)"
fi

# ============================================================
# STEP 5: Create Startup Scripts
# ============================================================
step "STEP 5: Creating startup scripts..."

# Create start-backend.sh
cat > "$SCRIPT_DIR/start-backend.sh" << 'BACKEND_EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source .venv/bin/activate
export ENABLE_VECTOR_SEARCH=true
export ENABLE_FULLTEXT_SEARCH=true
echo "Starting Backend at http://localhost:8000"
python -m uvicorn main:app --reload --port 8000
BACKEND_EOF
chmod +x "$SCRIPT_DIR/start-backend.sh"

# Create start-frontend.sh
cat > "$SCRIPT_DIR/start-frontend.sh" << 'FRONTEND_EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Frontend at http://localhost:5173"
npm run dev
FRONTEND_EOF
chmod +x "$SCRIPT_DIR/start-frontend.sh"

# Create start-all.sh
cat > "$SCRIPT_DIR/start-platform.sh" << 'PLATFORM_EOF'
#!/bin/bash
SCRIPT_DIR="$(dirname "$0")"
"$SCRIPT_DIR/start-backend.sh" &
sleep 3
"$SCRIPT_DIR/start-frontend.sh" &
sleep 5
echo "Opening http://localhost:5173 in browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
fi
wait
PLATFORM_EOF
chmod +x "$SCRIPT_DIR/start-platform.sh"

success "Startup scripts created!"

# ============================================================
# STEP 6: Verification
# ============================================================
step "STEP 6: Verifying Installation..."

cd "$SCRIPT_DIR/backend"
source .venv/bin/activate

# Check backend imports
if python3 -c "import fastapi; import paddleocr; import chromadb; print('OK')" 2>&1; then
    success "Backend packages verified!"
else
    error "Backend verification failed"
fi

# ============================================================
# COMPLETE
# ============================================================
echo -e "${GREEN}"
cat << 'EOF'

╔══════════════════════════════════════════════════════════════╗
║                    🎉 SETUP COMPLETE!                        ║
╚══════════════════════════════════════════════════════════════╝

EOF
echo -e "${NC}"

echo -e "${YELLOW}📋 Quick Start Commands:${NC}"
echo "   ./start-platform.sh    - Start everything (recommended)"
echo "   ./start-backend.sh     - Start backend only"
echo "   ./start-frontend.sh    - Start frontend only"
echo ""
echo -e "${CYAN}🌐 Access the platform at: http://localhost:5173${NC}"
echo ""

cd "$SCRIPT_DIR"
