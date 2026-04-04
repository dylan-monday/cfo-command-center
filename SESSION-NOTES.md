# CFO Command Center - Session Notes

## Phase 1: Project Scaffold
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

1. **Next.js App Creation**
   - Created Next.js 14+ app with App Router, TypeScript, and Tailwind CSS
   - Used `create-next-app@latest` with `--typescript --tailwind --app --eslint --src-dir`

2. **Dependencies Installed**
   - `@supabase/supabase-js` - Supabase client
   - `@supabase/ssr` - Server-side Supabase utilities
   - `@anthropic-ai/sdk` - Claude API integration
   - `googleapis` - Gmail API and Google Drive API
   - `crypto-js` - Transaction hash generation for deduplication
   - `papaparse` - CSV parsing
   - `pdf-parse` - PDF text extraction
   - Dev types: `@types/crypto-js`, `@types/papaparse`

3. **Environment Configuration**
   - Fixed `.env.local` format (removed errant `- ` prefixes)
   - Configured all required variables:
     - Supabase: URL, anon key, service role key
     - Anthropic Claude API key
     - Google OAuth: client ID, client secret
     - Notification email

4. **Design System (Light Theme)**
   - Configured Tailwind with warm color palette from Addendum #1:
     - Background: `#FAFAF9` (warm white)
     - Surface: `#FFFFFF`
     - Accent: `#1A8A7D` (teal-green)
     - Status colors: success, warning, danger
   - Loaded Google Fonts: DM Sans (body), JetBrains Mono (data/labels)
   - Removed dark mode per spec

5. **Project Structure Created**
   ```
   src/
     app/
       api/
         chat/, parse/, knowledge/, alerts/, export/
         entities/, strategies/, tax-estimate/
         cron/weekly-digest/, deadline-check/, staleness-check/, quarterly-memo/
     components/
       panels/
     lib/
       parsers/
     types/
   ```

6. **TypeScript Types**
   - Created comprehensive types for all 12 database tables
   - Includes: entities, accounts, knowledge_base, conversations, transactions,
     tax_strategies, documents, proactive_queue, tax_estimates, notification_log,
     document_patterns, account_balances
   - Added API request/response types and Database interface

7. **Supabase Client**
   - Created `src/lib/supabase.ts` with browser, server, and admin clients
   - Typed with Database interface for full type safety

8. **Git Repository**
   - Initialized with `main` branch
   - Added GitHub remote: `dylandibona/cfo-command-center`
   - Committed Phase 1 with descriptive message

### Challenges Faced

1. **Docx File Reading**
   - Built-in Read tool couldn't read binary `.docx` files
   - Solved by extracting XML content via `unzip` and parsing with Perl

2. **Non-Empty Directory**
   - `create-next-app` wouldn't run in directory with existing files
   - Solved by temporarily moving files, creating app, then restoring

3. **Tailwind v4 Syntax**
   - Next.js 16 uses Tailwind CSS v4 with new `@theme inline` directive
   - Updated globals.css to use new syntax with CSS custom properties

4. **Environment File Format**
   - Original `.env.local` had `- ` prefix on each line (from copy/paste)
   - Fixed by rewriting with proper format and comments

### Next Steps (Phase 2)

1. Create Supabase migration SQL for all 12 tables
2. Enable Row Level Security with appropriate policies
3. Create storage bucket for documents
4. Run seed data for all entities, accounts, knowledge base, strategies, alerts
5. Verify database connection from app

### Files Created/Modified

| File | Description |
|------|-------------|
| `src/app/layout.tsx` | Root layout with DM Sans + JetBrains Mono fonts |
| `src/app/globals.css` | Design system with light theme colors |
| `src/app/page.tsx` | Simple placeholder showing Phase 1 complete |
| `src/lib/supabase.ts` | Supabase client configuration |
| `src/types/index.ts` | All TypeScript interfaces for database |
| `.env.local` | Fixed environment variables |
| `.gitignore` | Added client_secret*.json exclusion |

