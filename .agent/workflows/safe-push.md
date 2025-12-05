---
description: Safe git push workflow - verify branch before pushing
---

# Safe Git Push Workflow

**Purpose:** Prevent accidental pushes to protected branches (main, v2.0-dev)

## Pre-Push Checklist

### 1. Verify Current Branch
```bash
git branch --show-current
```
// turbo

**Expected:** Should show a feature branch like `feature/vector-search`, NOT:
- ❌ `main`
- ❌ `master`  
- ⚠️ `v2.0-dev` (only for merges)

### 2. Review Pending Commits
```bash
git log --oneline origin/HEAD..HEAD
```
// turbo

### 3. If on WRONG branch, abort and switch:
```bash
# DO NOT PUSH - switch to correct feature branch
git checkout -b feature/<name>
```

### 4. Push to feature branch ONLY
```bash
git push -u origin $(git branch --show-current)
```

## Branch Strategy Reference

| Branch | Purpose | Push Allowed? |
|--------|---------|---------------|
| `main` | Production releases | ❌ Never direct |
| `v2.0-dev` | Integration branch | ⚠️ Via PR only |
| `feature/*` | Feature development | ✅ Yes |
| `fix/*` | Bug fixes | ✅ Yes |

## Emergency: Wrong Branch Push

If you accidentally push to wrong branch:
```bash
# Revert the push (DANGEROUS - coordinate with team)
git push origin HEAD~1:branch-name --force
```
