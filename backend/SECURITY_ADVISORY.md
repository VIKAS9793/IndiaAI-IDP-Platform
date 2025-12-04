# Backend Dependency Security Advisory

**Date:** December 4, 2025  
**Status:** 9 vulnerabilities detected by Dependabot

## 🚨 Critical Vulnerabilities

### 1. PaddlePaddle (Multiple CVEs) - CRITICAL

**Current Version:** 2.6.0  
**Vulnerable to:**
- CVE-2024-0917: Remote Code Execution (CVSS 9.4)
- CVE-2024-1603: Arbitrary file read via paddle.vision.ops.read_file (CVSS 7.5)
- CVE-2024-0521: Command injection via URL parameter
- CVE-2024-0818: Arbitrary file overwrite via path traversal  
- CVE-2024-0817: Command injection in IrGraph.draw method

**Recommended Fix:** Upgrade to PaddlePaddle ≥3.0.0 (latest stable: 3.2.0)

**Action Required:**
```bash
pip install --upgrade paddlepaddle>=3.0.0
```

### 2. Pillow - CRITICAL

**Current Version:** 10.1.0  
**Vulnerable to:**
- Arbitrary Code Execution
- Buffer overflow vulnerability

**Recommended Fix:** Upgrade to Pillow ≥10.3.0

**Action Required:**
```bash
pip install --upgrade Pillow>=10.3.0
```

### 3. python-multipart - HIGH

**Current Version:** 0.0.6  
**Vulnerable to:**
- Content-Type Header ReDoS
- DoS via malformed multipart/form-data boundary

**Recommended Fix:** Upgrade to python-multipart ≥0.0.9

**Action Required:**
```bash
pip install --upgrade python-multipart>=0.0.9
```

## ⚠️ Impact Assessment

### For Development/Local Environment:
- **Risk:** MEDIUM (controlled environment, no external exposure)
- **Recommendation:** Upgrade during next maintenance window

### For Production Deployment:
- **Risk:** CRITICAL (publicly accessible endpoints)
- **Recommendation:** **UPGRADE IMMEDIATELY** before production deployment

## 🔧 Remediation Steps

### Option 1: Immediate Upgrade (Recommended)

Update `backend/requirements.txt`:

```python
# Before
paddlepaddle==2.6.0
Pillow==10.1.0
python-multipart==0.0.6

# After  
paddlepaddle==3.0.0  # or latest 3.x
Pillow==10.3.0
python-multipart==0.0.9
```

Then run:
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Option 2: Accept Risk (For Isolated Dev Only)

If this is strictly for local development with no network exposure:

1. Document the risk acceptance
2. Add to `.gitignore` to prevent production deployment
3. Set up isolated environment (air-gapped, no internet)
4. Use only with trusted, non-sensitive documents

**⚠️ NOT RECOMMENDED for any production or shared environment**

## 📋 Testing After Upgrade

After upgrading, verify OCR functionality:

```bash
# Run backend tests
cd backend
pytest tests/

# Test OCR manually
python -c "from app.services.ocr_service import OCRService; print('OCR OK')"
```

## 🛡️ Long-term Security Practices

1. **Enable Dependabot** in GitHub Settings → Security
2. **Review dependency updates** weekly
3. **Run security scans** before every release:
   ```bash
   cd backend
   safety check
   bandit -r app/
   ```

4. **Pin versions** in production but allow patches:
   ```python
   paddlepaddle>=3.0.0,<4.0.0  # Allow 3.x patches, block 4.x
   ```

## 📊 Risk Matrix

| Vulnerability | Severity | Exploitability | Impact | Risk Score |
|---------------|----------|----------------|---------|------------|
| PaddlePaddle RCE (CVE-2024-0917) | Critical | Medium | Critical | **9.4/10** |
| Pillow Code Execution | Critical | Medium | High | **9.0/10** |
| PaddlePaddle Path Traversal | Critical | High | High | **8.5/10** |
| python-multipart ReDoS | High | High | Medium | **7.5/10** |
| Pillow Buffer Overflow | High | Low | High | **7.0/10** |

## ✅ Acceptance Criteria

Before marking as resolved:
- [ ] All packages updated to non-vulnerable versions
- [ ] Tests passing with new versions
- [ ] OCR functionality verified
- [ ] No new vulnerabilities introduced
- [ ] Documentation updated

---

**Next Steps:**
1. Review this advisory
2. Choose remediation option
3. Update dependencies
4. Test thoroughly
5. Update this document with resolution

**Owner:** Development Team  
**Reviewer:** Security Lead  
**Due Date:** Before production deployment
