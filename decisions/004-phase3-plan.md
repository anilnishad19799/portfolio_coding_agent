# ADR 004: Blog CMS, Admin Dashboard & Analytics

- **Status:** Planned
- **Date:** 2026-06-21
- **Depends on:** Phase 2 completion ([003-phase2-plan.md](./003-phase2-plan.md))

---

## Context

With the FastAPI backend and SQLite database established in Phase 2, the platform is ready for content management, administrative tooling, and analytics. Phase 3 transforms the portfolio from a static showcase into a **content-driven personal platform** with blog publishing, a full admin dashboard, and visitor insights.

## Decision

Extend the backend and frontend with **blog CMS capabilities**, an **admin dashboard**, **visitor analytics**, and **production-readiness features** (custom domain, SEO, RSS).

## Components

### 1. Blog / Articles with Markdown Rendering

- **Storage:** Blog posts stored in SQLite (`posts` table)
  - Fields: `id`, `title`, `slug`, `content_md`, `content_html`, `excerpt`, `tags`, `cover_image`, `status` (draft/published), `published_at`, `created_at`, `updated_at`
- **Rendering:** Server-side Markdown → HTML conversion (Python `markdown` or `mistune` library)
- **Frontend:** Dedicated `/blog` page with post listing and `/blog/{slug}` for individual posts
- **Features:**
  - Syntax highlighting for code blocks (Prism.js or Highlight.js)
  - Table of contents generation for long posts
  - Tag-based filtering and search
  - Reading time estimation
  - Previous/Next post navigation

### 2. Admin CMS Dashboard

- **Tech:** React SPA or vanilla JavaScript (decision deferred to implementation)
- **Route:** `/admin` (protected, JWT-authenticated)
- **Capabilities:**
  - Create, edit, preview, and publish blog posts
  - Markdown editor with live preview
  - Manage projects (CRUD + reorder, extending Phase 2 API)
  - View and export contact form submissions
  - Upload and manage images/assets
  - Site settings (bio text, social links, featured projects)

### 3. Visitor Analytics Dashboard

- **Data Collection:** Extends Phase 2 `POST /api/analytics/event` endpoint
- **Metrics:**
  - Page views (per page, per day/week/month)
  - Unique visitors (fingerprint or session-based)
  - Referrer sources (direct, social, search engines)
  - Geographic distribution (via IP geolocation — MaxMind GeoLite2 or similar)
  - Device and browser breakdown (parsed from User-Agent)
  - Popular projects and blog posts
- **Dashboard UI:**
  - Time-series charts (Chart.js or D3.js)
  - Summary cards (total views, unique visitors, top pages)
  - Date range selector
  - Export to CSV

### 4. SEO Optimization

- **Technical SEO:**
  - `sitemap.xml` auto-generated from published pages and blog posts
  - `robots.txt` with appropriate directives
  - Canonical URLs on all pages
  - Structured data (JSON-LD) for Person, Article, and BreadcrumbList schemas
- **On-Page SEO:**
  - Unique `<title>` and `<meta description>` per page
  - Proper heading hierarchy (`h1` → `h2` → `h3`)
  - Image `alt` attributes and lazy loading
  - Fast load times (already optimized via Nginx gzip + caching)

### 5. Custom Domain + HTTPS

- **ngrok Reserved Domain:** Upgrade to ngrok paid plan for a stable subdomain (e.g., `anil-portfolio.ngrok.io`)
- **Custom Domain (Optional):**
  - Register domain (e.g., `anilportfolio.dev`)
  - Configure DNS CNAME to ngrok endpoint
  - HTTPS provided automatically by ngrok
- **Alternative:** Deploy to a VPS (e.g., DigitalOcean, Hetzner) with Let's Encrypt for full control

### 6. RSS Feed for Blog

- **Endpoint:** `/feed.xml` or `/rss.xml`
- **Format:** RSS 2.0 or Atom
- **Content:** Latest published blog posts with title, excerpt, link, and publication date
- **Auto-discovery:** `<link rel="alternate" type="application/rss+xml">` in HTML head

### 7. Open Graph Meta Tags

- **Per-Page Tags:**
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
  - Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- **Dynamic Generation:**
  - Blog posts: use post title, excerpt, and cover image
  - Projects: use project name, description, and language badge
  - Default: site-wide fallback image and description
- **Implementation:** Server-side rendering of meta tags via FastAPI template or injected into HTML

## New API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/posts` | No | List published blog posts |
| `GET` | `/api/posts/{slug}` | No | Get single blog post |
| `POST` | `/api/posts` | Admin | Create blog post |
| `PUT` | `/api/posts/{id}` | Admin | Update blog post |
| `DELETE` | `/api/posts/{id}` | Admin | Delete blog post |
| `GET` | `/api/analytics/summary` | Admin | Analytics summary data |
| `GET` | `/api/analytics/pageviews` | Admin | Page view time series |
| `GET` | `/api/analytics/referrers` | Admin | Referrer breakdown |
| `GET` | `/api/analytics/geo` | Admin | Geographic distribution |
| `GET` | `/api/analytics/export` | Admin | Export analytics CSV |
| `GET` | `/api/settings` | Admin | Get site settings |
| `PUT` | `/api/settings` | Admin | Update site settings |
| `GET` | `/feed.xml` | No | RSS feed |
| `GET` | `/sitemap.xml` | No | XML sitemap |

## Database Schema Additions

```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content_md TEXT NOT NULL,
    content_html TEXT NOT NULL,
    excerpt TEXT,
    tags TEXT,  -- JSON array
    cover_image TEXT,
    status TEXT DEFAULT 'draft',  -- 'draft' | 'published'
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extend visitors table from Phase 2
ALTER TABLE visitors ADD COLUMN geo_country TEXT;
ALTER TABLE visitors ADD COLUMN geo_city TEXT;
ALTER TABLE visitors ADD COLUMN device_type TEXT;
ALTER TABLE visitors ADD COLUMN browser TEXT;
```

## Consequences

### Positive

- Portfolio becomes a full personal platform (showcase + blog + analytics)
- Blog posts improve SEO and establish thought leadership
- Analytics provide insights without third-party tracking scripts
- Custom domain adds professionalism
- RSS feed enables content distribution

### Negative

- Significant increase in codebase complexity
- Admin dashboard requires its own testing and security hardening
- IP geolocation adds a dependency (GeoLite2 database updates)
- Content management requires ongoing maintenance (writing blog posts!)
- May need to migrate SQLite → PostgreSQL for better concurrent access

---

> **Previous:** [003-phase2-plan.md](./003-phase2-plan.md) — Backend Integration
