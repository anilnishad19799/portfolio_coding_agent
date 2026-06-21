import os
import asyncio
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models import User
from .auth import get_password_hash
from .github_cache import sync_github_projects

# Import routers
from .routes.auth import router as auth_router
from .routes.projects import router as projects_router
from .routes.contact import router as contact_router
from .routes.posts import router as posts_router
from .routes.analytics import router as analytics_router
from .routes.settings import router as settings_router
from .routes.feeds import router as feeds_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nishad Anil Portfolio API",
    description="Backend API supporting caching, contact forms, auth, and analytics (SOLID Refactored).",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your portfolio domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(contact_router)
app.include_router(posts_router)
app.include_router(analytics_router)
app.include_router(settings_router)
app.include_router(feeds_router)

# ─── Startup Tasks ────────────────────────────────────────────────────────────

async def run_initial_sync():
    await asyncio.sleep(2) # brief delay to let server start
    db = SessionLocal()
    try:
        logger.info("Running initial GitHub projects sync...")
        await sync_github_projects(db)
    finally:
        db.close()

async def github_sync_loop():
    while True:
        try:
            await asyncio.sleep(3600) # Sync every hour
            db = SessionLocal()
            try:
                logger.info("Scheduled sync: Updating GitHub projects...")
                await sync_github_projects(db)
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("GitHub sync scheduler task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in GitHub sync loop: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
def startup_event():
    # 1. Seed Admin User
    db = SessionLocal()
    try:
        admin_user = os.getenv("ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_PASSWORD", "")
        
        if admin_pass:
            existing = db.query(User).filter(User.username == admin_user).first()
            if not existing:
                logger.info(f"Seeding admin user: {admin_user}")
                hashed = get_password_hash(admin_pass)
                db.add(User(username=admin_user, hashed_password=hashed))
                db.commit()
            else:
                # Update password in case it changed in .env
                existing.hashed_password = get_password_hash(admin_pass)
                db.commit()
                logger.info(f"Updated credentials for user: {admin_user}")
        else:
            logger.warning("No ADMIN_PASSWORD set in environment. Skipping admin seed.")
    finally:
        db.close()

    # 2. Start GitHub sync loops
    asyncio.create_task(run_initial_sync())
    asyncio.create_task(github_sync_loop())

@app.get("/api/health", status_code=200, tags=["Health"])
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}
