"""Create missing audit_logs table"""
from sqlalchemy import text
from app.core.database import SessionLocal

def create_audit_logs_table():
    db = SessionLocal()
    try:
        # Create audit_logs table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                user_ip TEXT,
                action_type TEXT,
                resource_type TEXT,
                resource_id TEXT,
                details TEXT,
                status TEXT,
                error_message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.commit()
        print("✅ audit_logs table created successfully")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_audit_logs_table()
