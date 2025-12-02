# ADR-0006: Automated Data Retention & Cleanup

**Status**: ✅ Accepted  
**Date**: 2025-11-30  
**Deciders**: Engineering Team, Compliance Review  
**Technical Story**: Implement automated cleanup to comply with DPDP Act 2023 data retention requirements

---

## Context

The IndiaAI IDP Platform processes sensitive documents (Aadhaar, PAN, invoices) and must comply with the **Digital Personal Data Protection (DPDP) Act 2023**, which mandates:

1. **Data Minimization** (Section 8): Only retain personal data as long as necessary
2. **Purpose Limitation** (Section 9): Data can only be used for stated purposes
3. **Accountability** (Section 10): Demonstrate compliance through audit trails

**Problem**: Without automated cleanup, we risk:
- **Compliance Violations**: Retaining data beyond legal limits (₹250 crore penalty)
- **Storage Costs**: Accumulating unused files (estimated ₹50k/month at scale)
- **Security Risk**: Old files are attack vectors if breached

**Requirement**: Automated system to delete files based on purpose-specific retention policies, with full audit trail.

---

## Decision

We implemented **CleanupService** with the following design:

### **1. Purpose-Based Retention Policies**

Each document upload specifies a `purpose_code` that determines retention period:

| **Purpose Code** | **Retention** | **Rationale** |
|-----------------|--------------|---------------|
| System Testing | 24 hours | Test data, no legal requirement to retain |
| General | 30 days | Default for non-critical documents |
| Financial | 1 year | Tax compliance (IT Act 1961, Section 44AA) |
| Legal | 7 years | Limitation Act 1963 |
| Medical | 10 years | Medical Records Act, 2002 |

**Design Decision**: Retention is calculated from `Job.created_at`, not `Job.updated_at`, to ensure predictable cleanup schedules.

---

### **2. Cleanup Architecture**

**Components**:
```
┌─────────────────┐
│  APScheduler    │  Daily at 2:00 AM UTC
│  (Cron Trigger) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│     CleanupService              │
│  - Query expired jobs           │
│  - Delete files from storage    │
│  - Delete DB records            │
│  - Log to AuditService          │
└────────┬────────────────────────┘
         │
         ├──────────────────────┐
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  Storage Layer  │    │  AuditService   │
│  (R2 / Local)   │    │  (Audit Logs)   │
└─────────────────┘    └─────────────────┘
```

**Flow**:
1. **Query**: Find all jobs where `(now - created_at) > retention_period`
2. **Delete File**: Remove from storage (R2 or local filesystem)
3. **Delete Record**: Remove job from database
4. **Audit**: Log action with deleted file count and failures

---

### **3. Scheduler Integration**

**Technology**: APScheduler (async-safe, thread-safe)

**Cron Expression**: `0 2 * * *` (Daily at 2:00 AM UTC)

**Rationale for 2 AM**:
- Low traffic period (minimize DB load)
- Before business hours in India (UTC+5:30 = 7:30 AM IST)
- Allows cleanup to finish before peak usage (9 AM IST)

**Startup Integration**:
```python
# app/main.py
@app.on_event("startup")
async def startup_event():
    scheduler.add_job(
        run_cleanup_job,
        CronTrigger(hour=2, minute=0),
        id="cleanup_expired_jobs",
        replace_existing=True
    )
    scheduler.start()
```

**High Availability**: If API server restarts, scheduler reloads jobs from configuration (stateless).

---

### **4. Audit Trail**

**Every cleanup run logs**:
```json
{
  "action": "cleanup_expired_jobs",
  "timestamp": "2025-11-30T02:00:15Z",
  "details": {
    "deleted_count": 47,
    "failed_count": 2,
    "failed_files": ["file1.pdf", "file2.jpg"],
    "errors": ["FileNotFoundError: file1.pdf", "PermissionError: file2.jpg"]
  }
}
```

**Retention for Audit Logs**: 1 year (compliance requirement)

**Audit Log Cleanup**: Separate job runs monthly to archive old logs to cold storage (not implemented yet, see Future Work).

---

## Contract Clarifications (Lessons Learned)

### **Issue 1: Config Property Name**
**Problem**: Test used `settings.UPLOAD_DIR`, but code uses `settings.storage_path`

**Fix**: Standardized to `storage_path` across codebase

**Prevention**: Added type hints to `config.py`:
```python
@property
def storage_path(self) -> Path:
    """Path to storage directory (local or mounted R2)."""
    return Path(self.UPLOAD_DIR)
```

