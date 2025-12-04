#!/bin/bash
# Local Security Scan Script
# Run this before committing to catch security issues early

set -e

echo "🔒 IndiaAI-IDP-Platform Security Scan"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED=1
    fi
}

# Frontend Security Checks
echo "📦 Frontend Security Checks"
echo "-----------------------------------"

# Check for React Server Components vulnerability
echo "🔍 Checking for CVE-2025-55182 vulnerable packages..."
if npm ls react-server-dom-webpack react-server-dom-parcel react-server-dom-turbopack 2>/dev/null | grep -q "react-server-dom"; then
    echo -e "${RED}❌ CRITICAL: Vulnerable React Server Components packages found!${NC}"
    FAILED=1
else
    echo -e "${GREEN}✅ No vulnerable RSC packages detected${NC}"
fi

# NPM Audit
echo ""
echo "🔍 Running npm audit..."
if npm audit --audit-level=high; then
    print_status 0 "npm audit passed"
else
    print_status 1 "npm audit found vulnerabilities"
fi

# ESLint
echo ""
echo "🔍 Running ESLint..."
if npm run lint --silent; then
    print_status 0 "ESLint passed"
else
    print_status 1 "ESLint found issues"
fi

# TypeScript Check
echo ""
echo "🔍 Running TypeScript type check..."
if npx tsc --noEmit; then
    print_status 0 "TypeScript check passed"
else
    print_status 1 "TypeScript check failed"
fi

# Build Test
echo ""
echo "🔍 Testing production build..."
if npm run build > /dev/null 2>&1; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed"
fi

# Backend Security Checks (if Python is available)
if command -v python3 &> /dev/null; then
    echo ""
    echo "📦 Backend Security Checks"
    echo "-----------------------------------"
    
    cd backend
    
    # Check if safety is installed
    if ! python3 -c "import safety" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Installing safety for dependency scanning...${NC}"
        pip3 install safety --quiet
    fi
    
    # Safety check
    echo "🔍 Running Safety check..."
    if safety check; then
        print_status 0 "Safety check passed"
    else
        print_status 1 "Safety found vulnerabilities"
    fi
    
    # Check if bandit is installed
    if ! command -v bandit &> /dev/null; then
        echo -e "${YELLOW}⚠️  Installing bandit for security linting...${NC}"
        pip3 install bandit --quiet
    fi
    
    # Bandit check
    echo ""
    echo "🔍 Running Bandit security scan..."
    if bandit -r app/ -ll; then
        print_status 0 "Bandit scan passed"
    else
        print_status 1 "Bandit found security issues"
    fi
    
    cd ..
fi

# Summary
echo ""
echo "====================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some security checks failed. Please review the output above.${NC}"
    exit 1
fi
