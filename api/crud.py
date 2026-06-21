import uuid
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import markdown

from .models import Project, Post, Contact, Setting, VisitorEvent
from .schemas import (
    ProjectCreate, ProjectUpdate,
    PostCreate, PostUpdate,
    ContactCreate, SettingUpdate
)

# ─── PROJECTS CRUD ───────────────────────────────────────────────────────────

def get_projects(db: Session) -> List[Project]:
    return db.query(Project).order_by(Project.display_order.asc(), Project.stargazers_count.desc()).all()

def get_project(db: Session, project_id: str) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()

def create_custom_project(db: Session, project_data: ProjectCreate) -> Project:
    project_id = project_data.id or str(uuid.uuid4())
    new_project = Project(
        id=project_id,
        name=project_data.name,
        description=project_data.description,
        html_url=project_data.html_url,
        language=project_data.language,
        stargazers_count=project_data.stargazers_count,
        topics=project_data.topics,
        category=project_data.category,
        display_order=project_data.display_order,
        is_custom=True
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

def update_project(db: Session, project: Project, project_data: ProjectUpdate) -> Project:
    project.is_custom = True
    for field, value in project_data.dict(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project

def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()

def reorder_projects(db: Session, order_data: List[Dict[str, int]]) -> None:
    for entry in order_data:
        p_id = entry.get("id")
        p_order = entry.get("display_order")
        if p_id is not None and p_order is not None:
            project = db.query(Project).filter(Project.id == p_id).first()
            if project:
                project.display_order = p_order
    db.commit()

# ─── BLOG POSTS CRUD ──────────────────────────────────────────────────────────

def get_posts(db: Session, limit: int = 10, offset: int = 0) -> List[Post]:
    return db.query(Post).filter(Post.status == "published")\
        .order_by(Post.published_at.desc())\
        .limit(limit).offset(offset).all()

def get_admin_posts(db: Session) -> List[Post]:
    return db.query(Post).order_by(Post.created_at.desc()).all()

def get_post_by_slug(db: Session, slug: str) -> Optional[Post]:
    return db.query(Post).filter(Post.slug == slug).first()

def get_post_by_id(db: Session, post_id: int) -> Optional[Post]:
    return db.query(Post).filter(Post.id == post_id).first()

def create_post(db: Session, post_data: PostCreate) -> Post:
    content_html = markdown.markdown(post_data.content_md, extensions=['fenced_code', 'toc'])
    published_at = datetime.utcnow() if post_data.status == "published" else None
    
    new_post = Post(
        title=post_data.title,
        slug=post_data.slug,
        content_md=post_data.content_md,
        content_html=content_html,
        excerpt=post_data.excerpt,
        tags=post_data.tags,
        cover_image=post_data.cover_image,
        status=post_data.status,
        published_at=published_at
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

def update_post(db: Session, post: Post, post_data: PostUpdate) -> Post:
    update_dict = post_data.dict(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(post, field, value)
        
    if "content_md" in update_dict:
        post.content_html = markdown.markdown(post.content_md, extensions=['fenced_code', 'toc'])
        
    if "status" in update_dict:
        if update_dict["status"] == "published" and not post.published_at:
            post.published_at = datetime.utcnow()
        elif update_dict["status"] == "draft":
            post.published_at = None
            
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return post

def delete_post(db: Session, post: Post) -> None:
    db.delete(post)
    db.commit()

# ─── CONTACT SUBMISSIONS CRUD ──────────────────────────────────────────────────

def create_contact(db: Session, contact_data: ContactCreate) -> Contact:
    new_contact = Contact(
        name=contact_data.name,
        email=contact_data.email,
        subject=contact_data.subject,
        message=contact_data.message
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

def get_contacts(db: Session) -> List[Contact]:
    return db.query(Contact).order_by(Contact.created_at.desc()).all()

def get_contact(db: Session, contact_id: int) -> Optional[Contact]:
    return db.query(Contact).filter(Contact.id == contact_id).first()

def delete_contact(db: Session, contact: Contact) -> None:
    db.delete(contact)
    db.commit()

# ─── SETTINGS CRUD ────────────────────────────────────────────────────────────

def get_settings(db: Session) -> List[Setting]:
    return db.query(Setting).all()

def update_setting(db: Session, key: str, setting_data: SettingUpdate) -> Setting:
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        setting = Setting(key=key, value=setting_data.value)
        db.add(setting)
    else:
        setting.value = setting_data.value
    db.commit()
    db.refresh(setting)
    return setting

# ─── ANALYTICS CRUD ───────────────────────────────────────────────────────────

def create_visitor_event(
    db: Session,
    event_type: str,
    path: Optional[str],
    referrer: Optional[str],
    user_agent: Optional[str],
    ip_hash: str,
    browser: str,
    device_type: str
) -> VisitorEvent:
    new_event = VisitorEvent(
        event_type=event_type,
        path=path,
        referrer=referrer,
        user_agent=user_agent,
        ip_hash=ip_hash,
        browser=browser,
        device_type=device_type
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

def get_analytics_summary(db: Session) -> Dict:
    total_views = db.query(VisitorEvent).filter(VisitorEvent.event_type == "page_view").count()
    unique_visitors = db.query(func.count(func.distinct(VisitorEvent.ip_hash))).scalar() or 0
    
    top_paths_query = db.query(VisitorEvent.path, func.count(VisitorEvent.id).label("count"))\
        .filter(VisitorEvent.event_type == "page_view")\
        .group_by(VisitorEvent.path)\
        .order_by(func.count(VisitorEvent.id).desc())\
        .limit(10).all()
    top_paths = [{"path": r[0] or "/", "count": r[1]} for r in top_paths_query]
    
    top_refs_query = db.query(VisitorEvent.referrer, func.count(VisitorEvent.id).label("count"))\
        .filter(VisitorEvent.event_type == "page_view")\
        .group_by(VisitorEvent.referrer)\
        .order_by(func.count(VisitorEvent.id).desc())\
        .limit(10).all()
    top_referrers = [{"referrer": r[0] or "Direct", "count": r[1]} for r in top_refs_query]
    
    browsers_query = db.query(VisitorEvent.browser, func.count(VisitorEvent.id).label("count"))\
        .group_by(VisitorEvent.browser)\
        .order_by(func.count(VisitorEvent.id).desc()).all()
    browser_breakdown = [{"browser": r[0] or "Unknown", "count": r[1]} for r in browsers_query]
    
    devices_query = db.query(VisitorEvent.device_type, func.count(VisitorEvent.id).label("count"))\
        .group_by(VisitorEvent.device_type)\
        .order_by(func.count(VisitorEvent.id).desc()).all()
    device_breakdown = [{"device": r[0] or "Unknown", "count": r[1]} for r in devices_query]
    
    return {
        "total_views": total_views,
        "unique_visitors": unique_visitors,
        "top_paths": top_paths,
        "top_referrers": top_referrers,
        "browser_breakdown": browser_breakdown,
        "device_breakdown": device_breakdown
    }
