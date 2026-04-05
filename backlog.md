# CFO Command Center - Backlog

## Completed

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

## In Progress

### Design Elevation (per specs/design-guidance.md)

Current implementation diverges from spec. Required changes:

**Color Palette:**
- [ ] Background: Change from #F8F9FA to #EDEBE7 (warm putty)
- [ ] Accent: Change from #FF934F (orange) to #1A8A7D (teal)
- [ ] Update all semantic colors to match spec
- [ ] Update entity colors to spec values

**Remove Gradients:**
- [ ] btn-primary: solid accent instead of gradient
- [ ] card-gradient: remove entirely or convert to solid
- [ ] card-accent/success/danger: solid fills, no gradients
- [ ] nav-item-active: solid accent-light background
- [ ] gradient-primary utility: remove or deprecate
- [ ] progress-fill: solid accent instead of gradient

**Badge Overhaul:**
- [ ] Convert from pill backgrounds to text-only
- [ ] Color carries meaning, no background
- [ ] Use JetBrains Mono 10px lowercase

**Shadow System:**
- [ ] Update to layered compositing (two shadow values)
- [ ] --shadow-sm, --shadow-md, --shadow-lg, --shadow-hover

**Entity Dots:**
- [ ] Change from circle (10px) to rounded square (8px, radius 3px)

---

## Pending

### Property Manager Mode

Add property management operational context when property entity is selected
(got, saratoga, nice, chippewa, hvr):

**System Prompt Additions:**
- [ ] Utility bill ranges (SF Water $300-350, PG&E $85-95, etc.)
- [ ] PM fee verification (Morley 7% of $13,750, Satsuma 10%)
- [ ] Repair authorization limits (18th St: $250)
- [ ] Distribution reconciliation rules
- [ ] Lease renewal tracking (90-day flag)
- [ ] Tenant payment anomaly detection
- [ ] PM reliability notes:
  - Satsuma: "Be skeptical. They pay without questioning, non-standard reporting"
  - Morley: "Generally reliable and trustworthy. Clean reporting"
- [ ] France property: CCF mortgage tracking, EUR amounts, 3-month runway alert

**Dashboard Quick Action:**
- [ ] "Property Review" button for each property entity card
- [ ] Starts new chat scoped to that entity
- [ ] Pre-populated prompt: "Run a monthly review for [property name]..."

---

## Future Ideas

- Document preview in dashboard
- Transaction categorization UI
- Strategy timeline visualization
- Multi-year tax comparison charts
- Partner/CPA portal (read-only access)
- Mobile PWA optimization
- Voice input for chat
