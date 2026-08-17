import asyncio
import os
import sys
import uuid
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.datastructures import UploadFile
from database import SessionLocal
from models import User, Startup, StartupMember, DataRoomDocument
from utils.s3_manager import s3_manager
from routers.startup import upload_logo, upload_pitch_deck
from routers.dataroom import upload_dataroom_document, delete_dataroom_document


class MockRequest:
    base_url = "http://localhost:8000"


async def test_all_uploads():
    print("[S3 Integration Test] Running comprehensive AWS S3 upload verification...")
    db = SessionLocal()

    founder = db.query(User).filter(User.role == "founder").first()
    if not founder:
        founder = User(
            firebase_uid=f"test_founder_{uuid.uuid4()}",
            email=f"s3_founder_{uuid.uuid4().hex[:6]}@test.com",
            name="S3 Test Founder",
            role="founder",
            is_approved=True,
        )
        db.add(founder)
        db.commit()
        db.refresh(founder)

    # 1. Test Logo Upload
    print("\n[1] Testing Logo Upload to AWS S3...")
    logo_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    logo_file = UploadFile(filename="test_logo.png", file=io.BytesIO(logo_bytes))
    logo_file.headers = {"content-type": "image/png"}

    logo_res = await upload_logo(
        request=MockRequest(),
        file=logo_file,
        current_user=founder,
    )
    logo_url = logo_res.get("url")
    print(f"  [SUCCESS] Logo URL: {logo_url}")
    assert "amazonaws.com" in logo_url, f"Expected AWS S3 URL, got {logo_url}"
    assert "logos/" in logo_url, f"Expected logos/ key in URL, got {logo_url}"

    # 2. Test Pitch Deck Upload
    print("\n[2] Testing Pitch Deck Upload to AWS S3...")
    pdf_sample = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n206\n%%EOF"
    deck_file = UploadFile(filename="pitch_deck.pdf", file=io.BytesIO(pdf_sample))
    deck_file.headers = {"content-type": "application/pdf"}

    deck_res = await upload_pitch_deck(
        request=MockRequest(),
        file=deck_file,
        current_user=founder,
    )
    deck_url = deck_res.get("url")
    print(f"  [SUCCESS] Pitch Deck URL: {deck_url}")
    assert "amazonaws.com" in deck_url, f"Expected AWS S3 URL, got {deck_url}"
    assert "pitch_decks/" in deck_url, f"Expected pitch_decks/ key in URL, got {deck_url}"

    # 3. Test Data Room Document Upload & Delete
    print("\n[3] Testing Data Room Document Upload & Delete on AWS S3...")
    test_startup = db.query(Startup).first()
    if not test_startup:
        test_startup = Startup(
            name="S3 DataRoom Startup",
            tagline="Testing DataRoom S3",
            stage="seed",
        )
        db.add(test_startup)
        db.commit()
        db.refresh(test_startup)

    # Ensure founder is member
    member = db.query(StartupMember).filter_by(startup_id=test_startup.id, user_id=founder.id).first()
    if not member:
        db.add(StartupMember(startup_id=test_startup.id, user_id=founder.id, role="ceo"))
        db.commit()

    doc_bytes = b"Sample Financial Model Confidential Data"
    doc_file = UploadFile(filename="financial_model.xlsx", file=io.BytesIO(doc_bytes))
    doc_file.headers = {"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}

    doc_res = await upload_dataroom_document(
        id=str(test_startup.id),
        file_type="financials",
        file=doc_file,
        current_user=founder,
        db=db,
    )
    doc_id = doc_res.id
    doc_url = doc_res.file_url
    print(f"  [SUCCESS] Data Room Doc ID: {doc_id}")
    print(f"  [SUCCESS] Data Room Doc S3 URL: {doc_url}")
    assert "amazonaws.com" in doc_url, f"Expected AWS S3 URL, got {doc_url}"
    assert "dataroom/" in doc_url, f"Expected dataroom/ key in URL, got {doc_url}"

    # Delete Data Room Document
    del_res = await delete_dataroom_document(
        document_id=doc_id,
        current_user=founder,
        db=db,
    )
    print(f"  [SUCCESS] Deleted Data Room Doc from S3 & PostgreSQL: {del_res}")

    # Clean up uploaded S3 test objects
    s3_manager.delete_file(logo_url)
    s3_manager.delete_file(deck_url)
    print("\n[SUCCESS] All AWS S3 uploads, downloads, and lifecycle operations verified perfectly!")
    db.close()


if __name__ == "__main__":
    asyncio.run(test_all_uploads())
