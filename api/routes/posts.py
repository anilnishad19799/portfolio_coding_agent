import logging
from typing import List
from datetime import datetime
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import PostOut, PostCreate, PostUpdate
from ..auth import get_current_user, SECRET_KEY, ALGORITHM
from .. import crud

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Blog Posts"]
)

@router.get("/api/posts", response_model=List[PostOut])
def get_posts(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    return crud.get_posts(db, limit, offset)

@router.get("/api/admin/posts", response_model=List[PostOut])
def get_admin_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_admin_posts(db)

@router.get("/api/posts/{slug}", response_model=PostOut)
def get_post(
    slug: str,
    request: Request,
    db: Session = Depends(get_db)
):
    post = crud.get_post_by_slug(db, slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if post.status == "draft":
        # Allow admin to view drafts
        auth_header = request.headers.get("Authorization")
        is_admin = False
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if username:
                    user = db.query(User).filter(User.username == username).first()
                    if user:
                        is_admin = True
            except Exception:
                pass
        if not is_admin:
            raise HTTPException(status_code=404, detail="Post not found")
            
    return post

@router.post("/api/posts", response_model=PostOut, status_code=201)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = crud.get_post_by_slug(db, post_data.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    new_post = crud.create_post(db, post_data)
    logger.info(f"Admin created blog post: {new_post.title}")
    return new_post

@router.put("/api/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if post_data.slug and post_data.slug != post.slug:
        existing = crud.get_post_by_slug(db, post_data.slug)
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    updated_post = crud.update_post(db, post, post_data)
    logger.info(f"Admin updated blog post ID {post_id}")
    return updated_post

@router.delete("/api/posts/{post_id}", status_code=200)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = crud.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    crud.delete_post(db, post)
    logger.info(f"Admin deleted blog post ID {post_id}")
    return {"status": "success", "message": f"Post {post_id} deleted."}
