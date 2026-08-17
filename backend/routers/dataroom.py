import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Startup, User, StartupMember, DataRoomDocument, DataRoomAccessRequest
from core.security import get_current_user
from schemas import (
    DataRoomDocumentResponse,
    DataRoomAccessRequestResponse,
    DataRoomAccessRequestRespond,
)
from utils.s3_manager import s3_manager
import logging

logger = logging.getLogger("foundry.routers.dataroom")

router = APIRouter(tags=["DataRoom"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def verify_startup_ownership(startup_id: str, current_user: User, db: Session) -> Startup:
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    is_member = (
        db.query(StartupMember)
        .filter(StartupMember.startup_id == startup.id, StartupMember.user_id == current_user.id)
        .first()
        is not None
    )
    is_admin = current_user.role == "admin"

    if not (is_member or is_admin):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You must be a founder or team member of this startup",
        )
    return startup


@router.post("/startups/{id}/dataroom/request-access", response_model=DataRoomAccessRequestResponse)
async def request_dataroom_access(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    startup = db.query(Startup).filter(Startup.id == id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    existing = (
        db.query(DataRoomAccessRequest)
        .filter(
            DataRoomAccessRequest.startup_id == startup.id,
            DataRoomAccessRequest.investor_id == current_user.id,
        )
        .first()
    )

    if existing:
        return DataRoomAccessRequestResponse(
            id=str(existing.id),
            startup_id=str(existing.startup_id),
            investor_id=str(existing.investor_id),
            status=existing.status,
            requested_at=existing.requested_at,
            investor_name=current_user.name,
            investor_email=current_user.email,
        )

    new_req = DataRoomAccessRequest(
        id=uuid.uuid4(),
        startup_id=startup.id,
        investor_id=current_user.id,
        status="pending",
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return DataRoomAccessRequestResponse(
        id=str(new_req.id),
        startup_id=str(new_req.startup_id),
        investor_id=str(new_req.investor_id),
        status=new_req.status,
        requested_at=new_req.requested_at,
        investor_name=current_user.name,
        investor_email=current_user.email,
    )


@router.get("/startups/{id}/dataroom/requests", response_model=List[DataRoomAccessRequestResponse])
async def get_dataroom_requests(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_startup_ownership(id, current_user, db)

    requests = (
        db.query(DataRoomAccessRequest, User)
        .join(User, DataRoomAccessRequest.investor_id == User.id)
        .filter(DataRoomAccessRequest.startup_id == id)
        .order_by(DataRoomAccessRequest.requested_at.desc())
        .all()
    )

    res = []
    for req, inv in requests:
        res.append(
            DataRoomAccessRequestResponse(
                id=str(req.id),
                startup_id=str(req.startup_id),
                investor_id=str(req.investor_id),
                status=req.status,
                requested_at=req.requested_at,
                investor_name=inv.name,
                investor_email=inv.email,
            )
        )
    return res


@router.post("/dataroom/requests/{request_id}/respond", response_model=DataRoomAccessRequestResponse)
async def respond_dataroom_request(
    request_id: str,
    payload: DataRoomAccessRequestRespond,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(DataRoomAccessRequest).filter(DataRoomAccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Access request not found")

    verify_startup_ownership(str(req.startup_id), current_user, db)

    if payload.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    req.status = payload.status
    db.commit()
    db.refresh(req)

    inv = db.query(User).filter(User.id == req.investor_id).first()

    return DataRoomAccessRequestResponse(
        id=str(req.id),
        startup_id=str(req.startup_id),
        investor_id=str(req.investor_id),
        status=req.status,
        requested_at=req.requested_at,
        investor_name=inv.name if inv else None,
        investor_email=inv.email if inv else None,
    )


@router.post("/startups/{id}/dataroom/documents", response_model=DataRoomDocumentResponse)
async def upload_dataroom_document(
    id: str,
    file_type: str = Form("other"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    startup = verify_startup_ownership(id, current_user, db)

    ext = Path(file.filename or "").suffix
    unique_filename = f"dataroom_{startup.id}_{uuid.uuid4().hex[:8]}{ext}"
    s3_key = f"dataroom/{startup.id}/{unique_filename}"

    content = await file.read()
    try:
        s3_url = s3_manager.upload_file(content, s3_key, content_type=file.content_type)
    except Exception as e:
        logger.error(f"❌ Failed to upload data room document to AWS S3: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to upload document to AWS S3: {str(e)}"
        )

    doc = DataRoomDocument(
        id=uuid.uuid4(),
        startup_id=startup.id,
        file_name=file.filename,
        file_url=s3_url,
        file_type=file_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DataRoomDocumentResponse(
        id=str(doc.id),
        startup_id=str(doc.startup_id),
        file_name=doc.file_name,
        file_url=doc.file_url,
        file_type=doc.file_type,
        created_at=doc.created_at,
    )


@router.delete("/dataroom/documents/{document_id}")
async def delete_dataroom_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(DataRoomDocument).filter(DataRoomDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    verify_startup_ownership(str(doc.startup_id), current_user, db)

    # Delete object from AWS S3 if stored there
    if doc.file_url:
        try:
            s3_manager.delete_file(doc.file_url)
        except Exception as e:
            logger.warning(f"⚠️ Could not delete S3 object {doc.file_url}: {e}")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}


@router.get("/dataroom/documents/{document_id}/download-url")
async def get_dataroom_document_download_url(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(DataRoomDocument).filter(DataRoomDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Data room document not found")

    startup = db.query(Startup).filter(Startup.id == doc.startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Associated startup not found")

    is_member = (
        db.query(StartupMember)
        .filter(StartupMember.startup_id == startup.id, StartupMember.user_id == current_user.id)
        .first()
        is not None
    )
    is_admin = current_user.role == "admin"
    is_founder = is_member or is_admin

    access_req = (
        db.query(DataRoomAccessRequest)
        .filter(
            DataRoomAccessRequest.startup_id == startup.id,
            DataRoomAccessRequest.investor_id == current_user.id,
            DataRoomAccessRequest.status == "approved",
        )
        .first()
    )

    if not (is_founder or access_req is not None):
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Founder approval required to view this confidential data room document."
        )

    # Generate pre-signed URL (1-hour expiry)
    try:
        presigned_url = s3_manager.generate_presigned_url(
            doc.file_url,
            expires_in=3600,
            filename=doc.file_name,
            inline=True,
        )
    except Exception as e:
        logger.error(f"❌ Failed to generate pre-signed URL for document {document_id}: {e}")
        presigned_url = doc.file_url

    return {
        "url": presigned_url,
        "file_name": doc.file_name,
        "file_type": doc.file_type,
        "expires_in": 3600,
    }


@router.get("/startups/{id}/dataroom/documents")
async def get_dataroom_documents(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    startup = db.query(Startup).filter(Startup.id == id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    is_member = (
        db.query(StartupMember)
        .filter(StartupMember.startup_id == startup.id, StartupMember.user_id == current_user.id)
        .first()
        is not None
    )
    is_admin = current_user.role == "admin"
    is_founder = is_member or is_admin

    access_req = (
        db.query(DataRoomAccessRequest)
        .filter(
            DataRoomAccessRequest.startup_id == startup.id,
            DataRoomAccessRequest.investor_id == current_user.id,
        )
        .first()
    )

    request_status = access_req.status if access_req else "none"
    access_granted = is_founder or (access_req is not None and access_req.status == "approved")

    documents = []
    if access_granted:
        docs = (
            db.query(DataRoomDocument)
            .filter(DataRoomDocument.startup_id == startup.id)
            .order_by(DataRoomDocument.created_at.desc())
            .all()
        )
        for d in docs:
            # Generate pre-signed URL for private S3 storage
            view_url = d.file_url
            if d.file_url and ("amazonaws.com" in d.file_url or "dataroom/" in d.file_url):
                try:
                    view_url = s3_manager.generate_presigned_url(
                        d.file_url,
                        expires_in=3600,
                        filename=d.file_name,
                        inline=True,
                    )
                except Exception as presign_err:
                    logger.warning(f"⚠️ Could not generate pre-signed URL for {d.file_url}: {presign_err}")

            documents.append(
                DataRoomDocumentResponse(
                    id=str(d.id),
                    startup_id=str(d.startup_id),
                    file_name=d.file_name,
                    file_url=view_url,
                    file_type=d.file_type,
                    created_at=d.created_at,
                )
            )

    return {
        "access_granted": access_granted,
        "is_founder": is_founder,
        "request_status": request_status,
        "documents": documents,
    }