### Notes

- Spec documents are `.docx` files in `/specs/` - these are the source of truth
- Later addenda supersede earlier ones where they conflict
- Design system is LIGHT MODE ONLY - no dark mode per spec
- Entity count: 7 (mp, got, saratoga, nice, chippewa, hvr, personal)
- Table count: 12 (across all 4 addenda)

---

## Phase 2: Supabase Schema, RLS, Storage, and Seed Data
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

1. **Database Schema (12 Tables)**
   - Created `supabase/migrations/001_initial_schema.sql`
   - All 12 tables with proper constraints and CHECK clauses:
     - `entities` - Business/property entities with type constraints
     - `accounts` - Financial accounts linked to entities
     - `knowledge_base` - Fact storage with source/confidence tracking
     - `conversations` - Chat history with extracted facts
     - `transactions` - Financial transactions with deduplication hash
     - `tax_strategies` - Tax optimization strategies with status tracking
     - `documents` - Uploaded documents with AI parsing metadata
     - `proactive_queue` - Alerts, questions, recommendations, deadlines
     - `tax_estimates` - Point-in-time tax projections
     - `notification_log` - Notification tracking (email, in-app, push)
     - `document_patterns` - Learned extraction patterns
     - `account_balances` - Historical balance snapshots

2. **Indexes**
   - Created comprehensive indexes for query performance
   - Partial indexes for common queries (e.g., open alerts, CPA-flagged strategies)
   - Composite indexes for status + priority lookups

3. **Triggers**
   - `update_updated_at()` function for auto-updating timestamps
   - Applied to entities, accounts, conversations, tax_strategies tables

4. **Row Level Security**
   - Created `supabase/migrations/002_rls_policies.sql`
   - Enabled RLS on all 12 tables
   - CRUD policies for authenticated users (single-user system)

5. **Storage Bucket**
   - Created `supabase/migrations/003_storage_bucket.sql`
   - Private 'documents' bucket with 50MB limit
   - Allowed MIME types: PDF, images, CSV, Excel, Word
   - Storage policies for authenticated upload/read/delete

6. **Seed Data Script**
   - Created `src/scripts/seed.ts` (TypeScript)
   - Added `npm run seed` command in package.json
   - Installed `tsx` dev dependency for running TypeScript scripts

   **Seed Data Contents:**
   - 7 entities (mp, got, saratoga, nice, chippewa, hvr, personal)
   - 15 accounts across all entities
   - 120+ knowledge base facts covering:
     - Tax/filing information
     - Family details (Keelin, Sabine)
     - M+P business operations
     - GOT property details (tenants, PM, financials)
     - Saratoga property details (PM issues, water bill)
     - Nice property details (FBAR, carrying costs)
     - Chippewa residence details
     - Hidden Valley Ranch details
   - 17 tax strategies with status, impact, and action items
   - 20+ proactive queue items (alerts, questions, deadlines)

### Challenges Faced

1. **TypeScript Strict Typing**
   - Initial seed script failed build due to type inference issues
   - Solved by creating explicit interface types for insert operations
   - Used `createClient` without generic type to simplify

2. **Table Creation Order**
   - `document_patterns` needed to be created before `documents` for FK
   - `accounts` needed FK added after creation for circular reference

### Files Created

| File | Description |
|------|-------------|
| `supabase/migrations/001_initial_schema.sql` | All 12 tables, indexes, triggers |
| `supabase/migrations/002_rls_policies.sql` | RLS enable + CRUD policies |
| `supabase/migrations/003_storage_bucket.sql` | Documents bucket + policies |
| `src/scripts/seed.ts` | TypeScript seed script with all data |

### Seed Data Summary

| Data Type | Count |
|-----------|-------|
| Entities | 7 |
| Accounts | 15 |
| Knowledge Facts | 120+ |
| Tax Strategies | 17 |
| Proactive Queue Items | 20+ |

### Deployment Status

- Migrations executed in Supabase SQL Editor (April 4, 2026)
- Seed script ran successfully: `npm run seed`
- Database fully populated and operational

