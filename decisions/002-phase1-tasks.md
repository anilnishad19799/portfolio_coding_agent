# Phase 1 Task Tracker — Static Frontend

- **Status:** Completed
- **Target:** Static HTML/CSS/JS portfolio with Docker + Nginx + ngrok

---

## 🏗️ Foundation

- [x] **Project structure setup**
  - Directory layout (`src/`, `assets/`, `css/`, `js/`)
  - `index.html` boilerplate
  - Git repository initialization

- [x] **Design system (CSS tokens & themes)**
  - CSS custom properties (colors, spacing, typography, shadows)
  - Dark and light theme token sets
  - Base reset / normalize styles
  - Utility classes and responsive breakpoints

## 📄 Sections

- [x] **Hero section**
  - Full-viewport intro with name, title, tagline
  - Call-to-action buttons (View Projects, Contact)
  - Animated background or subtle visual effect

- [x] **About Me section with GitHub stats**
  - Professional bio / summary
  - GitHub contribution stats (repos, stars, commits)
  - Profile image or avatar

- [x] **Skills / Tech Stack section**
  - Categorized skill badges (Languages, Frameworks, Tools, Cloud)
  - Visual skill indicators or icons
  - Responsive grid layout

- [x] **Projects grid + GitHub API integration**
  - Fetch repos from GitHub REST API (`/users/{username}/repos`)
  - Display project cards (name, description, language, stars, forks)
  - Filter/sort by language, stars, or recency
  - `localStorage` caching with TTL (1-hour default)
  - Graceful fallback when API rate-limited
  - "View on GitHub" links

- [x] **Experience timeline**
  - Professional work history in vertical timeline layout
  - Role, company, date range, key achievements
  - Visual connectors between timeline entries

- [x] **Education section + certifications**
  - Degree(s) and institutions
  - Relevant certifications with issuer and date
  - Badge or icon display

- [x] **Contact section**
  - Contact form (name, email, message)
  - Social links (GitHub, LinkedIn, Twitter/X, email)
  - Form validation (client-side)
  - Integration with third-party form service (Formspree or similar) — *or defer to Phase 2*

## ✨ Polish & UX

- [x] **Dark / Light theme toggle**
  - Toggle button with icon swap (sun/moon)
  - Persist preference in `localStorage`
  - Respect `prefers-color-scheme` on first visit
  - Smooth transition between themes

- [x] **Scroll animations**
  - Intersection Observer API for reveal-on-scroll effects
  - Staggered animation delays for grouped elements
  - Reduced motion support (`prefers-reduced-motion`)

- [x] **Responsive design**
  - Mobile-first approach
  - Breakpoints: mobile (< 768px), tablet (768–1024px), desktop (> 1024px)
  - Hamburger menu for mobile navigation
  - Touch-friendly tap targets

## 🐳 Infrastructure

- [x] **Docker + Nginx setup**
  - `Dockerfile` with Nginx base image
  - `nginx.conf` with gzip, caching headers, SPA fallback
  - Static files served from `/usr/share/nginx/html`

- [x] **ngrok integration**
  - ngrok container or host-side tunnel
  - Expose port 80 (Nginx) publicly
  - Document the public URL workflow

- [x] **Docker Compose orchestration**
  - `docker-compose.yml` with web service
  - Volume mount for live development (`./src:/usr/share/nginx/html`)
  - Port mapping and network configuration
  - `.env` file for configurable variables (ngrok auth token, etc.)

## 🧪 Final

- [x] **Testing & polish**
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Lighthouse audit (Performance, Accessibility, SEO, Best Practices)
  - Validate HTML (W3C validator)
  - Check all links and API error states
  - README with setup instructions

---

## Progress

> **Completed:** 16 / 16 tasks
