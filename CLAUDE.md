# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Architecture

**Rearden** is a video-first hiring platform built as a Turborepo monorepo.

### Workspace Structure

- **apps/** - Applications
  - `web` - Vite + React 19 frontend (port 3000)
  - `api` - Hono + Node.js backend (port 3001)

- **packages/** - Shared packages
  - `@rearden/types` - Shared TypeScript types (raw .ts, no build step)
  - `@rearden/tsconfig` - Shared TypeScript configurations

### Key Patterns

- **Scope**: All packages use `@rearden/*` namespace
- **Types**: Import from `@rearden/types` — exported as raw `.ts` source
- **Styling**: SCSS Modules with camelCase-only class names
- **Animation**: Motion v12 (`import { motion } from "motion/react"`)
- **API**: Hono with typed `ApiResponse<T>` wrapper
- **Database**: Prisma 7 with SQLite (dev), generated client in `src/generated/prisma`
- **API runner**: `tsx` with watch mode for development

## Development Commands

```bash
# Run all apps in parallel
npm run dev

# Run specific app only
npm run dev -- --filter=web
npm run dev -- --filter=api

# Build all
npm run build

# Type check all workspaces
npm run check-types

# Format code
npm run format
```

## Important Details

- **Package Manager**: npm (v11.6.2+)
- **Node Version**: >=18
- **TypeScript**: v5.9.2 across all workspaces
- **Vite**: v6.x with @vitejs/plugin-react
- **Hono**: v4.x with @hono/node-server
- **Prisma**: v7.x with SQLite
- **React**: v19 with Motion v12

## Turborepo Filters

- `--filter=web` - Target the web app
- `--filter=api` - Target the API app
- `--filter=@rearden/types` - Target the types package

## Workspace Dependencies

Both `web` and `api` depend on `@rearden/types` via workspace protocol (`"@rearden/types": "*"`).
