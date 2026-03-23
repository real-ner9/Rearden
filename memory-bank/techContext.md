# Tech Context — Rearden

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | Turborepo | 2.8.x |
| Frontend | Vite + React | 6.x + 19.x |
| Styling | SCSS Modules + CSS custom properties | sass 1.87 |
| Animation | Motion | 12.x |
| Routing | react-router-dom | 7.x |
| Backend | Hono + @hono/node-server | 4.x |
| WebSocket | @hono/node-ws | 1.x |
| ORM | Prisma | 7.x |
| DB adapter | @prisma/adapter-pg | 7.x |
| Database | PostgreSQL 17 (pgvector) | Docker |
| Types | @rearden/types (raw .ts) | workspace |
| Runtime | Node.js | >=18 |
| Package manager | npm | 11.6+ |
| TypeScript | All workspaces | 5.9.2 |

## Development Setup

```bash
# Prerequisites
# 1. Docker Desktop running
# 2. Node.js >= 18
# 3. npm >= 11.6

# Start database
docker compose up -d

# Install dependencies
npm install

# Generate Prisma client (after schema changes)
cd apps/api && npx prisma generate

# Run migrations
cd apps/api && npx prisma migrate dev

# Seed data
cd apps/api && npm run db:seed

# Start dev servers (both web + api)
npm run dev
```

## Key Configuration

### Database
- Docker container: `rearden-db` on port **5434** (not 5432, which is used by another project)
- Connection: `postgresql://rearden:rearden@localhost:5434/rearden?schema=public`
- Config: `apps/api/prisma.config.ts` using `defineConfig()` from `prisma/config`
- Schema: `apps/api/prisma/schema.prisma`
- Generated client: `apps/api/src/generated/prisma/` (gitignored)

### Prisma 7 Specifics
- `datasource.url` is NOT in schema.prisma — it's in `prisma.config.ts` via `env("DATABASE_URL")`
- PrismaClient requires `@prisma/adapter-pg`: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- `previewFeatures = ["fullTextSearchPostgres"]` enabled

### Frontend
- Vite config: `apps/web/vite.config.ts` with `@` path alias → `src/`
- API proxy: frontend calls `http://localhost:3001` directly (CORS enabled on API)

## Technical Constraints
- Windows development environment (affects shell commands — avoid `sed` with `$` variables)
- SCSS `$variables` can't be safely replaced via shell — use Node.js scripts or Edit tool
- Types package has no build step — consumed as raw `.ts` source
- Motion v12 import: `"motion/react"` (NOT `"framer-motion"`)
