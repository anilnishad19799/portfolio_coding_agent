import os
import logging
import hashlib
from fastapi import APIRouter, Depends, BackgroundTasks, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import VisitorEventCreate, AnalyticsSummaryOut
from ..auth import get_current_user
from ..utils import get_client_ip, parse_user_agent, fetch_geolocation_task
from .. import crud

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.post("/event", status_code=201)
def log_analytics(
    event_data: VisitorEventCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    client_ip = get_client_ip(request)
    # Generate hashed IP to preserve privacy while counting unique visits
    salt = os.getenv("ANALYTICS_SALT", "portfolio-analytics-salt-xyz")
    ip_hash = hashlib.sha256((client_ip + salt).encode("utf-8")).hexdigest()
    
    browser, device_type = parse_user_agent(event_data.user_agent or request.headers.get("user-agent"))
    
    new_event = crud.create_visitor_event(
        db=db,
        event_type=event_data.event_type,
        path=event_data.path,
        referrer=event_data.referrer,
        user_agent=event_data.user_agent or request.headers.get("user-agent"),
        ip_hash=ip_hash,
        browser=browser,
        device_type=device_type
    )
    
    # Run geo-lookup in the background
    background_tasks.add_task(fetch_geolocation_task, new_event.id, client_ip)
    
    return {"status": "logged"}

@router.get("/summary", response_model=AnalyticsSummaryOut)
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_analytics_summary(db)
