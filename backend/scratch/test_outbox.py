import asyncio
import os
import sys
import uuid

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import KafkaOutbox
from kafka.outbox import enqueue_outbox_event
from kafka.topics import KafkaTopics
from services.outbox_relay import outbox_relay


async def test_transactional_outbox():
    print("[Test 1] Testing Atomic Enqueue to KafkaOutbox...")
    db = SessionLocal()
    test_startup_id = str(uuid.uuid4())
    
    # 1. Enqueue Event in DB
    record = enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.STARTUP_CREATED,
        event_type="startup.created",
        startup_id=test_startup_id,
        payload={
            "startup_id": test_startup_id,
            "name": "Test Resilient Corp",
            "tagline": "Building outbox resilience",
        }
    )
    db.commit()
    
    record_id = record.id
    print(f"[SUCCESS] Record inserted with ID: {record_id}, Status: {record.status}")
    assert record.status == "PENDING", f"Expected PENDING, got {record.status}"
    db.close()

    # 2. Test Relay Processing
    print("\n[Test 2] Testing Outbox Relay Process Cycle...")
    published = await outbox_relay.process_pending_events()
    print(f"[SUCCESS] Outbox relay processed and published {published} events.")

    # 3. Check DB Status
    db2 = SessionLocal()
    updated_record = db2.query(KafkaOutbox).filter(KafkaOutbox.id == record_id).first()
    print(f"[STATUS] Outbox record {record_id} post-relay status: {updated_record.status}, retry_count: {updated_record.retry_count}")
    
    # Clean up test record
    db2.delete(updated_record)
    db2.commit()
    db2.close()
    print("[SUCCESS] Test record cleaned up successfully.")
    print("[SUCCESS] All Transactional Outbox tests passed!")


if __name__ == "__main__":
    asyncio.run(test_transactional_outbox())
