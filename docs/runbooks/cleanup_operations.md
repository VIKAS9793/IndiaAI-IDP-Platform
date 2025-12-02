# RUNBOOK: Cleanup Service Operations
**IndiaAI IDP Platform**

**Owner**: Platform Engineering  
**Last Updated**: 2025-11-30  
**Oncall**: @platform-team

---

## Table of Contents
1. [Overview](#overview)
2. [Common Operations](#common-operations)
3. [Failure Modes](#failure-modes)
4. [Monitoring](#monitoring)
5. [Emergency Procedures](#emergency-procedures)

---

## Overview

### What is CleanupService?
Automated system to delete expired documents based on purpose-specific retention policies, ensuring DPDP Act 2023 compliance.

### Schedule
- **Frequency**: Daily at 2:00 AM UTC (7:30 AM IST)
- **Duration**: 5-30 minutes (depends on file count)
- **Technology**: APScheduler (CronTrigger)

### Retention Policies

| **Purpose Code** | **Retention** | **Use Case** |
|-----------------|--------------|--------------|
| System Testing | 24 hours | Test uploads, debugging |
| General | 30 days | Standard documents |
| Financial | 1 year | Invoices, tax documents |
| Legal | 7 years | Contracts, agreements |
| Medical | 10 years | Patient records |

---

## Common Operations

### OP-001: Manual Cleanup Trigger

**When**: Testing, backlog cleanup, immediate compliance need

**Steps**:
```bash
# SSH into API server
kubectl exec -it api-server-pod -- /bin/bash

# Activate virtual environment
source venv/bin/activate

# Run cleanup manually
python -c "
from app.database import get_db
from app.services.audit import AuditService
from app.services.cleanup import CleanupService

db = next(get_db())
audit_service = AuditService(db)
cleanup_service = CleanupService(db, audit_service)

deleted, failed = cleanup_service.cleanup_expired_jobs()
print(f'Deleted: {deleted}, Failed: {failed}')
"
```

**Expected Output**:
```
Deleted: 47, Failed: 0
```

**Verification**:
```sql
-- Check audit log
SELECT * FROM audit_logs 
WHERE action = 'cleanup_expired_jobs' 
ORDER BY timestamp DESC 
LIMIT 1;
```

---

### OP-002: Check Next Scheduled Run

**When**: Verifying scheduler is active

**Steps**:
```bash
# In Python shell
python -c "
from app.scheduler import scheduler
jobs = scheduler.get_jobs()
for job in jobs:
    if 'cleanup' in job.id.lower():
        print(f'Job: {job.id}')
        print(f'Next run: {job.next_run_time}')
        print(f'Trigger: {job.trigger}')
"
```

**Expected Output**:
```
Job: cleanup_expired_jobs
Next run: 2025-12-01 02:00:00+00:00
Trigger: cron[hour='2', minute='0']
```

---

### OP-003: Pause/Resume Scheduler

**When**: Emergency maintenance, investigating issue

**Pause**:
```python
from app.scheduler import scheduler
scheduler.pause()
print("✅ Scheduler paused")
```

**Resume**:
```python
from app.scheduler import scheduler
scheduler.resume()
print("✅ Scheduler resumed")
```

**Verification**:
```python
print(f"Scheduler running: {scheduler.running}")
print(f"Scheduler state: {scheduler.state}")
```

---

### OP-004: View Cleanup History

**When**: Investigating past deletions, compliance audit

**Query**:
```sql
-- Last 10 cleanup runs
SELECT 
    timestamp,
    details->>'deleted_count' as deleted,
    details->>'failed_count' as failed
FROM audit_logs
WHERE action = 'cleanup_expired_jobs'
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected Output**:
```
timestamp                  | deleted | failed
---------------------------|---------|-------
2025-11-30 02:00:15+00     | 47      | 0
2025-11-29 02:00:12+00     | 52      | 1
2025-11-28 02:00:18+00     | 39      | 0
```

---

### OP-005: Verify File Deletion

**When**: Validating cleanup worked correctly

**Steps**:
```bash
# Check if expired files are gone
python -c "
from app.database import get_db
from app.models.job import Job
from app.config import settings
from datetime import datetime, timedelta
from pathlib import Path

db = next(get_db())
storage_path = Path(settings.storage_path)

# Find jobs older than 25 hours with 'System Testing'
cutoff = datetime.utcnow() - timedelta(hours=25)
expired_jobs = db.query(Job).filter(
    Job.purpose_code == 'System Testing',
    Job.created_at < cutoff
).all()

print(f'Found {len(expired_jobs)} expired System Testing jobs')

# Check if their files still exist
for job in expired_jobs:
    file_path = storage_path / job.file_key
    exists = file_path.exists()
    print(f'{job.file_key}: exists={exists} (should be False)')
"
```

---

## Failure Modes

### FM-001: Cleanup Job Not Running

**Symptom**:
```
Alert: Cleanup_Not_Running (24+ hours since last run)
```

**Diagnosis**:
```bash
# Check scheduler status
python -c "
from app.scheduler import scheduler
print(f'Running: {scheduler.running}')
print(f'Jobs: {[j.id for j in scheduler.get_jobs()]}')
"
```

**Possible Causes**:
1. **Scheduler crashed** → Check logs for exceptions
2. **API server restarted** → Scheduler didn't auto-start
3. **Job removed accidentally** → Re-add job

**Resolution**:
```python
# Re-add cleanup job
from app.scheduler import scheduler, run_cleanup_job
from apscheduler.triggers.cron import CronTrigger

scheduler.add_job(
    run_cleanup_job,
    CronTrigger(hour=2, minute=0),
    id="cleanup_expired_jobs",
    replace_existing=True
)
scheduler.start()
print("✅ Cleanup job re-added")
```

---

### FM-002: High Failure Rate (>10 files)

**Symptom**:
```
Alert: Cleanup_High_Failure_Rate
Details: Failed to delete 23 files
```

**Diagnosis**:
```sql
-- Check latest audit log for errors
SELECT 
    details->>'failed_files' as files,
    details->>'errors' as errors
FROM audit_logs
WHERE action = 'cleanup_expired_jobs'
ORDER BY timestamp DESC
LIMIT 1;
```

**Common Errors**:

1. **FileNotFoundError**: File already deleted (orphan DB record)
   ```sql
   -- Clean up orphan records
   DELETE FROM jobs
   WHERE id IN (
       SELECT id FROM jobs j
       WHERE NOT EXISTS (
           SELECT 1 FROM storage WHERE key = j.file_key
       )
   );
   ```

2. **PermissionError**: Insufficient permissions
   ```bash
   # Check storage permissions
   ls -la /path/to/storage/
   # Should be owned by app user, 755 permissions
   ```

3. **R2 API Error**: Cloud storage unavailable
   ```bash
   # Check R2 connectivity
   aws s3 ls s3://bucket-name --endpoint-url=https://r2.endpoint
   ```

**Resolution**:
- If <5% failure rate: Monitor, will retry next day
- If >10% failure rate: Investigate and fix root cause
- If >50% failure rate: Pause cleanup, escalate to @platform-team

---

### FM-003: Accidental Deletion (Wrong Retention Policy)

**Symptom**:
```
User report: "My document was deleted too early"
```

**Investigation**:
```sql
-- Find the deleted job
SELECT 
    id, file_key, purpose_code, created_at, 
    (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) as age_hours
FROM jobs
WHERE file_key = 'user_reported_file.pdf';

-- If not in jobs, check audit log
SELECT details
FROM audit_logs
WHERE action = 'cleanup_expired_jobs'
  AND details::text LIKE '%user_reported_file.pdf%';
```

**If Retention Policy Was Wrong**:
1. **Fix policy** in code (`cleanup.py`)
2. **Deploy hotfix** immediately
3. **Notify users** if many affected
4. **Restore from backup** if available

**If User Misunderstood**:
- Explain retention policy
- Offer to recover from backup (if <30 days)

---

### FM-004: Scheduler Consuming Too Much CPU/Memory

**Symptom**:
```
Alert: High CPU usage during cleanup (>80%)
```

**Diagnosis**:
```bash
# Check cleanup duration
python -c "
from app.database import get_db
from sqlalchemy import text

db = next(get_db())
result = db.execute(text('''
    SELECT 
        timestamp,
        details->>'deleted_count' as deleted,
        details->>'duration_seconds' as duration
    FROM audit_logs
    WHERE action = 'cleanup_expired_jobs'
    ORDER BY timestamp DESC
    LIMIT 5
''')).fetchall()

for row in result:
    print(f'{row[0]}: {row[1]} files in {row[2]}s')
"
```

**If Duration >300s (5 min)**:
- **Cause**: Too many files to process
- **Solution**: Batch deletions (delete 100 at a time, sleep 1s between batches)

**Code Fix**:
```python
# In CleanupService.cleanup_expired_jobs()
BATCH_SIZE = 100
for i in range(0, len(expired_jobs), BATCH_SIZE):
    batch = expired_jobs[i:i+BATCH_SIZE]
    # Delete batch
    time.sleep(1)  # Pause between batches
```

---

### FM-005: Storage-DB Inconsistency

**Symptom**:
```
Files exist in storage but not in DB (or vice versa)
```

**Diagnosis - Find Orphan Files**:
```bash
# Files in storage but not in DB
python -c "
from pathlib import Path
from app.database import get_db
from app.models.job import Job
from app.config import settings

db = next(get_db())
storage_path = Path(settings.storage_path)

db_keys = {job.file_key for job in db.query(Job).all()}
storage_files = {f.name for f in storage_path.iterdir() if f.is_file()}

orphan_files = storage_files - db_keys
print(f'Orphan files: {len(orphan_files)}')
for f in list(orphan_files)[:10]:
    print(f'  - {f}')
"
```

**Diagnosis - Find Orphan Records**:
```python
# DB records without files
storage_files = {f.name for f in storage_path.iterdir()}
db_jobs = db.query(Job).all()

orphan_records = [j for j in db_jobs if j.file_key not in storage_files]
print(f'Orphan records: {len(orphan_records)}')
```

**Resolution**:
```bash
# Create reconciliation script
python scripts/reconcile_storage.py
# Deletes orphan files and DB records
```

---

## Monitoring

### Key Dashboards

**Grafana**: http://grafana.internal/d/cleanup-service

**Panels**:
1. **Files Deleted Per Day** (line chart)
2. **Failure Rate** (gauge, alert if >5%)
3. **Cleanup Duration** (histogram)
4. **Last Run Time** (single stat)

### Health Check Endpoint

**URL**: `GET /api/health/cleanup`

**Expected Response**:
```json
{
  "status": "healthy",
  "last_run": "2025-11-30T02:00:15Z",
  "next_run": "2025-12-01T02:00:00Z",
  "deleted_last_24h": 47,
  "failed_last_24h": 0
}
```

**Alert If**:
- `status != "healthy"`
- `next_run` is in the past
- `failed_last_24h > 10`

---

## Emergency Procedures

### EMERGENCY-001: Stop All Deletions Immediately

**When**: Suspected data loss, wrong retention policy deployed

**Steps**:
```bash
# 1. Pause scheduler
kubectl exec -it api-server -- python -c "
from app.scheduler import scheduler
scheduler.pause()
print('✅ Cleanup PAUSED')
"

# 2. Verify no jobs running
ps aux | grep cleanup

# 3. Notify team
echo "Cleanup service PAUSED by oncall" | mail -s "URGENT: Cleanup Paused" team@company.com

# 4. Investigate
# Check audit logs, compare against retention policies

# 5. Resume (only after fix confirmed)
kubectl exec -it api-server -- python -c "
from app.scheduler import scheduler
scheduler.resume()
print('✅ Cleanup RESUMED')
"
```

---

### EMERGENCY-002: Recover Accidentally Deleted Files

**When**: User reports critical file deleted incorrectly

**Steps**:
```bash
# 1. Check if backup exists
aws s3 ls s3://backup-bucket/$(date +%Y-%m-%d)/

# 2. Restore file
aws s3 cp s3://backup-bucket/2025-11-30/file.pdf /tmp/
cp /tmp/file.pdf /path/to/storage/

# 3. Recreate DB record (if needed)
python -c "
from app.database import get_db
from app.models.job import Job, JobStatus
from datetime import datetime

db = next(get_db())
job = Job(
    id='recovered_job',
    file_key='file.pdf',
    status=JobStatus.COMPLETED,
    purpose_code='Financial',  # Use appropriate purpose
    consent_verified=True,
    created_at=datetime.utcnow()
)
db.add(job)
db.commit()
print('✅ File restored')
"
```

---

### EMERGENCY-003: Rollback Deployment

**When**: New cleanup version is deleting wrong files

**Steps**:
```bash
# 1. Pause cleanup
kubectl exec -it api-server -- python -c "
from app.scheduler import scheduler; scheduler.pause()"

# 2. Rollback deployment
kubectl rollout undo deployment/api-server

# 3. Verify old version running
kubectl get pods -l app=api-server -o jsonpath='{.items[0].spec.containers[0].image}'

# 4. Test manually
kubectl exec -it api-server -- python scripts/test_cleanup.py

# 5. Resume if tests pass
kubectl exec -it api-server -- python -c "
from app.scheduler import scheduler; scheduler.resume()"
```

---

## Compliance Reporting

### Monthly Report (for DPDP Compliance Officer)

**Query**:
```sql
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    SUM((details->>'deleted_count')::int) as deleted,
    SUM((details->>'failed_count')::int) as failed
FROM audit_logs
WHERE 
    action = 'cleanup_expired_jobs'
    AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

**Template**:
```
Cleanup Service - Monthly Report
Period: [Month Year]

Total Files Deleted: 1,234
- System Testing: 987 (24h retention)
- General: 234 (30d retention)
- Financial: 13 (1y retention)

Failed Deletions: 3 (0.2% failure rate)

Compliance Status: ✅ COMPLIANT
All files deleted within retention periods.
```

---

## Contact

**Primary Oncall**: @platform-team (PagerDuty)  
**Escalation**: @engineering-lead  
**Compliance Questions**: @compliance-officer
