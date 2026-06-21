# ADR 001: Portfolio Architecture & Technology Stack

- **Status:** Accepted
- **Date:** 2026-06-21
- **Author:** Anil

---

## Context

Need a personal portfolio website to showcase **40+ GitHub repositories**, professional experience, skills, and contact information. The solution should be incrementally buildable — starting simple and layering complexity only when justified.

## Decision

Adopt a **3-phase approach** that evolves from a static site to a full-stack application:

### Phase 1 — Static Frontend (Current)

| Component | Technology |
|-----------|-----------|
| Frontend | Static HTML / CSS / JavaScript |
| Web Server | Nginx (containerized) |
| Tunneling | ngrok (public access without hosting) |
| GitHub Data | Client-side GitHub REST API calls |
| Caching | `localStorage` with TTL-based expiry |
| Containerization | Docker + Docker Compose |

**Key Principle:** Zero backend dependencies. Everything runs in the browser.

### Phase 2 — Backend Integration (Planned)

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python) |
| Database | SQLite |
| GitHub Caching | Server-side hourly refresh via background task |
| Contact Form | POST endpoint → SQLite + optional SMTP |
| Auth | JWT tokens for admin access |
| Reverse Proxy | Nginx: `/api/*` → FastAPI container |

### Phase 3 — Blog CMS & Analytics (Planned)

| Component | Technology |
|-----------|-----------|
| Blog | Markdown articles stored in SQLite |
| Admin | CMS dashboard (React or vanilla JS) |
| Analytics | Visitor tracking (page views, referrers, geo) |
| SEO | Open Graph tags, RSS feed, sitemap |
| Domain | Custom domain + HTTPS via ngrok reserved domain |

## Rationale

- **Phase 1 stays zero-dependency** — no server, no database, no build tools. Fastest path to a live portfolio.
- **Backend adds value only when dynamic content and caching are needed** — Phase 2 unlocks server-side GitHub API caching, contact form processing, and admin project management.
- **Phase 3 adds content management** — a blog and analytics dashboard justify the full-stack complexity.
- **Docker from Day 1** — ensures consistent environments and makes adding services (FastAPI, databases) trivial in later phases.
- **ngrok for tunneling** — eliminates cloud hosting costs during development while providing public access.

## Consequences

### Positive

- Phase 1 can be built and deployed in a single session
- Each phase is independently deployable and testable
- Docker Compose makes multi-service orchestration straightforward
- No vendor lock-in — all open-source tooling

### Negative

- **Phase 1 is limited to 60 req/hr** on the GitHub REST API (unauthenticated rate limit)
  - **Mitigation:** `localStorage` caching with configurable TTL (default: 1 hour)
  - **Full fix in Phase 2:** Server-side caching eliminates client rate limit concerns
- Phase 1 contact form requires a third-party service (e.g., Formspree) or deferred to Phase 2
- ngrok free tier has ephemeral URLs (changes on restart)
  - **Mitigation:** ngrok reserved domain in Phase 3, or upgrade to paid plan earlier

## References

- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/rate-limit)
- [ngrok Documentation](https://ngrok.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