### Notes

- Migrations are designed to run in Supabase SQL Editor
- Seed script uses service role key (bypasses RLS)
- Storage path convention: `{entity_slug}/{year}/{doc_type}/{filename}`
- All strategies have `cpa_flag` boolean for CPA review items
- Added `dotenv` package for seed script env loading

---

## Phase 3: Core Library and API Routes
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

**Core Library (`src/lib/`):**

1. **`context-builder.ts`** - System context assembly
   - `buildSystemContext(entitySlug?)` - Queries all relevant data from Supabase
   - `buildChatMessages(userMessage, conversationHistory?, entitySlug?)` - Assembles messages array for Claude
   - Generates rich system prompt with CFO personality and all context data
   - Entity filtering when contextually appropriate

2. **`claude.ts`** - Claude API wrapper
   - `chat(userMessage, options)` - Non-streaming single response
   - `chatStream(userMessage, options)` - Async generator for streaming
   - `createChatStream(userMessage, options)` - Returns ReadableStream for API routes
   - `parseDocument(content, context)` - Document parsing with type/entity detection
   - `extractFactsFromResponse(userMessage, assistantResponse)` - Fact extraction

3. **`knowledge-extractor.ts`** - Fact persistence
   - `extractAndPersistFacts(userMessage, assistantResponse, conversationId?)` - Main entry point
   - `persistFacts(facts, source, referenceId?)` - Handles deduplication and superseding
   - Automatically marks old facts as 'stale' when values change
   - Uses Claude to extract structured facts from conversations

4. **`gmail.ts`** - Email notifications
   - `sendEmail(to, subject, htmlBody, textBody?)` - Base email sending
   - `sendDeadlineReminder(alertId, message, dueDate, priority)` - Deadline alerts
   - `sendWeeklyDigest(stats)` - Weekly summary email
   - `sendCriticalAlert(alertId, message, entityName?)` - Immediate critical alerts
   - Styled HTML emails matching design system

**API Routes (`src/app/api/`):**

1. **`/api/chat`**
   - POST: Streaming chat with context injection
   - Uses TransformStream to capture full response for post-processing
   - Persists conversations to database
   - Fire-and-forget fact extraction after response
   - GET: List all conversations

2. **`/api/knowledge`**
   - GET: List/search facts with entity/category filtering
   - POST: Add new fact (handles superseding existing)
   - PATCH: Update fact value or verify
   - DELETE: Mark fact as stale (soft delete)

3. **`/api/alerts`**
   - GET: List alerts with priority sorting (critical first)
   - POST: Create new alert
   - PATCH: Update status/priority/message
   - DELETE: Hard delete alert

4. **`/api/parse`**
   - POST: Upload file, extract text (PDF via pdf-parse), parse with Claude
   - Detects source from filename/content patterns (Chase, Schwab, etc.)
   - Creates proactive queue items for questions
   - GET: List documents with filtering

5. **`/api/entities`**
   - GET: List all entities with counts, or single entity with related data
   - POST: Create new entity
   - PATCH: Update entity

6. **`/api/strategies`**
   - GET: List strategies with stats (total savings, CPA flag count)
   - POST: Create new strategy
   - PATCH: Update strategy
   - DELETE: Deprecate (soft) or hard delete

### Challenges Faced

1. **Supabase Type Inference (`never` types)**
   - Problem: Without generated Supabase types, all queries returned `never` type
   - Error: `Property 'id' does not exist on type 'never'`
   - Solution: Updated `src/lib/supabase.ts` to use permissive `any` typing
   - Future: Generate proper types with `npx supabase gen types typescript`

2. **TransformStream API**
   - Problem: Tried to add custom `chunks` property to TransformStream constructor
   - Error: `Object literal may only specify known properties`
   - Solution: Used closure variable `collectedChunks[]` instead of `this.chunks`

3. **pdf-parse ESM Import**
   - Problem: Dynamic import of pdf-parse failed type checking
   - Error: `Property 'default' does not exist on type`
   - Solution: Cast import to `any` for permissive typing

