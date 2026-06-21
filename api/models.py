import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, TypeDecorator
from .database import Base

class JSONEncodedType(TypeDecorator):
    """Represents a JSON-encoded list or dict stored as text in SQLite/databases."""
    impl = Text

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return []
        try:
            return json.loads(value)
        except Exception:
            return []

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True) # GitHub id (as string) or manual UUID
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    html_url = Column(String, nullable=True)
    language = Column(String, nullable=True)
    stargazers_count = Column(Integer, default=0)
    topics = Column(JSONEncodedType, default=list) # Stored as JSON string
    category = Column(String, default="Other")
    display_order = Column(Integer, default=0)
    is_custom = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class VisitorEvent(Base):
    __tablename__ = "visitor_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False) # e.g. "page_view", "click"
    path = Column(String, nullable=True)
    referrer = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    ip_hash = Column(String, nullable=True) # Hashed IP to preserve privacy while counting uniques
    geo_country = Column(String, nullable=True)
    geo_city = Column(String, nullable=True)
    device_type = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content_md = Column(Text, nullable=False)
    content_html = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    tags = Column(JSONEncodedType, default=list)
    cover_image = Column(String, nullable=True)
    status = Column(String, default="draft")  # "draft" | "published"
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
