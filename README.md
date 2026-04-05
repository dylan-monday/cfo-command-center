# CFO Command Center

A conversational financial operating system built with Next.js, Supabase, and Claude AI.

## Overview

Personal CFO assistant that manages multiple business entities and properties through a chat interface + dynamic dashboard + persistent knowledge base + proactive alerts.

**Entities managed:**
- M+P (S-Corp)
- Game of Thrones LLC (SF rental)
- Saratoga (NOLA duplex)
- Nice apartment (France)
- Chippewa (primary residence)
- Hidden Valley Ranch (NM land)
- Personal/investment accounts

## Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL) — 12 tables
- **AI:** Claude API (Sonnet) via @anthropic-ai/sdk
- **Email:** Gmail API for notifications
- **Hosting:** Vercel Pro at cfo.mondayandpartners.com

## Design System

Light theme with warm minimalism. See `specs/design-guidance.md` for full spec.

- **Background:** #EDEBE7 (warm putty)
- **Accent:** #1A8A7D (teal-green)
- **Fonts:**
  - Urbanist (UI chrome)
  - Source Sans 3 (chat messages)
  - JetBrains Mono (data/values)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in Supabase, Anthropic, Google API keys

# Run development server
npm run dev

# Seed database
npm run seed

# Production build
npm run build
```

## Key Features

- **Chat Interface:** Streaming responses with conversation persistence
- **Knowledge Base:** Facts extracted from conversations, documents, and manual entry
- **Property Manager Mode:** Operational context for rental properties
- **CPA Packet Generator:** PDF export with Google Drive integration
- **Proactive Alerts:** Deadlines, questions, and action items

## Documentation

- `CLAUDE.md` — Project instructions for Claude Code
- `specs/design-guidance.md` — Complete design system spec
- `specs/LAUNCH-GUIDE.md` — Deployment checklist
- `backlog.md` — Feature roadmap and completed items

## API Routes

- `/api/chat` — Conversational endpoint with streaming
- `/api/entities` — Entity management
- `/api/knowledge` — Knowledge base CRUD
- `/api/alerts` — Proactive queue items
- `/api/strategies` — Tax strategies
- `/api/cpa-packet` — PDF generation
- `/api/cron/*` — Scheduled jobs (drive sweep, deadline check, etc.)
