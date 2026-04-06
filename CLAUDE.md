# CFO Command Center — Claude Code Project Instructions

## What This Is
A conversational financial operating system for Dylan DiBona. Chat interface + dynamic dashboard + persistent knowledge base + proactive alerts. It manages M+P (S-Corp), Game of Thrones LLC (SF rental), Saratoga (NOLA duplex), Nice apartment (France), Chippewa (primary residence), Hidden Valley Ranch (NM land), and personal/investment accounts.

## Spec Documents
Read these in order before building. They are in the `/specs/` folder:
1. `01-Tech-Spec-v1.docx` — Foundation: architecture, 9 core DB tables, context injection, knowledge persistence, chat, tax engine, CPA export
2. `02-Addendum-Stack-Design-Notifications.docx` — Stack confirmation (Supabase + Vercel + Gmail API), light design system, voice/personality, notification cron jobs
3. `03-Addendum-Household-Tax-Strategy.docx` — Keelin's employment ($40K via Gusto), home office deductions, Sabine's 529, updated tax strategies
4. `04-Addendum-Document-Ingestion.docx` — Universal AI document parser, pattern learning, balance tracking
5. `05-Addendum-Property-Integration.docx` — Full property portfolio (7 entities, 15 accounts, 80+ knowledge facts, 11 action items, operational rules)
6. `06-Addendum-Document-Lifecycle.md` — Document inbox/filing workflow, automatic knowledge extraction from parsed documents, unpdf for serverless PDF parsing

Later addenda supersede earlier ones where they conflict. Seed data is cumulative.

## Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL) — 12 tables
- **AI:** Claude API (Sonnet) via @anthropic-ai/sdk
- **Auth:** Supabase Auth (email/password, single user)
- **File Storage:** Supabase Storage
- **Email:** Gmail API (googleapis package) from dylan@mondayandpartners.com
- **Hosting:** Vercel Pro, domain: cfo.mondayandpartners.com
- **Fonts:** Urbanist (UI chrome), Source Sans 3 (chat messages), JetBrains Mono (data/values)

## Build Phases (execute in order)
1. Scaffold Next.js app + install deps + configure env vars
2. Supabase schema (12 tables) + RLS + storage bucket + seed data
3. Core lib: context-builder, claude wrapper, knowledge extractor, gmail, google drive
4. API routes: /api/chat, /api/knowledge, /api/alerts, /api/parse, /api/entities, /api/strategies, /api/tax-estimate, /api/export, /api/cron/*
5. App shell + dashboard (light theme, warm whites, DM Sans)
6. Chat interface with streaming + conversation persistence
7. Notification system (Gmail API + Vercel cron jobs)
8. Google Drive integration for CPA exports
9. Deploy to Vercel + configure domain + seed production
10. Iterate — system is never "done"

## Design System (LIGHT theme)
- bg: #EDEBE7 (warm putty)
- surface: #FFFFFF
- border: rgba(0, 0, 0, 0.06)
- text: #0D0C0B
- accent: #1A8A7D (teal-green)
- warning: #E8A817
- danger: #D94242
- success: #2D8A4E
- NO dark mode. NO gradients. Warm, not cold. Dense but breathable.

### Entity Colors (no red/green — reserved for alerts)
- mp: #1A8A7D (teal)
- got: #5B6FC4 (slate blue)
- saratoga: #7C5CFC (violet)
- nice: #E8A817 (amber)
- chippewa: #E07C24 (orange)
- hvr: #8B6B4E (earth)
- personal: #4A90A4 (ocean blue)

## Voice
The AI talks like a smart friend who knows tax law. Direct, specific dollar amounts, opinionated, occasionally funny. Never condescending. "You should do this" not "you may want to consider." Always concrete numbers, not vague descriptions.

## Key Architecture Rules
- Knowledge base is the brain — every fact stored in DB, not conversations
- Context builder queries DB fresh on every Claude API call
- New facts extracted after every conversation (async)
- Facts have lineage (source, confidence, supersedes_id)
- Stale facts flagged, never deleted
- Documents parsed by Claude universally — no hardcoded templates
- System asks when it doesn't know (proactive_queue)

## Database: 12 Tables
entities, accounts, knowledge_base, conversations, transactions, tax_strategies, documents, proactive_queue, tax_estimates, notification_log, document_patterns, account_balances

## Entities (7)
mp, got, saratoga, nice, chippewa, hvr, personal

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
NOTIFICATION_EMAIL=dylan@mondayandpartners.com
```

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run seed` — Run seed data against Supabase

## Conventions
- TypeScript strict mode
- Server components by default, "use client" only when needed
- All DB access through Supabase client in server components/API routes
- Tailwind for styling, no CSS modules
- API routes stream Claude responses