4. **Validation Warnings (False Positives)**
   - Warning: "searchParams is async in Next.js 16"
   - These warnings apply to page components where searchParams is a prop
   - In API routes, `new URL(request.url).searchParams` is synchronous
   - Ignored these warnings as they don't apply to API route handlers

### Files Created

| File | Lines | Description |
|------|-------|-------------|
| `src/lib/context-builder.ts` | ~150 | System context assembly for Claude |
| `src/lib/claude.ts` | ~250 | Claude API wrapper with streaming |
| `src/lib/knowledge-extractor.ts` | ~120 | Fact extraction and persistence |
| `src/lib/gmail.ts` | ~200 | Gmail API notification emails |
| `src/app/api/chat/route.ts` | ~180 | Streaming chat endpoint |
| `src/app/api/knowledge/route.ts` | ~330 | Knowledge base CRUD |
| `src/app/api/alerts/route.ts` | ~310 | Proactive queue management |
| `src/app/api/parse/route.ts` | ~320 | Document parsing |
| `src/app/api/entities/route.ts` | ~305 | Entity management |
| `src/app/api/strategies/route.ts` | ~350 | Tax strategy CRUD |

### Architecture Notes

**Context Injection Pattern:**
```
User Message → Context Builder → Claude API → Response
                    ↓
              [entities, accounts, knowledge,
               strategies, alerts, conversation history]
```

**Streaming with Post-Processing:**
```
createChatStream() → TransformStream → Response
                          ↓
                    [collect chunks]
                          ↓
                    flush() → extractAndPersistFacts()
```

**Knowledge Extraction Pattern:**
```
Claude Response → Knowledge Extractor → knowledge_base
                        ↓
                 [new facts with source='chat',
                  confidence='inferred']
```

### Notes

- Google Drive integration (`google-drive.ts`) deferred to Phase 8
- Tax estimate and export routes deferred to later phases
- Supabase types should be generated before production deployment
- All API routes follow RESTful patterns with consistent error handling

---

## Phase 4: App Shell and Dashboard
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

**UI Component Library (`src/components/ui/`):**

1. **`Card.tsx`** - Animated card container
   - `Card` with motion animations (fade in, slide up)
   - `CardHeader` with label + title pattern
   - Hover lift effect for interactive cards

2. **`Badge.tsx`** - Status/Priority/Entity badges
   - `StatusBadge` - active, at-risk, review, not-started, deprecated
   - `PriorityBadge` - critical, high, medium, low, monitor
   - `EntityBadge` - Entity color dot with name

3. **`Button.tsx`** - Button variants
   - Primary (teal), Secondary (outlined), Ghost (text-only)
   - Size variants (sm, md, lg)

4. **`EntityDot.tsx`** - Entity color indicators
   - Maps entity slugs to brand colors
   - Size variants (sm, md, lg)

5. **`MetricCard.tsx`** - Animated metric display
   - `useSpring` for animated number counting
   - Currency and integer formatting
   - Variant styles (default, accent, warning, danger)

6. **`Skeleton.tsx`** - Loading placeholders
   - `SkeletonCard`, `SkeletonList` components
   - Pulse animation

**Navigation Components (`src/components/navigation/`):**

1. **`Sidebar.tsx`** - Main navigation
   - Logo at top
   - Nav items with active state highlighting
   - Uses `usePathname()` for route detection

2. **`Header.tsx`** - Top header bar
   - Mobile menu toggle button
   - EntitySwitcher dropdown

3. **`EntitySwitcher.tsx`** - Entity dropdown
   - Fetches entities from `/api/entities`
   - AnimatePresence for dropdown animation
   - Entity color dots

4. **`AppShell.tsx`** - Layout wrapper
   - Responsive sidebar (hidden on mobile)
   - Mobile slide-out sidebar with AnimatePresence
   - Main content area with header

**Dashboard Panels (`src/components/panels/`):**

