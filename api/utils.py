import os
import hashlib
import logging
from typing import Optional, List, Dict
from datetime import datetime
from fastapi import Request
import httpx
from .database import SessionLocal
from .models import VisitorEvent

logger = logging.getLogger(__name__)

# Simple in-memory rate limiting dictionary: IP hash -> list of timestamps
contact_rate_limits: Dict[str, List[datetime]] = {}
RATE_LIMIT_WINDOW_SECONDS = 3600
RATE_LIMIT_MAX_REQUESTS = 5

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"

def is_public_ip(ip: str) -> bool:
    if ip in ("127.0.0.1", "localhost", "::1", "unknown"):
        return False
    parts = ip.split('.')
    if len(parts) == 4:
        try:
            p0, p1 = int(parts[0]), int(parts[1])
            if p0 == 10:
                return False
            if p0 == 192 and p1 == 168:
                return False
            if p0 == 172 and (16 <= p1 <= 31):
                return False
            if p0 == 169 and p1 == 254:
                return False
        except ValueError:
            return False
    return True

def parse_user_agent(user_agent_str: Optional[str]) -> tuple[str, str]:
    if not user_agent_str:
        return "Unknown", "Desktop"
    ua = user_agent_str.lower()
    if "ipad" in ua or "tablet" in ua:
        device = "Tablet"
    elif "mobi" in ua or "iphone" in ua or "android" in ua:
        device = "Mobile"
    else:
        device = "Desktop"
    if "edg" in ua or "edge" in ua:
        browser = "Edge"
    elif "opr" in ua or "opera" in ua:
        browser = "Opera"
    elif "chrome" in ua or "crios" in ua:
        browser = "Chrome"
    elif "firefox" in ua or "fxios" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    else:
        browser = "Other"
    return browser, device

def get_ip_hash(request: Request) -> str:
    ip = get_client_ip(request)
    salt = os.getenv("ANALYTICS_SALT", "portfolio-analytics-salt-xyz")
    return hashlib.sha256((ip + salt).encode("utf-8")).hexdigest()

async def fetch_geolocation_task(event_id: int, client_ip: str):
    if not is_public_ip(client_ip):
        logger.info(f"Skipping geo lookup for local/private IP: {client_ip}")
        return
    db = SessionLocal()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{client_ip}?fields=status,country,city", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    country = data.get("country")
                    city = data.get("city")
                    event = db.query(VisitorEvent).filter(VisitorEvent.id == event_id).first()
                    if event:
                        event.geo_country = country
                        event.geo_city = city
                        db.commit()
                        logger.info(f"Updated geo for event {event_id}: {city}, {country}")
    except Exception as e:
        logger.error(f"Error fetching geolocation for IP {client_ip}: {e}")
    finally:
        db.close()