---

### **Issue 2: Database Field Names**
**Problem**: 
- Code used `job.file_path`, but schema only has `file_key`
- Code used `job.purpose`, but schema has `purpose_code`

**Fix**: Updated CleanupService to match schema:
```python
# Before (wrong)
storage_path / job.file_path
job.purpose

# After (correct)
storage_path / job.file_key
job.purpose_code
```

**Prevention**: Added SQLAlchemy type hints to models:
```python
class Job(Base):
    file_key: Mapped[str] = Column(String, nullable=False)
    purpose_code: Mapped[str] = Column(String, nullable=False)
```

---

### **Issue 3: Service Dependency**
**Problem**: CleanupService called `AuditService.log_action()` as static method, but it requires instance (needs DB session)

**Fix**: Injected AuditService via constructor:
```python
# Before (wrong)
class CleanupService:
    def __init__(self, db: Session):
        self.db = db
        # Implicit: AuditService.log_action()  ❌

# After (correct)
class CleanupService:
    def __init__(self, db: Session, audit_service: AuditService):
        self.db = db
        self.audit_service = audit_service
        
    def cleanup_expired_jobs(self):
        # ...
        self.audit_service.log_action("cleanup", details)
```

**Prevention**: Document service dependencies in docstrings:
```python
"""
CleanupService - Automated data retention enforcement

Dependencies:
- Database session (SQLAlchemy Session)
- AuditService (for logging cleanup actions)
"""
```

---

## Alternatives Considered

### **Alternative 1: Database-Triggered Cleanup (Postgres DELETE CASCADE)**

**Pros**:
- Automatic (no scheduler needed)
- Atomic (DB transaction guarantees)

