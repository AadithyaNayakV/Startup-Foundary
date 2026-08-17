import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import User, Startup, StartupMember, KafkaOutbox
from schemas import StartupCreate
from routers.startup import create_startup

async def test_create():
    db = SessionLocal()
    # Find or create a founder
    founder = db.query(User).filter(User.role == "founder").first()
    if not founder:
        founder = User(
            firebase_uid=f"test_founder_{uuid.uuid4()}",
            email=f"founder_{uuid.uuid4().hex[:6]}@test.com",
            name="Test Founder",
            role="founder",
            is_approved=True,
        )
        db.add(founder)
        db.commit()
        db.refresh(founder)

    print(f"Testing with founder: {founder.email} (id: {founder.id}, role: {founder.role})")

    startup_payload = StartupCreate(
        name=f"Test Startup {uuid.uuid4().hex[:4]}",
        tagline="A test startup tagline",
        description="Detailed description for testing",
        stage="mvp",
        domains=["AI / Machine Learning", "SaaS"],
        funding_needed="$500k Pre-Seed",
        ask_amount=250000.0,
        equity_offered=10.0,
        implied_valuation=2500000.0,
    )

    try:
        res = await create_startup(
            startup_data=startup_payload,
            current_user=founder,
            db=db,
        )
        print("Successfully created startup:")
        print(f"  ID: {res.get('id')}")
        print(f"  Name: {res.get('name')}")
        print(f"  Status: {res.get('status')}")

        # Check outbox
        outbox = db.query(KafkaOutbox).filter(KafkaOutbox.topic == "startup.created").order_by(KafkaOutbox.created_at.desc()).first()
        if outbox:
            print(f"  Outbox Record: {outbox.id}, Status: {outbox.status}, Topic: {outbox.topic}")

    except Exception as e:
        print(f"ERROR creating startup: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_create())
