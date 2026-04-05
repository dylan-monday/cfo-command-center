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

---

## Future Ideas

- Document preview in dashboard
- Transaction categorization UI
- Strategy timeline visualization
- Multi-year tax comparison charts
- Partner/CPA portal (read-only access)
- Mobile PWA optimization
- Voice input for chat
