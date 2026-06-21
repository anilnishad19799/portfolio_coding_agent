# ADR 003: Backend Integration — FastAPI + SQLite

- **Status:** Completed
- **Date:** 2026-06-21
- **Depends on:** Phase 1 completion ([002-phase1-tasks.md](./002-phase1-tasks.md))

---

## Context

Phase 1 relies entirely on client-side GitHub API calls, which are subject to a **60 req/hr rate limit** (unauthenticated). There is no backend to handle contact form submissions, persist project data overrides, or provide admin functionality. Phase 2 introduces a lightweight backend to solve these limitations.

## Decision

Add a **FastAPI (Python) backend** with **SQLite** storage, running as a Docker service behind the existing Nginx reverse proxy.

## Components

### 1. FastAPI Backend Service

- Python 3.11+ with FastAPI + Uvicorn
- Containerized with its own `Dockerfile.api`
- Runs as a separate service in Docker Compose
- Health check endpoint: `GET /api/health`

### 2. SQLite Database

- Single-file database stored in a Docker volume
- Tables:
  - `projects` — GitHub repo data + manual overrides
  - `contacts` — Form submissions
  - `visitors` — Basic analytics events
  - `users` — Admin credentials (hashed passwords)
- Migrations managed via Alembic or manual SQL scripts

### 3. GitHub API Caching (Server-Side)

- Background task (APScheduler or FastAPI `BackgroundTasks`)
- Fetches all repos hourly using a **GitHub Personal Access Token** (5,000 req/hr)
- Stores repo metadata in `projects` table
- Frontend calls `/api/projects` instead of GitHub directly
- Eliminates client-side rate limit concerns entirely

### 4. Contact Form Endpoint

- `POST /api/contact` — accepts name, email, message
- Stores submission in `contacts` table with timestamp
- Optional: send email notification via SMTP (configurable)
- Rate limiting to prevent spam (e.g., 5 submissions per IP per hour)
- Honeypot field for basic bot protection

### 5. Admin Authentication (JWT)

- `POST /api/auth/login` — returns access + refresh tokens
- JWT tokens with configurable expiry
- Protected routes via FastAPI dependency injection
- Single admin user (seeded via environment variable or CLI command)

### 6. Project CRUD API

- `GET /api/projects` — list all projects (public)
- `GET /api/projects/{id}` — single project detail (public)
- `POST /api/projects` — add a manual project (admin)
- `PUT /api/projects/{id}` — edit/override GitHub data (admin)
- `DELETE /api/projects/{id}` — remove a project (admin)
- `PATCH /api/projects/reorder` — change display order (admin)

### 7. Visitor Analytics Collection

- `POST /api/analytics/event` — log page view, referrer, user agent
- Lightweight — no third-party analytics dependency
- Data aggregation queries for Phase 3 dashboard

### 8. Nginx Reverse Proxy Update

```nginx
# API requests → FastAPI container
location /api/ {
    proxy_pass http://api:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Everything else → static files
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

### 9. Docker Compose Update

```yaml
services:
  web:
    build: .
    ports:
      - "80:80"
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    volumes:
      - db-data:/app/data
    environment:
      - DATABASE_URL=sqlite:///data/portfolio.db
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST:-}
      - SMTP_PORT=${SMTP_PORT:-587}

volumes:
  db-data:
```

### 10. Dockerfile.api

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/projects` | No | List all projects |
| `GET` | `/api/projects/{id}` | No | Get single project |
| `POST` | `/api/projects` | Admin | Create project |
| `PUT` | `/api/projects/{id}` | Admin | Update project |
| `DELETE` | `/api/projects/{id}` | Admin | Delete project |
| `PATCH` | `/api/projects/reorder` | Admin | Reorder projects |
| `POST` | `/api/contact` | No | Submit contact form |
| `POST` | `/api/auth/login` | No | Admin login |
| `POST` | `/api/analytics/event` | No | Log analytics event |

## Consequences

### Positive

- Eliminates GitHub API rate limit for visitors
- Enables contact form without third-party services
- Admin can curate and reorder displayed projects
- Foundation for Phase 3 (blog, analytics dashboard)

### Negative

- Adds operational complexity (second container, database backups)
- Requires GitHub Personal Access Token management
- SQLite may need migration to PostgreSQL if write concurrency increases

---

> **Next:** [004-phase3-plan.md](./004-phase3-plan.md) — Blog CMS, Admin Dashboard & Analytics
