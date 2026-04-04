# Design Guidance — CFO Command Center

> Claude Code: Read this file before building any UI components. Follow these rules precisely. This is not a suggestion doc — it's the design spec.

---

## Design Philosophy

This is a personal financial operating system used by one person. It should feel like a premium tool made for him — not an enterprise SaaS product, not a banking app, not a generic dashboard. Think of the intersection of Linear's precision, Notion's warmth, and a really good accounting ledger's density.

**Three words:** Warm. Precise. Alive.

- **Warm** — light backgrounds with a slight cream tone, not sterile blue-white. The app should feel like something you want to open.
- **Precise** — every pixel of spacing is intentional. Typography creates hierarchy without needing bold or color. Numbers are monospaced and prominent.
- **Alive** — subtle motion everywhere. Nothing jumps, nothing bounces, but everything responds. The interface breathes.

---

## Color Palette

```css
:root {
  /* Backgrounds */
  --bg:              #FAFAF9;   /* Page background — warm white */
  --surface:         #FFFFFF;   /* Cards, panels, modals */
  --surface-alt:     #F5F5F0;   /* Secondary surface — inputs, code, hover */
  --surface-hover:   #F0F0EB;   /* Card hover state */

  /* Borders */
  --border:          #E5E5E0;   /* Default borders, dividers */
  --border-active:   #D0D0C8;   /* Focused/active borders */

  /* Text */
  --text:            #1A1A1F;   /* Primary text */
  --text-secondary:  #555560;   /* Descriptions, secondary content */
  --text-muted:      #8A8A95;   /* Labels, timestamps, metadata */
  --text-faint:      #B5B5BF;   /* Placeholder text, disabled states */

  /* Accent */
  --accent:          #1A8A7D;   /* Primary actions, links, active states */
  --accent-hover:    #15756A;   /* Accent hover */
  --accent-light:    #E6F5F3;   /* Accent background tint */
  --accent-text:     #0D5C53;   /* Text on accent-light backgrounds */

  /* Semantic */
  --warning:         #D4930D;   /* Attention needed, not crisis */
  --warning-light:   #FFF8E6;   /* Warning background */
  --warning-text:    #8A6009;   /* Text on warning backgrounds */

  --danger:          #CC3333;   /* Overdue, at-risk, urgent */
  --danger-light:    #FFF0F0;   /* Danger background */
  --danger-text:     #8A1F1F;   /* Text on danger backgrounds */

  --success:         #2D8A4E;   /* Active, confirmed, healthy */
  --success-light:   #EDFCF2;   /* Success background */
  --success-text:    #1A5C30;   /* Text on success backgrounds */

  /* Entity colors (used for dots, tags, chart series) */
  --entity-mp:       #1A8A7D;   /* Monday + Partners */
  --entity-got:      #CC3333;   /* Game of Thrones LLC */
  --entity-saratoga: #7C5CFC;   /* Saratoga */
  --entity-nice:     #D4930D;   /* Nice apartment */
  --entity-chippewa: #E07C24;   /* Chippewa (primary home) */
  --entity-hvr:      #8B6B4E;   /* Hidden Valley Ranch */
  --entity-personal: #2D8A4E;   /* Personal */
}
```

