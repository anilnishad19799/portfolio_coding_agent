# 📁 Decisions & Task Tracking

This folder contains **Architecture Decision Records (ADRs)** and **task tracking documents** for the Portfolio project.

## Purpose

- **Maintain context** across development phases and sessions
- **Document architectural decisions** with rationale and consequences
- **Track progress** through phase-specific task checklists
- **Plan future work** with structured phase outlines

## File Index

| File | Type | Description |
|------|------|-------------|
| [001-architecture.md](./001-architecture.md) | ADR | Architecture & technology stack decisions |
| [002-phase1-tasks.md](./002-phase1-tasks.md) | Task Tracker | Phase 1 implementation checklist |
| [003-phase2-plan.md](./003-phase2-plan.md) | Future Plan | Phase 2 — FastAPI + SQLite backend |
| [004-phase3-plan.md](./004-phase3-plan.md) | Future Plan | Phase 3 — Blog CMS, Admin & Analytics |

## ADR Format

Each Architecture Decision Record follows this structure:

1. **Title** — Short descriptive name
2. **Status** — `Proposed` | `Accepted` | `Deprecated` | `Superseded`
3. **Context** — Problem statement and background
4. **Decision** — What was decided and why
5. **Consequences** — Trade-offs, risks, and mitigations

## Conventions

- Files are numbered sequentially (`001-`, `002-`, etc.)
- Task trackers use `- [ ]` / `- [x]` checkboxes for progress tracking
- Future plans document scope before implementation begins
- Update the status field when decisions change
