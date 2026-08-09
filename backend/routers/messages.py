from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.security import get_current_user
from models import User, Startup, StartupMember, Conversation, Message, ConversationRead
from schemas import ConversationCreate, MessageCreate, MessageResponse, ConversationResponse
from typing import List
from datetime import datetime

router = APIRouter(prefix="/conversations", tags=["Messages"])


def serialize_conversation(
    convo: Conversation, startup_name: str | None = None, unread: bool = False
) -> dict:
    return {
        "id": str(convo.id),
        "startup_id": str(convo.startup_id),
        "startup_name": startup_name,
        "investor_id": str(convo.investor_id),
        "founder_id": str(convo.founder_id),
        "created_at": convo.created_at,
        "unread": unread,
    }


def serialize_message(msg: Message) -> dict:
    return {
        "id": str(msg.id),
        "conversation_id": str(msg.conversation_id),
        "sender_id": str(msg.sender_id),
        "body": msg.body,
        "created_at": msg.created_at,
    }


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "investor":
        raise HTTPException(
            status_code=403, detail="Only investors can start a conversation."
        )

    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    startup = (
        db.query(Startup)
        .filter(Startup.id == payload.startup_id, Startup.status == "approved")
        .first()
    )
    if not startup:
        raise HTTPException(
            status_code=404, detail="Startup not found or not approved."
        )

    founder_member = (
        db.query(StartupMember)
        .filter(StartupMember.startup_id == startup.id, StartupMember.role == "ceo")
        .first()
    )

    if not founder_member:
        raise HTTPException(
            status_code=400, detail="No founder found for this startup."
        )

    existing = (
        db.query(Conversation)
        .filter(
            Conversation.startup_id == startup.id,
            Conversation.investor_id == current_user.id,
        )
        .first()
    )

    if existing:
        return serialize_conversation(existing, startup.name)

    convo = Conversation(
        startup_id=startup.id,
        investor_id=current_user.id,
        founder_id=founder_member.user_id,
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)

    return serialize_conversation(convo, startup.name)


@router.get("")
async def list_conversations(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role == "founder":
        convos = (
            db.query(Conversation, Startup)
            .join(Startup, Conversation.startup_id == Startup.id)
            .filter(Conversation.founder_id == current_user.id)
            .all()
        )
    elif current_user.role == "investor":
        convos = (
            db.query(Conversation, Startup)
            .join(Startup, Conversation.startup_id == Startup.id)
            .filter(Conversation.investor_id == current_user.id)
            .all()
        )
    else:
        raise HTTPException(
            status_code=403, detail="Not authorized to view conversations."
        )

    response = []
    for convo, startup in convos:
        latest_msg = (
            db.query(Message)
            .filter(Message.conversation_id == convo.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        read_state = (
            db.query(ConversationRead)
            .filter(
                ConversationRead.conversation_id == convo.id,
                ConversationRead.user_id == current_user.id,
            )
            .first()
        )

        unread = False
        if latest_msg and latest_msg.sender_id != current_user.id:
            if not read_state or not read_state.last_read_at:
                unread = True
            elif (
                latest_msg.created_at
                and latest_msg.created_at > read_state.last_read_at
            ):
                unread = True

        response.append(serialize_conversation(convo, startup.name, unread))

    return response


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role == "founder":
        convos = (
            db.query(Conversation)
            .filter(Conversation.founder_id == current_user.id)
            .all()
        )
    elif current_user.role == "investor":
        convos = (
            db.query(Conversation)
            .filter(Conversation.investor_id == current_user.id)
            .all()
        )
    else:
        raise HTTPException(
            status_code=403, detail="Not authorized to view conversations."
        )

    unread_count = 0
    for convo in convos:
        latest_msg = (
            db.query(Message)
            .filter(Message.conversation_id == convo.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        if not latest_msg or latest_msg.sender_id == current_user.id:
            continue

        read_state = (
            db.query(ConversationRead)
            .filter(
                ConversationRead.conversation_id == convo.id,
                ConversationRead.user_id == current_user.id,
            )
            .first()
        )
        if not read_state or not read_state.last_read_at:
            unread_count += 1
        elif latest_msg.created_at and latest_msg.created_at > read_state.last_read_at:
            unread_count += 1

    return {"count": unread_count}


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in [convo.founder_id, convo.investor_id]:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this conversation."
        )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == convo.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    read_state = (
        db.query(ConversationRead)
        .filter(
            ConversationRead.conversation_id == convo.id,
            ConversationRead.user_id == current_user.id,
        )
        .first()
    )
    if not read_state:
        read_state = ConversationRead(
            conversation_id=convo.id,
            user_id=current_user.id,
            last_read_at=datetime.utcnow(),
        )
        db.add(read_state)
    else:
        read_state.last_read_at = datetime.utcnow()
    db.commit()

    return [serialize_message(msg) for msg in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in [convo.founder_id, convo.investor_id]:
        raise HTTPException(
            status_code=403, detail="Not authorized to send a message here."
        )

    msg = Message(
        conversation_id=convo.id, sender_id=current_user.id, body=payload.body.strip()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    recipient_id = str(convo.investor_id) if current_user.id == convo.founder_id else str(convo.founder_id)

    from kafka.manager import kafka_manager
    from kafka.topics import KafkaTopics

    await kafka_manager.publish_event(
        topic=KafkaTopics.MESSAGE_SENT,
        event_type="message.sent",
        user_id=str(current_user.id),
        startup_id=str(convo.startup_id),
        payload={
            "message_id": str(msg.id),
            "conversation_id": str(convo.id),
            "sender_id": str(current_user.id),
            "recipient_id": recipient_id,
            "startup_id": str(convo.startup_id),
        },
    )

    return serialize_message(msg)
