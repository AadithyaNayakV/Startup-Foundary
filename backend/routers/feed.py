from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.security import get_current_user
from models import User, Post, PostReply
from schemas import PostCreate, ReplyCreate, PostResponse, PostReplyResponse
from typing import List

router = APIRouter(prefix="/feed", tags=["Feed"])


def serialize_post(post: Post, reply_count: int, author: User = None) -> dict:
    return {
        "id": str(post.id),
        "author_id": str(post.author_id),
        "author_name": author.name if author else None,
        "author_role": author.role if author else post.author_role,
        "content": post.content,
        "created_at": post.created_at,
        "reply_count": reply_count,
    }


def serialize_reply(reply: PostReply, author: User = None) -> dict:
    return {
        "id": str(reply.id),
        "post_id": str(reply.post_id),
        "author_id": str(reply.author_id),
        "author_name": author.name if author else None,
        "author_role": author.role if author else None,
        "content": reply.content,
        "created_at": reply.created_at,
    }


@router.post("", response_model=PostResponse)
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Post content cannot be empty.")

    post = Post(
        author_id=current_user.id,
        author_role=current_user.role or "unknown",
        content=payload.content.strip(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return serialize_post(post, 0, author=current_user)


@router.get("", response_model=List[PostResponse])
async def list_posts(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    rows = (
        db.query(Post, User)
        .outerjoin(User, Post.author_id == User.id)
        .order_by(Post.created_at.desc())
        .all()
    )

    response = []
    for post, author in rows:
        reply_count = db.query(PostReply).filter(PostReply.post_id == post.id).count()
        response.append(serialize_post(post, reply_count, author))

    return response


@router.get("/{post_id}")
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post_tuple = (
        db.query(Post, User)
        .outerjoin(User, Post.author_id == User.id)
        .filter(Post.id == post_id)
        .first()
    )
    if not post_tuple:
        raise HTTPException(status_code=404, detail="Post not found")

    post, post_author = post_tuple

    replies = (
        db.query(PostReply, User)
        .outerjoin(User, PostReply.author_id == User.id)
        .filter(PostReply.post_id == post.id)
        .order_by(PostReply.created_at.asc())
        .all()
    )
    reply_payload = [
        serialize_reply(reply, author) for reply, author in replies
    ]

    return {
        "post": serialize_post(post, len(reply_payload), post_author),
        "replies": reply_payload,
    }


@router.post("/{post_id}/reply", response_model=PostReplyResponse)
async def reply_to_post(
    post_id: str,
    payload: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Reply content cannot be empty.")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reply = PostReply(
        post_id=post.id, author_id=current_user.id, content=payload.content.strip()
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return serialize_reply(reply, author=current_user)
