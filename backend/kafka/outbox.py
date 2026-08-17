import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from models import KafkaOutbox
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.kafka.outbox")


def enqueue_outbox_event(
    db: Session,
    topic: str,
    payload: Dict[str, Any],
    event_type: Optional[str] = None,
    startup_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> KafkaOutbox:
    """
    Atomically enqueues a Kafka event into the PostgreSQL kafka_outbox table.
    Must be called within the caller's active database transaction before db.commit().
    """
    if not event_type:
        event_type = topic

    resolved_startup_id = str(startup_id) if startup_id else (str(payload.get("startup_id")) if payload.get("startup_id") else None)
    resolved_user_id = str(user_id) if user_id else (str(payload.get("user_id")) if payload.get("user_id") else (str(payload.get("founder_id")) if payload.get("founder_id") else None))

    envelope = EventEnvelope(
        event_id=str(uuid.uuid4()),
        event_type=event_type,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0",
        source_service="foundry-backend",
        correlation_id=str(uuid.uuid4()),
        startup_id=resolved_startup_id,
        user_id=resolved_user_id,
        payload=payload,
    )

    outbox_record = KafkaOutbox(
        id=uuid.uuid4(),
        topic=topic,
        payload=envelope.to_dict(),
        status="PENDING",
        retry_count=0,
    )

    db.add(outbox_record)
    logger.info(f"📥 Enqueued Outbox Event | Topic: {topic} | Event Type: {event_type} | ID: {outbox_record.id}")
    return outbox_record
