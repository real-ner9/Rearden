# Progress — Rearden

## What Works

### Frontend (apps/web)
- [x] Landing page with hero, features, stats, CTA
- [x] Search page with text query + filters (skills, location, experience, availability)
- [x] Candidate profile with Instagram-style tabs (Posts / Video / Vacancies)
- [x] Reels-style vertical video feed (snap scroll, keyboard/touch/wheel navigation)
- [x] Real-time chat (WebSocket) with sidebar, conversations, typing indicators
- [x] Registration form with video upload + resume upload (XHR progress bars)
- [x] Resume page (formatted text + download button)
- [x] Dark theme with glass morphism tokens
- [x] Mobile bottom tab navigation
- [x] Desktop top navbar with notification popup
- [x] Page transitions with Motion animations
- [x] Responsive design (mobile 375px → desktop)

### Backend (apps/api)
- [x] RESTful API with Hono (candidates, posts, vacancies, chat, search, upload)
- [x] WebSocket chat with auto-reply simulation
- [x] PostgreSQL database via Prisma 7
- [x] Full schema: Candidate, Recruiter, Post, Vacancy, Conversation, ChatMessage
- [x] Seed script with realistic mock data
- [x] File upload endpoint (local storage)
- [x] Text-based search engine with scoring

### Infrastructure
- [x] Turborepo monorepo with shared types
- [x] Docker Compose for PostgreSQL (pgvector/pg17)
- [x] TypeScript strict mode across all workspaces
- [x] Build and type-check passing

## What's Left to Build
- [ ] Authentication (JWT or session-based)
- [ ] Authorization (role-based access control)
- [ ] Cloud file storage (S3/R2 for video and resume uploads)
- [ ] Candidate self-service dashboard (edit profile, create posts)
- [ ] pgvector semantic search (embeddings for better matching)
- [ ] Email notifications
- [ ] Admin panel
- [ ] Production deployment setup
- [ ] Testing (unit, integration, e2e)
- [ ] Rate limiting and input validation
- [ ] Proper error pages (404, 500)

## Evolution of Decisions

| When | Decision | Reason |
|------|----------|--------|
| Start | Next.js scaffold from create-turbo | Default Turborepo template |
| Phase 1 | Replaced Next.js with Vite+React | Simpler SPA, no SSR needed |
| Phase 1 | Added Hono API | Lightweight, TypeScript-native |
| Phase 2 | Light theme, LinkedIn-like layout | Quick MVP |
| Phase 3 | Dark theme + Reels redesign | Too similar to LinkedIn, needed differentiation |
| Phase 3 | Bottom nav on mobile | Instagram/TikTok-like mobile UX |
| Phase 4 | SQLite → PostgreSQL | Need real DB, pgvector for future AI search |
| Phase 4 | Added @prisma/adapter-pg | Prisma 7 requires driver adapter pattern |
