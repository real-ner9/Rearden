# System Patterns — Rearden

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Turborepo                   │
├─────────────┬─────────────┬─────────────────┤
│  apps/web   │  apps/api   │ packages/types  │
│  Vite+React │  Hono+Node  │ Shared TS types │
│  port 3000  │  port 3001  │ (raw .ts, no    │
│             │             │  build step)    │
└──────┬──────┴──────┬──────┴─────────────────┘
       │             │
       │  HTTP/WS    │  Prisma 7
       │             │
       │        ┌────┴────┐
       │        │ Postgres│
       │        │ pgvector│
       │        │ :5434   │
       │        └─────────┘
       │
  Browser (SPA)
```

## Frontend Patterns

### Styling
- **SCSS Modules** — `Component.module.scss` with camelCase class names
- **Design tokens** — CSS custom properties in `_tokens.scss`, SCSS vars in `_variables.scss`
- **Mixins** — `_mixins.scss` (container, glass, moduleHeader, button3d, raisedButton, truncate)
- **Breakpoints** — `mobile` (≤640px), `tablet` (≤1024px), `desktop` (>1024px)

### Components
- Each component: `ComponentName/ComponentName.tsx` + `ComponentName.module.scss`
- Shared components in `src/components/` (Button, Input, Select, SkillTag, etc.)
- Page-specific sub-components co-located in page folder (e.g., `pages/Chat/ChatSidebar.tsx`)

### Data Fetching
- `useApi<T>(path)` hook — generic fetcher with loading/error states
- `apiFetch<T>(path, options)` — typed fetch wrapper for mutations
- `useSearch(query, filters)` — debounced search hook
- `useWebSocket()` — chat WebSocket connection via ChatContext

### Animation
- Motion v12: `import { motion, AnimatePresence } from "motion/react"`
- `layoutId` for tab indicators (spring animation)
- Page transitions via `PageTransition` wrapper
- Hover/tap effects on cards and buttons

### Navigation
- **Desktop**: top navbar with logo, nav links, notification bell
- **Mobile**: bottom tab bar (Home, Search, Feed, Chat, Profile), no top logo
- Notification popup dropdown (not a separate page)

## Backend Patterns

### API Structure
- Hono routes return `ApiResponse<T>` = `{ success: true, data: T } | { success: false, error: string }`
- Routes: `/api/candidates`, `/api/posts`, `/api/vacancies`, `/api/chat`, `/api/search`, `/api/upload`
- WebSocket at `/ws` for real-time chat

### Database
- Prisma 7 + PostgreSQL via `@prisma/adapter-pg` driver adapter
- Client singleton in `src/lib/db.ts`
- Schema: Candidate, Recruiter, Post, Vacancy, Conversation, ChatMessage
- Seed script: `prisma/seed.ts` with 12 candidates, 9 posts, 5 vacancies, 5 conversations

### Chat System
- `chatStore.ts` — async functions backed by Prisma (getConversations, addMessage, etc.)
- `chatWebSocket.ts` — broadcast to all connected clients
- `autoReply.ts` — simulated candidate responses with typing indicators (2-5s delay)

### File Upload
- `POST /api/upload` — multipart form, saves to `uploads/` directory
- `GET /api/upload/:filename` — serves uploaded files with correct content-type