**Rules:**
- NEVER use blue as an accent. The accent is teal-green (#1A8A7D).
- NEVER use gray-blue. All grays are warm (notice the slight yellow in #FAFAF9, #F5F5F0, #E5E5E0).
- Entity colors are ONLY used for small indicators (6-8px dots, thin left borders, chart series). Never as full backgrounds.
- Semantic colors (warning/danger/success) are used sparingly. Most of the UI is neutral.

---

## Typography

```css
/* Load from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}
```

### Type Scale

| Role | Font | Weight | Size | Color | Usage |
|------|------|--------|------|-------|-------|
| Page title | DM Sans | 700 | 20px | --text | "DiBona Financial", section headers |
| Section label | JetBrains Mono | 500 | 10px, uppercase, 0.12em tracking | --text-muted | "NEEDS YOUR ATTENTION", "ENTITY MAP" |
| Card title | DM Sans | 600 | 14px | --text | Entity names, strategy names |
| Body text | DM Sans | 400 | 13px, line-height 1.6 | --text | Descriptions, alert messages, chat |
| Secondary text | DM Sans | 400 | 12px | --text-secondary | Supporting info, notes |
| Dollar amounts | JetBrains Mono | 500 | 15px | --text | $664,114.44, €14,486.26 |
| Small data | JetBrains Mono | 400 | 12px | --text-secondary | Dates, percentages, account numbers |
| Status badge | JetBrains Mono | 500 | 10px, lowercase | varies | "active", "at risk", "review" |
| Button text | DM Sans | 600 | 12px, 0.02em tracking | varies | "SEND", "UPLOAD", "CONFIRM" |
| Input text | DM Sans | 400 | 13px | --text | User-typed content |
| Metric value | JetBrains Mono | 600 | 28px | --accent (or semantic) | Dashboard top-line numbers |
| Metric label | JetBrains Mono | 400 | 9px, uppercase, 0.12em tracking | --text-muted | Labels under metric values |

**Rules:**
- Dollar amounts, dates, percentages, and account numbers are ALWAYS in JetBrains Mono. This is non-negotiable.
- Body text is ALWAYS in DM Sans.
- Section labels are ALWAYS uppercase JetBrains Mono with letter-spacing. They're quiet wayfinding, not shouty headers.
- Never use font sizes below 9px or above 28px.
- Never use bold (700) on JetBrains Mono. Use 500 or 600 max.
- Line heights: body text 1.6, data/labels 1.3, headings 1.2.

---

## Spacing System

Use a 4px base grid. All spacing should be multiples of 4.

```
4px   — tight: between label and value, between icon and text
8px   — compact: between list items, between badge elements
12px  — default: between sections within a card
16px  — comfortable: card padding (sides), gap between cards in a row
20px  — card padding (top/bottom)
24px  — between dashboard panels
32px  — major section breaks
```

**Rules:**
- Card internal padding: 16px horizontal, 20px vertical.
- Gap between cards in a grid: 12px.
- Gap between dashboard panels (vertically): 24px.
- Never use margin/padding values that aren't multiples of 4.

---

## Components

### Cards / Panels

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  border-color: var(--border-active);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Expandable cards */
.card[data-expanded="true"] {
  border-color: var(--border-active);
}
```

- No colored left borders unless the card is specifically a flagged alert.
- No background fills on cards. They're always white on the warm background.
- Clickable cards get the hover treatment. Static cards don't.

### Alert Items

```
[colored dot 6px] [message text in body style]
                   [entity tag in muted] · [type label in muted]  [× dismiss]
```

- High priority: danger dot, danger-light background, 1px danger border (at 20% opacity).
- Medium priority: warning dot, no background tint.
- Low priority: text-muted dot, no background tint.
- Dismiss button: text-faint, no background, becomes text-muted on hover.

### Status Badges

These are NOT pills. No background fills. Just colored text.

```css
.badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.badge-active  { color: var(--success); }
.badge-risk    { color: var(--danger); }
.badge-review  { color: var(--warning); }
.badge-explore { color: var(--text-muted); }
```

### Entity Tags

Small, muted references to which entity something belongs to.

```css
.entity-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
  color: var(--entity-[slug]);
}
```

### Entity Dots

Used in the entity map grid and anywhere an entity needs a visual marker.

```css
.entity-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px; /* slightly rounded square, not circle */
  background: var(--entity-[slug]);
  flex-shrink: 0;
}
```

### Buttons

**Primary (accent):**
```css
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-primary:hover { background: var(--accent-hover); }
```

**Secondary (ghost):**
```css
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-secondary:hover {
  border-color: var(--border-active);
  color: var(--text);
}
.btn-secondary[data-active="true"] {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: var(--accent-light);
  color: var(--accent);
}
```

### Chat Bubbles

**User messages (right-aligned):**
```css
.chat-user {
  background: var(--accent-light);
  border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 85%;
  margin-left: auto;
}
```

**System/CFO messages (left-aligned):**
```css
.chat-system {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 85%;
}
```

- Role labels: "CFO" in section-label style (mono, uppercase, muted). No "YOU" label needed for user messages.
- No avatar icons. Waste of space.
- Timestamps only on hover, in text-faint.

### Input Fields

```css
.input {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s ease;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.input::placeholder {
  color: var(--text-faint);
}
```

### Data Tables

For transaction lists, tenant rosters, etc:

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.table th {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  color: var(--text);
  font-family: var(--font-body);
}
.table td.mono {
  font-family: var(--font-mono);
  font-size: 12px;
}
```

- Dollar amounts in table cells: mono, right-aligned.
- Row hover: background shifts to surface-alt.
- No alternating row colors.

---

## Motion & Animation

Install the Motion library:
```
npm install motion
```

### Principles
- Everything that appears should animate in. Nothing pops.
- Everything that disappears should animate out. Nothing vanishes.
- Motion duration: 150ms for micro-interactions, 250ms for panel transitions, 400ms for page-level transitions.
- Easing: ease-out for entries, ease-in for exits. Never linear. Never bounce.
- If you can't tell whether animation is present, it's working correctly.

### Specific Animations

**Page load — staggered panel entry:**
```jsx
import { motion } from 'motion/react';

// Wrap each dashboard panel
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
>
  {panel}
</motion.div>
```

**Card expand/collapse:**
```jsx
import { motion, AnimatePresence } from 'motion/react';

<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {expandedContent}
    </motion.div>
  )}
</AnimatePresence>
```

**Chat messages — entry:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  {message}
</motion.div>
```

**View switching (Dashboard ↔ Chat ↔ Strategies):**
```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentView}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {viewContent}
  </motion.div>