1. **`AlertsPanel.tsx`** - Action items display
   - Fetches from `/api/alerts`
   - Priority dots with status colors
   - Danger background for critical/high items
   - Entity badges and due dates

2. **`EntityGrid.tsx`** - Entity cards grid
   - 2-column responsive layout
   - Entity dots with colors
   - Counts (accounts, strategies, open alerts)
   - Hover animations

3. **`StrategiesPanel.tsx`** - Tax strategies list
   - Quick stats (active, at-risk, review counts)
   - Impact badges (high, medium, low)
   - Status badges and CPA flags
   - Entity badges and estimated savings

**Dashboard Page (`src/app/page.tsx`):**

- Page title with subtitle
- 4-column metrics strip:
  - Entities count
  - Accounts count
  - Open alerts (warning/danger variants)
  - Estimated savings (currency format)
- AlertsPanel (full width)
- 2-column layout:
  - EntityGrid (left)
  - StrategiesPanel (right)
- Staggered panel entry animations

**Design System (`src/app/globals.css`):**

- Complete CSS custom properties from design-guidance.md
- Entity color palette (mp, got, saratoga, nice, chippewa, hvr, personal)
- Component styles: cards, badges, buttons, inputs, tables
- Priority dots with colored backgrounds
- Typography utilities (page-title, card-title, section-label, etc.)
- Skeleton pulse animation

### Challenges Faced

1. **Motion Import Path**
   - Modern `motion` package uses `motion/react` import (not `framer-motion`)
   - All components use `import { motion } from 'motion/react'`

2. **CSS Custom Properties in Tailwind v4**
   - Tailwind v4 uses `@theme inline` directive
   - Colors defined as `--color-*` for theme access
   - Entity colors defined as `--entity-*` with Tailwind utilities

### Files Created

| File | Description |
|------|-------------|
| `src/components/ui/Card.tsx` | Animated card + header |
| `src/components/ui/Badge.tsx` | Status/Priority/Entity badges |
| `src/components/ui/Button.tsx` | Button variants |
| `src/components/ui/EntityDot.tsx` | Entity color dots |
| `src/components/ui/MetricCard.tsx` | Animated metric display |
| `src/components/ui/Skeleton.tsx` | Loading skeletons |
| `src/components/ui/index.ts` | UI component exports |
| `src/components/navigation/Sidebar.tsx` | Main sidebar nav |
| `src/components/navigation/Header.tsx` | Top header bar |
| `src/components/navigation/EntitySwitcher.tsx` | Entity dropdown |
| `src/components/navigation/index.ts` | Navigation exports |
| `src/components/panels/AlertsPanel.tsx` | Alerts display |
| `src/components/panels/EntityGrid.tsx` | Entity cards |
| `src/components/panels/StrategiesPanel.tsx` | Strategies list |
| `src/components/panels/index.ts` | Panel exports |
| `src/components/AppShell.tsx` | Layout wrapper |

### Animation Patterns

**Staggered Entry:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, duration: 0.3 }}
>
```

**Animated Numbers:**
```tsx
const motionValue = useMotionValue(0);
const spring = useSpring(motionValue, { stiffness: 100, damping: 20 });
const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
```

**Dropdown Animation:**
```tsx
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    />
  )}
