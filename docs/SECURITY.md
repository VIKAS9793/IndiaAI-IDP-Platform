# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of IndiaAI-IDP-Platform seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Report via GitHub Security Advisories

1. Go to the [Security tab](../../security)
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form

### 3. What to Include

Please include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)
- Your contact information (optional)

### 4. Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

## Security Measures

### Automated Security Scanning

This project uses:
- **Dependabot:** Automated dependency updates
- **CodeQL:** Advanced semantic code analysis
- **npm audit:** JavaScript dependency vulnerability scanning
- **Safety:** Python dependency vulnerability scanning
- **Bandit:** Python security linting

### CI/CD Security Checks

Every commit and pull request is automatically scanned for:
- Known vulnerabilities in dependencies
- Security issues in code
- Type safety violations
- Code quality issues

## Known Vulnerabilities Status

### CVE-2025-55182 & CVE-2025-66478

**Status:** ✅ **NOT AFFECTED**

This project is not vulnerable to the critical React Server Components RCE vulnerabilities because:
- Uses React only for client-side rendering
- Does not use React Server Components
- Does not have `react-server-dom-*` packages
- Backend is Python FastAPI (not Node.js)

See [security audit report](docs/security-audit-2025-12-04.md) for details.

## Security Best Practices

When contributing:
1. Never commit secrets or API keys
2. Keep dependencies up to date
3. Follow secure coding practices
4. Run security scans locally before submitting PRs
5. Review Dependabot alerts promptly

## Disclosure Policy

- Vulnerabilities will be disclosed publicly after a fix is released
- Credit will be given to security researchers (if desired)
- A security advisory will be published for critical issues

## Contact

For urgent security concerns, contact: [Maintain contact information]

---

**Last Updated:** December 4, 2025

---

## Quick Reference

### Security Commands

```bash
# Full security scan (Windows)
npm run security:scan:win

# Full security scan (Unix/Linux/macOS)  
npm run security:scan:unix

# Quick dependency audit
npm run security:audit

# Check for CVE-2025-55182 vulnerable packages
npm run security:check-rsc
```

### What Gets Checked Automatically

**GitHub Actions CI/CD:**
- npm audit (dependency vulnerabilities)
- ESLint (code quality)
- TypeScript type checking
- Production build verification
- Python security (Safety, Bandit)
- CodeQL analysis
- CVE-2025-55182 specific check

**Dependabot:**
- Weekly dependency update PRs
- Automated security vulnerability alerts

### Files Created

- `.github/workflows/ci-security.yml` - Main CI/CD pipeline
- `.github/dependabot.yml` - Dependency monitoring
- `scripts/security-scan.ps1` - Windows security script
- `scripts/security-scan.sh` - Unix security script
- Updated `package.json` with security scripts

