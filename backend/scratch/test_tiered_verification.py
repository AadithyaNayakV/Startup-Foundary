import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import uuid
from datetime import datetime
from unittest.mock import patch
from database import SessionLocal
from models import User, Startup, StartupMember
from routers.startup import serialize_startup, update_startup
from routers.admin import get_admin_queue, approve_startup, reject_startup
from schemas import StartupUpdate, AdminDecision
import asyncio

def test_tiered_verification_flow():
    db = SessionLocal()
    try:
        with patch("routers.admin.scrape_market_intelligence", return_value={"market_summary": "Test Market"}), \
             patch("routers.admin.compute_ai_score", return_value=(85, "Strong Buy", {"traction": 90, "team": 80})):
            
            # 1. Setup mock founder & admin
            founder_uid = f"test_founder_{uuid.uuid4()}"
            admin_uid = f"test_admin_{uuid.uuid4()}"
            
            founder = User(
                firebase_uid=founder_uid,
                email=f"founder_{uuid.uuid4().hex[:6]}@test.com",
                name="Test Founder",
                role="founder",
                is_approved=True,
            )
            admin = User(
                firebase_uid=admin_uid,
                email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
                name="Test Admin",
                role="admin",
                is_approved=True,
            )
            db.add_all([founder, admin])
            db.commit()
            db.refresh(founder)
            db.refresh(admin)
            print(f"[OK] Created test founder ({founder.id}) and admin ({admin.id})")

            # 2. Create new startup
            startup = Startup(
                name="Alpha Origin Inc",
                tagline="Initial Tagline",
                description="Initial Description",
                stage="idea",
                status="pending",
                approval_status="pending",
                has_pending_update=False,
                ask_amount=100000.0,
                equity_offered=10.0,
                implied_valuation=1000000.0,
                mrr=5000.0,
                burn_rate=3000.0,
            )
            db.add(startup)
            db.commit()
            db.refresh(startup)
            
            member = StartupMember(startup_id=startup.id, user_id=founder.id, role="ceo")
            db.add(member)
            db.commit()
            print(f"[OK] Created pending startup: {startup.name} (status={startup.status})")

            # 3. Check admin queue for new registration
            queue = asyncio.run(get_admin_queue(current_user=admin, db=db))
            new_app_ids = [s["id"] for s in queue["startups"]]
            assert str(startup.id) in new_app_ids, "New startup should appear in admin queue startups"
            print("[OK] Startup correctly appeared in Admin Queue 'New Applications'")

            # 4. Admin approves new startup
            decision = AdminDecision(reason="Initial verification passed")
            asyncio.run(approve_startup(startup_id=str(startup.id), decision=decision, current_user=admin, db=db))
            db.refresh(startup)
            assert startup.status == "approved", "Startup status should be approved"
            assert startup.approval_status == "approved"
            assert startup.ai_score == 85
            print(f"[OK] Startup approved! Status={startup.status}, AI Score={startup.ai_score}")

            # 5. Founder updates NON-SENSITIVE fields (tagline, mrr, burn_rate)
            payload_instant = StartupUpdate(
                tagline="Supercharged AI Tagline",
                description="Updated operational description",
                mrr=20000.0,
                burn_rate=8000.0,
            )
            res_instant = asyncio.run(update_startup(startup_id=str(startup.id), payload=payload_instant, current_user=founder, db=db))
            db.refresh(startup)
            assert startup.tagline == "Supercharged AI Tagline", "Tagline should update live"
            assert startup.mrr == 20000.0, "MRR should update live"
            assert startup.has_pending_update == False, "has_pending_update should stay False for non-sensitive changes"
            assert startup.pending_data is None, "pending_data should remain None"
            print("[OK] Non-sensitive fields updated live immediately without admin intervention!")

            # 6. Founder updates SENSITIVE fields (name, ask_amount, equity_offered)
            payload_sensitive = StartupUpdate(
                name="Alpha NextGen Corp",
                ask_amount=500000.0,
                equity_offered=15.0,
            )
            res_sensitive = asyncio.run(update_startup(startup_id=str(startup.id), payload=payload_sensitive, current_user=founder, db=db))
            db.refresh(startup)
            assert startup.name == "Alpha Origin Inc", "Live startup name must NOT change before admin approval"
            assert startup.has_pending_update == True, "has_pending_update must be True"
            assert startup.pending_data is not None, "pending_data must store sensitive changes"
            assert startup.pending_data["name"] == "Alpha NextGen Corp", "pending_data must contain new name"
            print("[OK] Sensitive fields safely staged into pending_data with has_pending_update=True!")

            # 7. Admin views queue for revisions
            queue = asyncio.run(get_admin_queue(current_user=admin, db=db))
            revision_ids = [s["id"] for s in queue["revisions"]]
            assert str(startup.id) in revision_ids, "Startup must appear in admin queue revisions"
            rev_item = next(s for s in queue["revisions"] if s["id"] == str(startup.id))
            diff_fields = [d["field"] for d in rev_item["pending_diff"]]
            assert "name" in diff_fields, "Diff must contain name"
            assert "ask_amount" in diff_fields, "Diff must contain ask_amount"
            print(f"[OK] Admin Queue contains revision diff: {[(d['label'], d['old_value'], d['new_value']) for d in rev_item['pending_diff']]}")

            # 8. Admin approves revision
            decision = AdminDecision(reason="Name and Valuation change verified")
            asyncio.run(approve_startup(startup_id=str(startup.id), decision=decision, current_user=admin, db=db))
            db.refresh(startup)
            assert startup.name == "Alpha NextGen Corp", "Live startup name should now be updated"
            assert startup.ask_amount == 500000.0, "Live ask_amount should now be updated"
            assert startup.has_pending_update == False, "has_pending_update should be reset to False"
            assert startup.pending_data is None, "pending_data should be reset to None"
            assert startup.status == "approved", "Startup must remain approved"
            print("[OK] Admin successfully approved revision and merged changes live!")

            # 9. Founder submits another sensitive edit and Admin rejects revision
            payload_rejected = StartupUpdate(name="Unauthorized Hijack Name")
            asyncio.run(update_startup(startup_id=str(startup.id), payload=payload_rejected, current_user=founder, db=db))
            db.refresh(startup)
            assert startup.has_pending_update == True
            
            reject_decision = AdminDecision(reason="Brand name not recognized")
            asyncio.run(reject_startup(startup_id=str(startup.id), decision=reject_decision, current_user=admin, db=db))
            db.refresh(startup)
            assert startup.name == "Alpha NextGen Corp", "Live name should remain previous valid name"
            assert startup.has_pending_update == False, "has_pending_update should be reset"
            assert startup.pending_data is None, "pending_data should be cleared"
            assert startup.status == "approved", "Startup profile must remain live and approved after revision rejection"
            print("[OK] Admin revision rejection successfully discarded pending edit without killing live startup!")

            print("\nALL TIERED VERIFICATION TESTS PASSED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    test_tiered_verification_flow()