</AnimatePresence>
```

### Notes

- All panel components are client-side (`'use client'`)
- Data fetched from API routes on mount
- Loading states use skeleton components
- Responsive breakpoints: md (768px), lg (1024px)
- Mobile sidebar uses overlay with AnimatePresence

---

## Phase 5: Chat Interface
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

**Chat Components (`src/components/chat/`):**

1. **`ChatMessage.tsx`** - Message display
   - User/assistant styling with color-coded bubbles
   - Avatar badges (You / CFO)
   - Timestamp display
   - Streaming cursor indicator

2. **`ChatInput.tsx`** - Message input
   - Auto-resizing textarea (max 200px)
   - Enter to send, Shift+Enter for newline
   - Disabled state with spinner during streaming
   - Keyboard hint

3. **`ConversationList.tsx`** - Conversation sidebar
   - Lists all conversations from `/api/chat`
   - New Chat button
   - Active state highlighting based on URL
   - Relative date formatting (Today, Yesterday, etc.)

**Chat Pages:**

1. **`/chat/page.tsx`** - New conversation
   - Welcome state with suggested prompts
   - Entity context selector dropdown
   - Streaming message display
   - Redirects to `/chat/[id]` after first message

2. **`/chat/[conversationId]/page.tsx`** - Existing conversation
   - Loads conversation history on mount
   - Continues streaming in same conversation
   - Title display from conversation

3. **`/chat/layout.tsx`** - Shared layout
   - Conversation sidebar (hidden on mobile)
   - Main chat area

**Streaming Implementation:**

```tsx
// Fetch with streaming response
const response = await fetch('/api/chat', { method: 'POST', ... });
const reader = response.body?.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  // Parse SSE data lines and update message state
}
```

### Files Created

| File | Description |
|------|-------------|
| `src/components/chat/ChatMessage.tsx` | Message bubble component |
| `src/components/chat/ChatInput.tsx` | Input with auto-resize |
| `src/components/chat/ConversationList.tsx` | Conversation sidebar |
| `src/components/chat/index.ts` | Chat component exports |
| `src/app/chat/layout.tsx` | Shared chat layout |
| `src/app/chat/page.tsx` | New conversation page |
| `src/app/chat/[conversationId]/page.tsx` | Existing conversation |

### Files Modified

| File | Change |
|------|--------|
| `src/components/navigation/Sidebar.tsx` | Fixed active state for `/chat/*` routes |

### Features

- **Suggested Prompts:** Quick-start questions on empty conversation
- **Entity Context:** Dropdown to filter Claude's context by entity
- **Auto-scroll:** Messages area scrolls to latest message
- **Loading States:** Skeleton placeholders while loading
- **Error Handling:** Graceful error messages on failures

### Notes

- SSE format: `data: {"text": "chunk"}` or `data: [DONE]`
- Conversation ID returned in first response, triggers redirect
- Knowledge extraction happens async after streaming completes
- Mobile: sidebar hidden, chat takes full width

---

## Phase 6: Notification System
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

**Cron Routes (`src/app/api/cron/`):**

1. **`deadline-check/route.ts`** - Daily deadline reminders
   - Schedule: 9 AM UTC daily
   - Queries open alerts with due dates
   - Sends reminders based on priority thresholds:
     - Critical: within 7 days (critical alert if within 3)
     - High: within 5 days (critical if within 1)
     - Medium: within 3 days
     - Low/Monitor: within 1 day
   - Avoids duplicate notifications (24-hour cooldown)
   - Logs all sent notifications

2. **`weekly-digest/route.ts`** - Monday summary email
   - Schedule: 8 AM UTC every Monday
   - Aggregates stats from past week:
     - Open alerts count
     - Critical alerts count
     - Documents processed
     - New facts added
   - Includes upcoming deadlines (next 2 weeks)
   - Includes strategy status changes

3. **`staleness-check/route.ts`** - Knowledge freshness audit
   - Schedule: 6 AM UTC daily
   - Category-specific staleness thresholds:
     - Property (balances, rents): 30 days
     - Financial/Strategy: 90 days
     - Tax/Personal: 365 days
   - Creates review alerts for stale facts
   - Avoids duplicate alerts for same fact

**Configuration:**

- **`vercel.json`** - Cron schedule configuration
- **CRON_SECRET** - Authorization for cron endpoints
  - Production: requires `Bearer {secret}` header
  - Development: bypasses auth for testing

### Files Created

| File | Description |
|------|-------------|
| `src/app/api/cron/deadline-check/route.ts` | Daily deadline reminder cron |
| `src/app/api/cron/weekly-digest/route.ts` | Monday weekly digest cron |
| `src/app/api/cron/staleness-check/route.ts` | Daily staleness audit cron |
| `vercel.json` | Vercel cron configuration |

### Cron Schedules

| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/staleness-check` | `0 6 * * *` | 6 AM UTC daily |
| `/api/cron/weekly-digest` | `0 8 * * 1` | 8 AM UTC Mondays |
| `/api/cron/deadline-check` | `0 9 * * *` | 9 AM UTC daily |

### Security

- All cron routes verify `Authorization: Bearer {CRON_SECRET}` header
- Vercel automatically sends this header for configured crons
- Manual testing requires header or development mode

### Challenges Faced

1. **Supabase Join Type Inference**
   - Problem: `entities` relation returned as array type
   - Solution: Handle both single object and array cases in type casting

### Notes

- Gmail integration uses existing `src/lib/gmail.ts` functions
- Notification logging tracks sent/opened/dismissed status
- Cron jobs designed to be idempotent (safe to re-run)
- Each job returns JSON with results for monitoring

---

## Phase 7: Google Drive Integration and Tax Estimates
**Date:** April 4, 2026
**Status:** Complete

### Work Completed

**Google Drive Library (`src/lib/google-drive.ts`):**

1. **Authentication**
   - OAuth2 client using existing Google credentials
   - Reuses GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN

2. **Folder Management**
   - `ensureFolder()` - Create or find existing folder
   - Prevents duplicate folders
   - Supports nested folder structure

3. **File Operations**
   - `uploadFile()` - Upload with duplicate detection
   - Updates existing files instead of creating duplicates
   - Returns web view link for sharing

4. **Export Functions**
   - `exportKnowledgeBase(taxYear, entitySlug?)` - Facts by category
   - `exportStrategies(taxYear)` - Strategies with CPA flags highlighted
   - `exportActionItems(taxYear)` - Alerts by priority
   - `generateCPAExport(taxYear)` - Full package (all 3 exports)

**Export API Route (`/api/export`):**

- **POST** - Generate exports to Google Drive
  - `type: 'full'` - All exports
  - `type: 'knowledge'` - Knowledge base only
  - `type: 'strategies'` - Tax strategies only
  - `type: 'actions'` - Action items only
  - Optional `entitySlug` for filtered exports
- **GET** - List available export types

**Tax Estimate API Route (`/api/tax-estimate`):**

- **GET** - Fetch latest estimate or history
  - `?taxYear=2025` - Specific year
  - `?history=true` - All estimates for year
- **POST** - Create new estimate
  - Calculates taxable income
  - Applies 2024 MFJ progressive tax brackets
  - Computes projected liability
- **PATCH** - Update existing estimate
  - Recalculates if income/deductions change

### Files Created

| File | Description |
|------|-------------|
| `src/lib/google-drive.ts` | Google Drive integration library |
| `src/app/api/export/route.ts` | CPA export endpoint |
| `src/app/api/tax-estimate/route.ts` | Tax estimate CRUD |

### Export Format

All exports generate Markdown files organized by tax year:

```
Google Drive/
└── Tax Year 2025/
    ├── knowledge-base-all-2025.md
    ├── knowledge-base-mp-2025.md (per entity)
    ├── tax-strategies-2025.md
    └── action-items-2025.md
```

### Tax Calculation

Simplified 2024 MFJ brackets used for estimates:
- 10%: $0 - $23,200
- 12%: $23,200 - $94,300
- 22%: $94,300 - $201,050
- 24%: $201,050 - $383,900
- 32%: $383,900 - $487,450
- 35%: $487,450 - $731,200
- 37%: $731,200+

### Notes

- GOOGLE_DRIVE_FOLDER_ID specifies the root CPA folder
- Exports are idempotent (safe to re-run)
- CPA-flagged strategies highlighted at top of export
- Tax estimates track history for year-over-year comparison

---

## Phase 8: Deployment (Next)

### Planned Scope

- Deploy to Vercel
- Configure cfo.mondayandpartners.com domain
- Set production environment variables
- Verify cron jobs running
- Test full application flow
