from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ─── Project Schemas ──────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    html_url: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int = 0
    topics: List[str] = []
    category: str = "Other"
    display_order: int = 0

class ProjectCreate(ProjectBase):
    id: Optional[str] = None # Optional on creation, can generate UUID if empty

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    html_url: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: Optional[int] = None
    topics: Optional[List[str]] = None
    category: Optional[str] = None
    display_order: Optional[int] = None

class ProjectOut(ProjectBase):
    id: str
    is_custom: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectReorder(BaseModel):
    id: str
    display_order: int

# ─── Contact Schemas ──────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)

class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    subject: Optional[str]
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Analytics Schemas ────────────────────────────────────────────────────────

class VisitorEventCreate(BaseModel):
    event_type: str = Field(..., max_length=50)
    path: Optional[str] = Field(None, max_length=500)
    referrer: Optional[str] = Field(None, max_length=500)
    user_agent: Optional[str] = Field(None, max_length=1000)

class VisitorEventOut(BaseModel):
    id: int
    event_type: str
    path: Optional[str]
    referrer: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# ─── Post Schemas ─────────────────────────────────────────────────────────────

class PostBase(BaseModel):
    title: str
    slug: str
    content_md: str
    excerpt: Optional[str] = None
    tags: List[str] = []
    cover_image: Optional[str] = None
    status: str = "draft" # "draft" or "published"

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content_md: Optional[str] = None
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None

class PostOut(PostBase):
    id: int
    content_html: str
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ─── Settings Schemas ─────────────────────────────────────────────────────────

class SettingBase(BaseModel):
    key: str
    value: str

class SettingUpdate(BaseModel):
    value: str

class SettingOut(SettingBase):
    class Config:
        from_attributes = True

# ─── Analytics Summary Schemas ────────────────────────────────────────────────

class AnalyticsSummaryOut(BaseModel):
    total_views: int
    unique_visitors: int
    top_paths: List[dict]
    top_referrers: List[dict]
    browser_breakdown: List[dict]
    device_breakdown: List[dict]

