# Rearden

Video-first hiring platform.

## Structure

| Path | Description |
|------|-------------|
| `apps/web` | Vite + React 19 frontend |
| `apps/api` | Hono + Node.js API |
| `packages/types` | Shared TypeScript types |
| `packages/tsconfig` | Shared TS configurations |

## Getting Started

```bash
npm install
cd apps/api && npx prisma generate && cd ../..
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
