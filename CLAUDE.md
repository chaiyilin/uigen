# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and Claude generates the code with a live preview rendered in an iframe.

## Commands

```bash
# Development
npm run dev                # Start dev server with Turbopack (port 3000)
npm run setup              # Install deps, generate Prisma client, run migrations

# Testing & Quality
npm run test               # Run Vitest tests
npm run lint               # ESLint

# Database
npm run db:reset           # Reset SQLite database
npx prisma studio          # Open Prisma GUI
```

## Architecture

### Core Patterns

1. **Virtual File System** (`src/lib/file-system.ts`): In-memory file structure that never writes to disk. Serializable for database persistence. Used by AI tools to manage generated code.

2. **AI Integration**: Vercel AI SDK with Claude API streaming. The chat endpoint (`src/app/api/chat/route.ts`) uses tool calling for file operations. Falls back to mock provider when no API key is set.

3. **State Management**: React Context for chat (`src/lib/contexts/chat-context.tsx`) and file system (`src/lib/contexts/file-system-context.tsx`). No external state library.

4. **Preview Rendering**: JSX is compiled at runtime using Babel Standalone (`src/lib/transform/jsx-transformer.ts`) and rendered in an iframe.

### Key Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/lib/tools/` - AI agent tools (str-replace, file-manager)
- `src/lib/prompts/` - System prompts for component generation
- `src/actions/` - Server Actions for auth and project CRUD
- `src/components/` - UI components (chat, editor, preview, auth)

### Database

SQLite with Prisma. Two models:
- `User` - email/password auth with bcrypt
- `Project` - stores messages and file system data as JSON strings

### Authentication

JWT-based sessions (7-day expiry) managed in `src/lib/auth.ts`. Middleware protects API routes. Supports anonymous mode with local work tracking.

## Code Style

- Use comments sparingly. Only comment complex code.

## Tech Stack

- Next.js 15 (App Router, Server Actions)
- React 19, TypeScript
- Tailwind CSS v4
- Prisma (SQLite)
- Monaco Editor
- Radix UI primitives
- Vitest for testing
