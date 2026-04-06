# CFO Command Center - Backlog

## Completed

### Design Elevation (April 2026)
- [x] Background: Changed from #F8F9FA to #EDEBE7 (warm putty)
- [x] Accent: Changed from #FF934F (orange) to #1A8A7D (teal)
- [x] Updated all semantic colors to match design-guidance.md spec
- [x] Removed all gradients (btn-primary, card-gradient, nav-item-active, etc.)
- [x] Badge overhaul: text-only, color carries meaning, JetBrains Mono 10px lowercase
- [x] Shadow system: layered compositing with two shadow values
- [x] Entity dots: rounded squares (8px, radius 3px)

### Property Manager Mode (April 2026)
- [x] Added PROPERTY_MANAGEMENT_CONTEXT to context-builder.ts
- [x] System prompt includes property operational context for property entities
- [x] Utility bill ranges (SF Water, PG&E, NOLA SWBNO, Delta Gas, France)
- [x] PM fee verification formulas (Morley 7%, Satsuma 10%)
- [x] Repair authorization limits (18th St: $250)
- [x] Distribution reconciliation checklist
- [x] Lease renewal tracking (90-day flag)
- [x] PM reliability notes (Satsuma: skeptical, Morley: trustworthy)
- [x] France property specifics (CCF mortgage, EUR tracking, 3-month runway alert)
- [x] "Run Property Review" button on entity cards for property entities
- [x] Auto-send property review prompt when navigating from dashboard

### Google Drive Inbox Sweep
- [x] Created CFO Inbox folder integration
- [x] Cron job `/api/cron/drive-sweep` runs every 30 minutes
- [x] Downloads files, processes through parse pipeline
- [x] Moves processed files to "CFO Processed" folder
- [x] Status API at `/api/cron/drive-sweep/status`
- [x] Dashboard indicator component `InboxIndicator.tsx`
- [x] Added to vercel.json cron schedule

### Chat Interface Redesign
- [x] Two-panel layout (280px left nav+conversations, right chat)
- [x] Merged sidebar nav and conversation list into left panel
- [x] Removed "Connected" indicator
- [x] Removed "Help" nav item
- [x] New message bubble styles (asymmetric radius, no avatars)
- [x] "CFO" label above assistant messages
- [x] Timestamps on hover only
- [x] Dollar amounts in JetBrains Mono
- [x] Send button inside input (teal accent)
- [x] Paperclip attachment icon
- [x] Empty state with "What's on your mind?" and suggested prompts
- [x] Typing indicator with bouncing dots
- [x] Mobile hamburger menu

### System Goals
- [x] Already present in seed.ts (primary_goal_1, primary_goal_2, primary_goal_3, operating_principle)

### UI Top Bar
- [x] Removed "Connected" text from header
- [x] Added green dot next to "DiBona" in sidebar
- [x] Removed Help nav item

### Dashboard Design Fixes (April 2026)
- [x] Made Header mobile-only (removed empty white bar on desktop)
- [x] Made AlertsPanel collapsible with visual count indicator
- [x] Fixed CPA Packet card layout (2x2 grid, buttons full-width inside card)
- [x] Changed entity colors to avoid red/green (reserved for alerts)
  - GOT: #5B6FC4 (slate blue, was red)
  - Personal: #4A90A4 (ocean blue, was green)
- [x] Added solid card variants (.card-gradient, .card-accent, etc.)
- [x] Fixed RLS bypass for single-user app (service role key)

2### Chat Bug Fixes (April 2026)
- [x] Fixed conversation loading — GET /api/chat now returns messages when conversationId provided
- [x] Verified conversation context is properly sent to Claude via buildChatMessages()
- [x] Added Source Sans 3 font for chat messages
- [x] Created --font-chat CSS variable for chat-specific typography
- [x] Font hierarchy: Urbanist (UI), Source Sans 3 (chat), JetBrains Mono (data)

---

# Bugs/issues from Dylan:
The CFO says things like "I'm adding this to your action items" 
but nothing actually gets created in the database. The AI needs 
the ability to actually take actions during a conversation.

Implement Claude tool use in the chat API. Define these tools 
that Claude can call during a conversation:

1. add_alert — Creates a proactive_queue item
   Parameters: message, priority (critical/high/medium/low), 
   entity_slug, type (alert/question/recommendation/deadline)

2. add_knowledge — Creates a knowledge_base entry
   Parameters: key, value, entity_slug, category, confidence

3. update_knowledge — Updates an existing knowledge_base entry
   Parameters: id, new_value (creates new entry that supersedes old)

4. resolve_alert — Marks a proactive_queue item as resolved
   Parameters: id, resolved_note

When Claude calls one of these tools during a conversation, the 
API route should execute the database operation and return 
confirmation. Claude can then tell the user "Done — I've added 
that to your action items" and it will actually be true.

Add to the system prompt: "You have tools to add action items, 
add facts to the knowledge base, update existing facts, and 
resolve alerts. USE THEM when the conversation warrants it. 
Don't just say you'll do something — actually do it."

* in the dashboard "Open Alerts" doesn't do anything. I don't know where those alerts are coming from and there's nothing I can do about them - and how do these relate to the Action Items section?

* the tax savings card is irrelevant. I need information that's useful on this screen

* the google drive inbox sweep - not clear what happens when we sweep. It adds the file to the /documents section where I can file but not sure if/how that information is being used.

* CPA packet - this needs to be a partner packet and currently no partners are linked here even though they are in the system somewhere

* entities: in addition to  colors, let's use icons (house, work building, family, land)

* Making sure information that gets extracted from documents informs the chat. For instance, I just uploaded the attached payroll report and then asked the chat for the q1 payroll breakdown and it said: 

* "Looking at the Q1 2026 payroll summary, here's the breakdown:  **Total Q1 payroll cost: $32,164.25**  Dylan got $21,000 in wages, Keelin got $10,000. The rest was taxes and benefits - $728 in employer payroll taxes and $435 in workers comp insurance.  The big chunk was $17,500 in health insurance costs for the quarter, which makes sense for your family plan. That's running exactly on your annual $17,500 budget.  One thing - there's $436 listed as "S-Corp owner medical insurance imputed income" which I need to understand better. Is this related to how the health insurance deduction flows through the S-Corp structure?

* I also added 2024 tax returns for M+P and Game of Thrones. It 'processed' those but now they have disappeared from the system.

## Roadmap

### Next Up (build after current bugs are fixed) - if finished move to the next
- Google Drive inbox sweep (auto-ingest files from CFO Inbox folder)
- CPA Packet Generator (designed PDF export with partner selector)
- Property management mode (operational rules in chat context per entity)
- Weekly email digest (Monday AM via Gmail API cron)
- Deadline reminder emails (14 days + 3 days before tax deadlines)

### Soon
- Document preview in dashboard
- Transaction categorization UI with confirm/correct flow
- Quarterly CFO memo (auto-generated, saved to Drive)
- Net worth tracking from account_balances over time
- Tax liability gauge on dashboard (projected vs target)
- Partners management (CPA, bookkeeper, PM — admin + report targeting)

### Later
- Multi-year tax comparison charts
- Strategy timeline visualization  
- Scenario modeling ("What if I buy another property?")
- Mobile PWA with push notifications
- Email forwarding ingestion (cfo@mondayandpartners.com)
- QBO API integration (auto-sync transactions)
- Plaid integration (direct bank feeds)

### Someday
- CPA/bookkeeper portal (read-only access with their own login)
- Voice input for chat
- Scheduled reports (weekly/monthly auto-email)