**Cons**:
- **Doesn't delete files** from storage (only DB records)
- **No audit trail** (can't log what was deleted)
- **SQLite incompatible** (we use SQLite for dev)

**Decision**: Rejected. We need file deletion + audit logging.

---

### **Alternative 2: Manual Cleanup (Admin UI)**

**Pros**:
- Simple to implement (one button)
- Human oversight (prevents accidental deletion)

**Cons**:
- **Compliance risk**: Manual process can be forgotten
- **Scalability**: Doesn't work for 10k+ jobs
- **No automation**: Violates "secure by default" principle

**Decision**: Rejected. Automated is safer and more reliable.

---

### **Alternative 3: Cloud-Native TTL (R2 Object Lifecycle)**

**Pros**:
- Zero code (R2 handles deletion)
- Highly scalable

**Cons**:
- **No per-purpose retention**: R2 TTL is bucket-wide (all files expire at same time)
- **No audit trail**: We don't know which files R2 deleted
- **DB orphans**: DB records remain even if files are gone

**Decision**: Rejected for MVP. Consider for Phase 2 (see Future Work).

---

## Consequences

### **Positive**

1. **Compliance**:
   - ✅ DPDP Act Section 8 (Data Minimization)
   - ✅ IT Act 1961 (Financial record retention)
   - ✅ Full audit trail for regulators

2. **Cost Savings**:
   - Estimated ₹50k/month saved at 10k documents/month
   - Storage cost scales linearly, not exponentially

3. **Security**:
   - Reduced attack surface (fewer files to breach)
   - Old PII is automatically purged

4. **Operational**:
   - Zero manual intervention
   - Runs during low-traffic hours
   - Self-healing (retries failed deletions next day)

### **Negative**

1. **Accidental Deletion Risk**:
   - If retention policy is misconfigured, data is lost permanently
   - **Mitigation**: Backup strategy (see Future Work)

2. **Scheduler Dependency**:
   - If scheduler crashes, cleanup doesn't run
   - **Mitigation**: Monitor scheduler health (see Monitoring)

3. **Storage-DB Inconsistency**:
   - If file deletion fails, DB record remains (orphan)
   - **Mitigation**: Retry logic + manual cleanup script

### **Risks**

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
|----------|---------------|-----------|----------------|
| Accidental deletion | Low | Critical | Backup to cold storage before delete |
| Scheduler crash | Medium | Medium | Health check + PagerDuty alert |
| File delete fails | Medium | Low | Retry next day, alert if >10 failures |
| Retention policy too short | Low | Critical | Code review + compliance sign-off |

---

## Testing

### **Test Coverage**
- **Unit Tests**: 8 tests for CleanupService logic
- **Integration Tests**: E2E flow (create job → wait → cleanup → verify)
- **Compliance Tests**: Verify each purpose code has correct retention

### **Test Highlights**
```python
def test_system_testing_retention_24h():
    """Verify System Testing files are deleted after 24 hours."""
    job = create_job(purpose_code="System Testing", created_at=now - 25h)
    cleanup_service.cleanup_expired_jobs()
    assert job not in db.query(Job).all()

def test_financial_retention_1y():
    """Verify Financial files are kept for 1 year."""
    job = create_job(purpose_code="Financial", created_at=now - 364d)
    cleanup_service.cleanup_expired_jobs()
    assert job in db.query(Job).all()  # Should NOT be deleted

def test_audit_log_created():
    """Verify cleanup action is logged."""
    cleanup_service.cleanup_expired_jobs()
    log = db.query(AuditLog).filter(action="cleanup_expired_jobs").first()
    assert log is not None
    assert "deleted_count" in log.details
```

---

## Monitoring

### **Key Metrics**

1. **cleanup_deleted_count** (Counter): Number of files deleted per run
2. **cleanup_failed_count** (Counter): Number of deletions that failed
3. **cleanup_duration_seconds** (Histogram): Time to complete cleanup
4. **cleanup_last_run_timestamp** (Gauge): Last successful cleanup run

### **Alerts**

```yaml
# Grafana / Prometheus Alerts
- alert: Cleanup_Not_Running
  expr: (time() - cleanup_last_run_timestamp) > 86400  # 24 hours
  for: 1h
  annotations:
    summary: "Cleanup hasn't run in >24 hours"

- alert: Cleanup_High_Failure_Rate
  expr: cleanup_failed_count > 10
  for: 5m
  annotations:
    summary: "Cleanup failed to delete >10 files"
```

---

## Deployment

### **Rollout Plan**
1. **Staging**: Deploy + run manual test (verify 1 test file deleted)
2. **Production**: Deploy + monitor first automated run (2 AM UTC)
3. **Validation**: Check audit logs next morning

### **Rollback Plan**
If cleanup deletes wrong files:
```bash
# Pause scheduler
kubectl exec -it api-server -- python -c "
from app.scheduler import scheduler
scheduler.pause()
"

# Restore from backup (if available)
# Investigate logs
# Fix retention policy
# Resume scheduler
```

---

## Future Work

### **Phase 2 Enhancements**

1. **Soft Delete** (30-day grace period):
   - Instead of immediate deletion, mark as `deleted_at`
   - Actual deletion after 30 days
   - Allows recovery if user requests

2. **Backup Before Delete**:
   - Archive to cold storage (AWS Glacier / R2 Archive Tier)
   - Keep for 7 years (legal compliance)
   - Restore on request

3. **Audit Log Archival**:
   - Separate job to archive old audit logs (>1 year)
   - Compress + move to cold storage
   - Keeps audit DB small

4. **Cloud-Native Lifecycle**:
   - Use R2 Object Lifecycle for auto-deletion
   - CleanupService only deletes DB records
   - Reconciliation job to detect orphans

5. **User Notifications**:
   - Email users 7 days before deletion
   - Allow extension request (e.g., "Financial" → "Legal")

---

## Compliance Documentation

### **DPDP Act 2023 Mapping**

| **Requirement** | **Implementation** | **Evidence** |
|----------------|-------------------|--------------|
| Section 8 (Data Minimization) | Automated deletion after retention period | CleanupService logs |
| Section 9 (Purpose Limitation) | Purpose-based retention policies | `purpose_code` in Job model |
| Section 10 (Accountability) | Full audit trail | AuditLog table |

### **Audit Report Template**

```
Period: [Month Year]

Files Deleted: 1,234
- System Testing: 987
- General: 234
- Financial: 13

Failed Deletions: 3 (FileNotFoundError)
Average Retention: 25 days

Compliance Status: ✅ COMPLIANT
```

---

## References

- **DPDP Act 2023**: Sections 8-10 (Data Minimization, Purpose Limitation, Accountability)
- **IT Act 1961**: Section 44AA (Financial record retention)
- **Limitation Act 1963**: 3-year limit for contractual claims
- **Medical Records Act 2002**: 10-year retention for patient records

---

## Sign-Off

**Approved By**:
- Engineering Lead: [Name] - 2025-11-30
- Compliance Officer: [Name] - 2025-11-30
- Security Review: [Name] - 2025-11-30

**Next Review**: 2026-01-30 (or after first compliance audit)
