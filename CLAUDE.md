# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a **Turborepo monorepo** containing Next.js applications and shared packages.

### Workspace Structure

- **apps/** - Next.js applications
  - `web` - Main application (runs on port 3000)
  - `docs` - Documentation site (runs on port 3001)

- **packages/** - Shared packages
  - `@repo/ui` - Shared React component library
  - `@repo/eslint-config` - Shared ESLint configurations
  - `@repo/typescript-config` - Shared TypeScript configurations

### UI Package Architecture

The `@repo/ui` package uses **direct path exports** - components are exported via `"./*": "./src/*.tsx"` in package.json. This means:
- Import components as `import { Button } from "@repo/ui/button"`
- Each component file in `src/` is directly accessible
- No barrel exports (index.ts) are used

All UI components are client components (`"use client"` directive).

## Development Commands

### Running the Development Server

```bash
# Run all apps in parallel
npm run dev

# Run specific app only
npm run dev -- --filter=web
npm run dev -- --filter=docs
```

### Building

```bash
# Build all apps and packages
npm run build

# Build specific app
npm run build -- --filter=web
npm run build -- --filter=docs
```

### Linting

```bash
# Lint all apps and packages
npm run lint

# Lint specific workspace
npm run lint -- --filter=web
```

### Type Checking

```bash
# Check types across all workspaces
npm run check-types

# Check types in specific workspace
npm run check-types -- --filter=web
```

### Formatting

```bash
# Format all TypeScript, TSX, and Markdown files
npm run format
```

### Component Generation

```bash
# Generate new React component in @repo/ui
cd packages/ui
npm run generate:component
```

## Important Details

- **Package Manager**: npm (v11.6.2+)
- **Node Version**: >=18
- **Turborepo**: Uses task pipelines with dependency ordering (^build, ^lint, ^check-types)
- **TypeScript**: v5.9.2 across all workspaces
- **Next.js**: v16.2.0 with React 19.2.0
- **Caching**: Turborepo caches build outputs in `.next/` (excluding `.next/cache/`)

## Turborepo Filters

When working with specific apps or packages, use `--filter`:
- `--filter=web` - Target the web app
- `--filter=docs` - Target the docs app
- `--filter=@repo/ui` - Target the UI package

## Workspace Dependencies

Apps (`web` and `docs`) depend on `@repo/ui` via workspace protocol (`"@repo/ui": "*"`). Changes to UI components are automatically reflected in both apps during development.