</AnimatePresence>
```

**Number counters (metric values):**
```jsx
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  );

  useEffect(() => { motionValue.set(value); }, [value]);

  return <motion.span>{display}</motion.span>;
}
```

**Card hover — lift:**
```jsx
<motion.div
  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
  transition={{ duration: 0.15 }}
>
  {card}
</motion.div>
```

**Loading state — skeleton pulse:**
```css
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.skeleton {
  background: var(--surface-alt);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}
```

**Progress bars (tax liability, document completeness):**
```jsx
<motion.div
  className="progress-fill"
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
/>
```

**Typing indicator (chat, while AI responds):**
```jsx
<div className="typing-indicator">
  {[0, 1, 2].map(i => (
    <motion.span
      key={i}
      className="typing-dot"
      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
    />
  ))}
</div>
```

### What NOT to animate
- Don't animate text color changes. Just transition instantly.
- Don't animate border-radius changes.
- Don't use spring physics on anything except number counters. Everything else uses easeOut.
- Don't animate anything that's already visible and just updating data. Only animate entries, exits, and explicit state changes.
- Never use loading spinners. Use skeleton pulses or thin top-of-page progress bars.

---

## Layout

### App Shell
```
┌─────────────────────────────────────────────┐
│ HEADER: logo left, nav center, status right │
├──────────┬──────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                   │
│ (chat    │  (dashboard / strategies /       │
│  list,   │   whatever the current view is)  │
│  nav)    │                                  │
│          │                                  │
│ 240px    │  flex-1                          │
│ collaps- │                                  │
│ ible on  │                                  │
│ mobile   │                                  │
└──────────┴──────────────────────────────────┘
```

- Header: 56px tall. Subtle bottom border.
- Sidebar: 240px wide on desktop. Hidden on mobile (hamburger toggle).
- On mobile: sidebar becomes full-screen overlay. Chat and dashboard are separate full-screen views.

### Dashboard Grid

Panels stack vertically. Within panels, use CSS Grid for card layouts:

```
Alerts Panel          (full width, if items exist)
─────────────────────────────────────────────
Metrics Strip         (4-column grid)
─────────────────────────────────────────────
Entity Map            (2-column grid of expandable cards)
─────────────────────────────────────────────
Tax Strategies        (full width list with filters)
─────────────────────────────────────────────
Knowledge Base        (2-column grid of key-value pairs)
```

On mobile, everything goes to single column.

### Chat Layout

Full height minus header. Messages scroll. Input fixed at bottom.

```
┌────────────────────────────┐
│ Messages (scrollable)      │
│                            │
│ CFO: ...                   │
│               YOU: ...     │
│ CFO: ...                   │
│                            │
├────────────────────────────┤
│ [input field] [send btn]   │
│ [upload]                   │
└────────────────────────────┘
```

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* sm — small tablets */ }
@media (min-width: 768px)  { /* md — tablets, sidebar appears */ }
@media (min-width: 1024px) { /* lg — desktop, full layout */ }
@media (min-width: 1280px) { /* xl — wide desktop, more breathing room */ }
```

- Below 768px: no sidebar, bottom nav, single-column dashboard, full-screen chat.
- Above 768px: sidebar + main content side by side.

---

## Anti-Patterns — NEVER Do These

- ❌ Purple gradients, blue accents, or any "default AI" color schemes
- ❌ Rounded pill badges with colored backgrounds (use text-only badges)
- ❌ Card shadows deeper than `0 2px 8px rgba(0,0,0,0.06)`
- ❌ Loading spinners or circular progress indicators
- ❌ Alternating row colors in tables
- ❌ Icon-heavy UI — use text labels, not icons, for navigation
- ❌ Avatar circles for user/AI in chat
- ❌ Toast notifications that pop up and disappear
- ❌ Modal dialogs (use inline expansion or slide-over panels instead)
- ❌ Any animation longer than 400ms
- ❌ Bounce, spring, or elastic easing on UI elements (except number counters)
- ❌ Background images or decorative elements
- ❌ Emoji in the UI chrome (fine in chat messages from the AI)
- ❌ ALL CAPS for anything except section labels in JetBrains Mono
- ❌ Inter, Roboto, Arial, or system fonts
- ❌ Border-radius greater than 12px on anything

---

## Reference Aesthetic

If you need a North Star, study these:
- **Linear** (linear.app) — information density, typography hierarchy, subtle motion
- **Vercel Dashboard** — clean data presentation, monospaced values, warm but professional
- **Notion** — warmth, approachability, the feeling that a human designed this for humans
- **Apple Notes** — simplicity, the confidence to leave space empty

The goal is an interface that feels like it was designed by someone with strong opinions about typography who also understands compound interest.
