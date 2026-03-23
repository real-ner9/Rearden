# Active Context — Rearden

## Current State
The platform is feature-complete at MVP level with a real PostgreSQL database. All core flows work: landing, search, feed, profiles, chat, registration, resume view.

## Recent Changes (latest session)
1. **PostgreSQL migration** — replaced all in-memory mock data stores with Prisma 7 + PostgreSQL
   - Created `docker-compose.yml` with pgvector/pgvector:pg17 on port 5434
   - Full Prisma schema: Candidate, Recruiter, Post, Vacancy, Conversation, ChatMessage
   - Seed script with all mock data (12 candidates, 9 posts, 5 vacancies, 5 conversations)
   - All route handlers rewritten to use Prisma queries (async)
   - chatStore, autoReply, and WebSocket handler updated for async DB operations

2. **Dark theme + visual redesign** (previous session) — complete overhaul from LinkedIn-like light theme
   - Dark glass morphism design system
   - Instagram Reels-style vertical video feed
   - Mobile bottom tab navigation
   - Notification popup dropdown
   - Video-dominant candidate cards (3:4 portrait)

## Active Decisions
- Mock data files (`mockCandidates.ts`, `mockPosts.ts`, `mockVacancies.ts`) are still in the codebase but no longer imported by routes — kept as reference for seed script
- `chatStore.ts` functions are now async (returns Promises) — all consumers updated
- Port 5434 used for PostgreSQL (5432 occupied by another Docker project on this machine)

## What to Work On Next
- Authentication (no auth currently — single hardcoded recruiter-1)
- Real video upload to cloud storage (currently saves to local `uploads/` dir)
- Candidate self-service (edit profile, create posts/vacancies via UI)
- pgvector-based semantic search (schema has pgvector extension ready)
- CLAUDE.md needs update: says "SQLite" but we now use PostgreSQL

## Known Issues
- No authentication — anyone can access any endpoint
- Upload saves files locally — not suitable for production
- Search loads all candidates into memory then filters (fine for 12, won't scale)
- Auto-reply uses sequential pool — not contextual AI responses
- `vite-env.d.ts` committed but maybe should be gitignored
