# CFO Command Center — Architecture & Spec Notes

> Living documentation for the CFO Command Center system. Update as features evolve.

---

## System Overview

A conversational financial operating system for Dylan DiBona. Manages:
- **M+P (mp)** — S-Corp, primary income source (~$350K/yr)
- **Game of Thrones LLC (got)** — San Francisco 4-unit rental property
- **Saratoga (saratoga)** — New Orleans duplex rental
- **Nice (nice)** — French apartment (F2, 50m²)
- **Chippewa (chippewa)** — Primary residence, New Orleans
- **Hidden Valley Ranch (hvr)** — 5.2 acres vacant land, New Mexico
- **Personal (personal)** — Individual accounts, investments, family

---

## Database Schema (13 Tables)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `entities` | Business/property containers | slug, name, type, tax_treatment, color |
| `accounts` | Financial accounts per entity | entity_id, type, institution, last4 |
| `knowledge_base` | Persistent facts (the brain) | category, key, value, source, confidence |
| `conversations` | Chat history | messages (JSONB), extracted_facts |
| `transactions` | Financial transactions | account_id, amount, category, tax_category |
| `tax_strategies` | Tax optimization strategies | status, impact, estimated_savings, cpa_flag |
| `documents` | Uploaded/parsed documents | doc_type, parsed_data, key_figures, ai_summary |
| `proactive_queue` | Alerts and action items | type, priority, message, due_date, status |
| `tax_estimates` | Tax projections | tax_year, gross_income, estimated_tax, breakdown |
| `partners` | External collaborators | role, company, email, entities[], status |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `notification_log` | Email/push notification history |
| `document_patterns` | Learned document parsing patterns |
| `account_balances` | Point-in-time balance snapshots |

---

## API Routes

### Data APIs
- `GET/POST /api/entities` — Entity CRUD
- `GET/POST/PUT/DELETE /api/partners` — Partner management
- `GET/POST /api/knowledge` — Knowledge base queries
- `GET/POST /api/alerts` — Proactive queue management
- `GET/POST /api/strategies` — Tax strategy CRUD
- `GET /api/tax-estimate` — Tax projection calculations

### AI/Processing APIs
- `POST /api/chat` — Claude conversation with streaming
- `POST /api/parse` — Document parsing via Claude

### Export APIs
- `POST /api/export` — Markdown exports to Google Drive
- `POST /api/cpa-packet` — Professional PDF packet generation

### Cron Jobs
- `GET /api/cron/deadline-check` — Daily deadline monitoring
- `GET /api/cron/staleness-check` — Weekly fact verification
- `GET /api/cron/weekly-digest` — Email summary generation

---

## Pages & Navigation

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — entity overview, alerts, quick stats |
| `/chat` | AI conversation interface |
| `/chat/[id]` | Specific conversation |
| `/knowledge` | Knowledge base browser |
| `/strategies` | Tax strategy tracker |
| `/documents` | Document upload and management |
| `/export` | CPA export generator (markdown) |
| `/settings` | System config, entities, partners |
| `/help` | User guide and tips |

---

## Design System

### Colors
```
Background:     #FAFAF9  (warm white)
Surface:        #FFFFFF
Surface Alt:    #F5F5F0
Border:         #E5E5E0
Border Active:  #D0D0C8
Text:           #1A1A1F
Text Secondary: #4A4A52
Text Muted:     #6B6B73
Accent:         #1A8A7D  (teal-green)
Accent Light:   #E8F5F3
Warning:        #D4930D
Danger:         #CC3333
Success:        #2D8A4E
```

### Typography
- **Body:** DM Sans (app interface)
- **Data/Mono:** JetBrains Mono (financial figures, dates)
- **PDF Headings:** Urbanist (CPA packets only)

### Entity Colors
```
mp:       #1A8A7D (teal)
got:      #CC3333 (red)
saratoga: #7C5CFC (purple)
nice:     #D4930D (amber)
chippewa: #E07C24 (orange)
hvr:      #8B6B4E (brown)
personal: #2D8A4E (green)
```

---

## Key Features

### Knowledge Base
- Every fact stored with lineage (source, confidence, supersedes_id)
- Categories: tax, financial, personal, strategy, cpa, legal, property
- Confidence levels: confirmed, inferred, stale
- Facts never deleted, only superseded

### Context Builder
- Queries DB fresh on every Claude API call
- Injects relevant entities, accounts, facts, strategies, alerts
- Maintains conversation continuity without bloating context

### Document Parsing
- Universal AI parser (no hardcoded templates)
- Pattern learning via document_patterns table
- Extracts key_figures and ai_summary automatically

### Export System
- **Markdown exports:** Knowledge base, strategies, action items
- **PDF CPA Packet:** Professional multi-section document
- **Google Drive integration:** Auto-upload to CPA folder

### Partners System
- External collaborators: CPA, bookkeeper, property managers, advisors
- Entity associations via UUID array
- Active/former status tracking
- Cover page attribution on exports

---

## CPA Packet Specification

### Design Requirements
- **Fonts:** Urbanist (headings/body), JetBrains Mono (financial data)
- **Page background:** #F7F6F3 (warm off-white)
- **Accent:** #1A8A7D (teal)
- **Footer:** "Prepared by CFO Command Center — Not tax advice. Discuss with your CPA." + page number

### Content Structure
1. **Cover Page** — Title, tax year, preparer info, generation date
2. **Executive Summary** — AI-written overview of the tax year
3. **Entity Sections** — One per entity with:
   - Income summary
   - Expense summary
   - Key documents (with status indicators)
   - Notable items/flags
   - Tax strategy notes
4. **Document Checklist** — Grid showing received/missing status
5. **Tax Strategy Summary** — Active strategies with CPA flags
6. **Open Questions** — Items needing CPA input

### Status Indicators
- Green checkmark: received/complete
- Red ×: missing
- Amber dot: needs review

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=

# Notifications
NOTIFICATION_EMAIL=dylan@mondayandpartners.com
```

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run seed     # Seed database with initial data
npm run lint     # Run ESLint
```

---

## Deployment

- **Host:** Vercel Pro
- **Domain:** cfo.mondayandpartners.com
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (documents bucket)
- **Cron:** Vercel Cron Jobs

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01 | 1.0 | Initial scaffold, schema, core APIs |
| 2025-01 | 1.1 | Chat interface, streaming, dashboard |
| 2025-01 | 1.2 | Settings, partners, export system |
| 2025-01 | 1.3 | CPA Packet PDF generator |

---

*Last updated: Auto-generated. Keep this document current as the system evolves.*
