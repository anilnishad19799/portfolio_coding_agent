# Phase 2 & 3 Code Refactoring — SOLID Principles Refactoring Plan

- **Status:** In Progress
- **Date:** 2026-06-21
- **Focus:** Backend code restructuring to enforce Single Responsibility, Interface Segregation, and Dependency Inversion.

---

## 🔍 Current SOLID Violations

### 1. Monolithic Route File (`api/main.py`)
* **Violates SRP (Single Responsibility Principle):** The file has multiple responsibilities:
  1. FastAPI application configuration & CORS setup.
  2. Database table creation (`Base.metadata.create_all`).
  3. Utility helper methods (client IP fetching, public IP check, user agent parser, IP hashing).
  4. Scheduled background loops for GitHub repo synchronization.
  5. Seeding logic for the default admin credentials.
  6. Endpoint route mappings for projects, blogging, contact forms, auth, sitemaps, RSS feeds, and visitor tracking.
  7. Direct database CRUD querying (SQLAlchemy query execution logic is written inline inside route functions).

### 2. High Coupling & Low Cohesion
* Route endpoints import auth config and decryption logic directly, leading to circular dependency risks and making code reuse or unit testing hard.

---

## 🏗️ Refactored Architecture

We will split the backend into specialized folders and files:

```
api/
├── main.py                  # Lean app bootstrap (config, middleware, startup event)
├── database.py              # Engine & session setup
├── models.py                # Database models
├── schemas.py               # Pydantic schemas
├── auth.py                  # JWT Auth helpers & dependency overrides
├── github_cache.py          # GitHub background sync logic
├── crud.py                  # [NEW] Isolated database query CRUD repository layer
├── utils.py                 # [NEW] Request/IP parsing & client hashing utilities
└── routes/                  # [NEW] Modular endpoint routers
    ├── auth.py              # Login endpoints
    ├── projects.py          # Public and admin project API
    ├── contact.py           # Contact forms inbox & form submission API
    ├── posts.py             # Public blog detail/lists & admin CMS API
    ├── analytics.py         # Visitor events & dashboard statistics
    ├── settings.py          # Configuration storage APIs
    └── feeds.py             # Sitemap XML & RSS XML feeds
```

---

## 🛠️ Implementation Strategy

### Step 1: Extract Utilities (`api/utils.py`)
Move functions mapping IPs, parsing user agent types, performing external geolocation calls, and hashing client identifier addresses.

### Step 2: Extract CRUD Operations (`api/crud.py`)
Define database CRUD repositories isolating SQLAlchemy `query()`, `add()`, `commit()`, and `delete()` commands out of route logic.

### Step 3: Create Individual Routers (`api/routes/*.py`)
Define individual routers with input/output validation models:
* `routes/auth.py`
* `routes/projects.py`
* `routes/contact.py`
* `routes/posts.py`
* `routes/analytics.py`
* `routes/settings.py`
* `routes/feeds.py`

### Step 4: Re-initialize `api/main.py`
Clean out old code, include the newly defined routers, setup startup handlers, and delegate background loop scheduling.
