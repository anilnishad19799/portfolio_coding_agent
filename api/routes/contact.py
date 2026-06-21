import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ContactCreate, ContactOut
from ..auth import get_current_user
from ..utils import get_ip_hash, contact_rate_limits, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS
from .. import crud

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Contact Form"]
)

@router.post("/api/contact", status_code=201)
def submit_contact(
    contact_data: ContactCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    # Rate Limiting Check
    ip_hash = get_ip_hash(request)
    now = datetime.utcnow()
    
    if ip_hash not in contact_rate_limits:
        contact_rate_limits[ip_hash] = []
        
    # Clean up timestamps older than window
    contact_rate_limits[ip_hash] = [
        t for t in contact_rate_limits[ip_hash]
        if (now - t).total_seconds() < RATE_LIMIT_WINDOW_SECONDS
    ]
    
    if len(contact_rate_limits[ip_hash]) >= RATE_LIMIT_MAX_REQUESTS:
        logger.warning(f"Rate limit exceeded for contact form from hash {ip_hash}")
        raise HTTPException(
            status_code=429,
            detail="Too many contact submissions. Please try again in an hour."
        )
        
    new_contact = crud.create_contact(db, contact_data)
    
    # Record rate limit timestamp
    contact_rate_limits[ip_hash].append(now)
    
    logger.info(f"New contact submission received from {contact_data.name} ({contact_data.email})")
    return {"status": "success", "message": "Your message was sent successfully."}

@router.get("/api/contacts", response_model=List[ContactOut])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_contacts(db)

@router.delete("/api/contacts/{contact_id}", status_code=200)
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = crud.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact submission not found")
    crud.delete_contact(db, contact)
    return {"status": "success", "message": f"Contact message {contact_id} deleted."}
