# Design Guidance — CFO Command Center

> Claude Code: This file is the definitive design spec. Read it completely before building or modifying any UI component. Every rule here is intentional. Do not deviate.

---

## Design Philosophy

This is NOT a typical dashboard. It's a personal financial command center that feels alive, warm, and confident. It should feel like opening a beautifully designed app on your phone — something you actually want to use, not something that feels like work.

**The aesthetic is:** Warm minimalism with bold data. Think high-end fintech meets editorial design. Soft surfaces, generous radius, floating cards, and confident typography. The UI has personality — it's not afraid of space, warmth, or visual hierarchy.

No gradients anywhere in the UI. Solid colors only. The accent 
is flat #1A8A7D. Buttons are flat fills. Entity colors are solid. 
Backgrounds are solid. The only gradient allowed is the skeleton 
shimmer loading animation. Remove the gradient from the "New Chat" 
button — make it a solid accent color or a ghost button.

**Three principles:**

1. **Warm and inviting** — The palette leans warm. Backgrounds have warmth (not blue-gray). Cards feel like they float on soft surfaces. Nothing is sterile or clinical.

2. **Data is the hero** — Numbers are large, confident, and immediately readable. Financial data uses a dedicated monospace font at generous sizes. The hierarchy is: number first, context second, decoration never.

3. **Feels physical** — Cards have depth through layered shadows. Elements have generous radius that makes them feel touchable. Hover states lift. Transitions breathe. The interface has dimensionality, not flatness.

---

## Color Palette

```css
:root {
  /* ─── Backgrounds ─── */
  --bg:              #EDEBE7;   /* Page background — warm putty/linen */
  --bg-secondary:    #E4E1DC;   /* Slightly deeper for layering/sections */

  /* ─── Surfaces ─── */
  --surface:         #FFFFFF;   /* Cards — pure white to pop against warm bg */
  --surface-alt:     #F7F6F3;   /* Input fields, code blocks, secondary cards */
  --surface-hover:   #F2F0ED;   /* Hover state for interactive cards */
  --surface-glass:   rgba(255, 255, 255, 0.72);  /* Glassmorphism panels */

  /* ─── Borders ─── */
  --border:          rgba(0, 0, 0, 0.06);   /* Subtle, not harsh lines */
  --border-active:   rgba(0, 0, 0, 0.12);   /* Focus/active states */

  /* ─── Text ─── */
  --text:            #0D0C0B;   /* Primary text — near-black, warm */
  --text-secondary:  #5A5752;   /* Descriptions, secondary info */
  --text-muted:      #918E88;   /* Labels, timestamps, metadata */
  --text-faint:      #C2BFB9;   /* Placeholders, disabled */

  /* ─── Accent ─── */
  --accent:          #1A8A7D;   /* Primary — teal-green */
  --accent-hover:    #15756A;   /* Hover state */
  --accent-light:    #E0F2EF;   /* Tint background */
  --accent-subtle:   rgba(26, 138, 125, 0.08);  /* Very subtle accent wash */

  /* ─── Semantic ─── */
  --warning:         #E8A817;   /* Warm amber */
  --warning-light:   #FDF6E3;   /* Warning background */
  --danger:          #D94242;   /* Clear red */
  --danger-light:    #FDF0F0;   /* Danger background */
  --success:         #2D8A4E;   /* Confident green */
  --success-light:   #EDFCF2;   /* Success background */

  /* ─── Entity Colors ───
     No red/green - those are reserved for alert status
     Use distinct hues: teal, slate blue, violet, amber, orange, earth, ocean */
  --entity-mp:       #1A8A7D;   /* Monday + Partners — teal */
  --entity-got:      #5B6FC4;   /* Game of Thrones LLC — slate blue */
  --entity-saratoga: #7C5CFC;   /* Saratoga — violet */
  --entity-nice:     #E8A817;   /* Nice — amber */
  --entity-chippewa: #E07C24;   /* Chippewa — orange */
  --entity-hvr:      #8B6B4E;   /* Hidden Valley Ranch — earth */
  --entity-personal: #4A90A4;   /* Personal — ocean blue */

  /* ─── Shadows ─── */
  --shadow-sm:       0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.03);
  --shadow-md:       0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  --shadow-lg:       0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.06);
  --shadow-hover:    0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
}
```

**Rules:**
- The page background is WARM (#EDEBE7) — not white, not gray, not blue-gray. This is what gives the design its personality.
- Cards are pure white (#FFFFFF) so they float against the warm background. This contrast is essential.
- Borders are semi-transparent black, not hard gray lines. This keeps everything soft.
- Shadows use layered compositing (two shadow values) for realistic depth.
- Entity colors are ONLY for dots (8px), thin accents, and chart series. Never as full card backgrounds.

---

## Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --font-body: 'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-chat: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

**Urbanist** is the UI chrome font (navigation, headers, labels, buttons, cards). It's modern, geometric, warm, and has excellent legibility across weights.

**Source Sans 3** is the chat message font. Used at 14px, weight 400 for body, 600 for emphasis, line-height 1.6. Both user and CFO messages use this font for better readability in conversational context.

**JetBrains Mono** remains the data font for all financial values, dollar amounts, dates, percentages, and technical labels.

### Type Scale

| Role | Font | Weight | Size | Color | Letter-spacing |
|------|------|--------|------|-------|----------------|
| Page title | Urbanist | 700 | 24px | --text | -0.02em |
| Section title | Urbanist | 700 | 18px | --text | -0.01em |
| Section label | JetBrains Mono | 500 | 10px uppercase | --text-muted | 0.12em |
| Card title | Urbanist | 600 | 15px | --text | -0.01em |
| Body text | Urbanist | 400 | 14px, line-height 1.6 | --text | 0 |
| Secondary text | Urbanist | 400 | 13px | --text-secondary | 0 |
| Small text | Urbanist | 400 | 12px | --text-muted | 0 |
| Hero metric | JetBrains Mono | 600 | 36px | --text | -0.02em |
| Large metric | JetBrains Mono | 600 | 28px | --text | -0.01em |
| Data value | JetBrains Mono | 500 | 15px | --text | 0 |
| Small data | JetBrains Mono | 400 | 12px | --text-secondary | 0 |
| Status badge | JetBrains Mono | 500 | 10px lowercase | varies | 0.02em |
| Button label | Urbanist | 600 | 13px | varies | 0.02em |
| Nav icon label | Urbanist | 500 | 10px | --text-muted | 0.04em |
| Input text | Urbanist | 400 | 14px | --text | 0 |

**Rules:**
- Urbanist gets NEGATIVE letter-spacing at larger sizes (-0.02em at 24px+). This makes it feel confident and editorial, not spread out.
- JetBrains Mono stays at neutral or slightly positive spacing.
- Hero metrics (36px) are reserved for the single most important number on screen — like projected tax liability or net worth.
- Dollar amounts, dates, percentages, account numbers: ALWAYS JetBrains Mono. Non-negotiable.
- Body text line-height: 1.6. Data line-height: 1.3. Headings: 1.2.
- Never go below 10px. Never above 36px.

---

## Spacing & Layout Grid

4px base unit. All spacing is multiples of 4.

```
4px   — icon-to-label, badge internal
8px   — between items in a tight list, inline gaps
12px  — between elements within a card section
16px  — card padding (horizontal), gap between grid cards
20px  — card padding (vertical), section gap within a panel
24px  — between dashboard panels vertically
32px  — major section dividers
48px  — page-level vertical padding (top of content area)
```

### App Shell Layout

```
┌──────────────────────────────────────────────────────┐
│                    HEADER (64px)                      │
│  Logo/title left          Nav tabs center/right       │
├────────┬─────────────────────────────────────────────┤
│ SIDE   │                                             │
│ RAIL   │         MAIN CONTENT AREA                   │
│        │                                             │
│ 72px   │         max-width: 1200px                   │
│ icons  │         centered with auto margins          │
│ only   │         padding: 48px 32px                  │
│        │                                             │
│        │                                             │
└────────┴─────────────────────────────────────────────┘
```

**Side rail:** 72px wide, icon-only navigation. White or glass background. Icons are 20px, with a 10px label underneath in small text. Active state: accent-colored icon with subtle accent-light pill behind it. This matches the inventory dashboard inspiration.

**Header:** 64px tall. Logo/app name on left. Primary navigation (Dashboard, Chat, Strategies, Documents) as tabs or text links. Subtle bottom border or shadow to separate from content.

**Main content:** Max-width 1200px, centered. Generous padding. Content never stretches edge-to-edge — it breathes.

**Mobile (below 768px):** Side rail becomes bottom tab bar (56px). Header simplifies to logo + hamburger. Content goes full-width with 16px padding.

---

## Components

### Cards — The Core Building Block

Cards are the primary UI element. They must feel like they FLOAT.

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;           /* Generous — makes cards feel modern */
  padding: 24px 20px;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);    /* Lift on hover */
}

.card-compact {
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.card-compact:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

**Rules:**
- Default card radius: 16px. Compact cards: 12px. Inner elements (badges, inputs): 8px.
- Cards ALWAYS have shadow. Never flat-on-the-page.
- Clickable/interactive cards get the hover lift. Static display cards don't transform but do deepen shadow slightly.
- No colored card backgrounds (no yellow, no orange). Cards are white. Period. Entity colors go on small accent elements INSIDE the card.

### Feature Cards — For Dashboard Metrics

For the 4-up metrics strip at the top of the dashboard, use a slightly elevated style:

```css
.feature-card {
  background: var(--surface);
  border: none;                   /* No border — shadow does the work */
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

/* Subtle accent gradient on the left edge */
.feature-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent);
  border-radius: 4px 0 0 4px;
}
```

The metric inside uses hero-metric type (36px JetBrains Mono) with the label below in section-label style.

### Alert Items

```css
.alert-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.15s ease;
}

.alert-item:hover {
  background: var(--surface-alt);
}

.alert-item[data-priority="critical"] {
  border-left: 3px solid var(--danger);
  background: var(--danger-light);
}

.alert-item[data-priority="high"] {
  border-left: 3px solid var(--warning);
}
```

- Priority dot: 8px circle, colored by priority
- Message text: body style (Urbanist 14px)
- Entity tag + type label below message in muted small text
- Dismiss: ghost × button, only visible on hover

### Status Badges

Text-only. No pill backgrounds. Color carries the meaning.

```css
.badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.badge-active   { color: var(--success); }
.badge-at-risk  { color: var(--danger); }
.badge-review   { color: var(--warning); }
.badge-explore  { color: var(--text-muted); }
```

### Entity Indicators

Small square dot (not circle) in the entity's color:

```css
.entity-dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;      /* Rounded square */
  flex-shrink: 0;
}
```

Entity tag text:
```css
.entity-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}
```

### Buttons

**Primary:**
```css
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(26, 138, 125, 0.25);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 16px rgba(26, 138, 125, 0.3);
  transform: translateY(-1px);
}
```

**Secondary:**
```css
.btn-secondary {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 18px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--surface-alt);
  border-color: var(--border-active);
  box-shadow: var(--shadow-md);
}

.btn-secondary[data-active="true"] {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent);
}
```

Note: Buttons have 12px radius (matching compact cards), shadow, and hover lift. They feel like small cards themselves.

### Chat Interface

**Container:**
```css
.chat-container {
  background: var(--bg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.chat-input-area {
  padding: 16px 24px 24px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
}
```

**User messages (right-aligned):**
```css
.chat-user {
  background: var(--text);           /* Dark bubble for user — high contrast */
  color: white;
  border-radius: 20px 20px 4px 20px; /* Tail bottom-right */
  padding: 14px 18px;
  max-width: 80%;
  margin-left: auto;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}
```

**CFO messages (left-aligned):**
```css
.chat-cfo {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 20px 20px 20px 4px; /* Tail bottom-left */
  padding: 14px 18px;
  max-width: 80%;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  box-shadow: var(--shadow-md);
}
```

**Chat input:**
```css
.chat-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 18px;
  padding-right: 52px;      /* Room for send button */
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  width: 100%;
}

.chat-input:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-md), 0 0 0 3px var(--accent-subtle);
  outline: none;
}

.chat-send {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(26, 138, 125, 0.3);
  transition: all 0.15s ease;
}

.chat-send:hover {
  background: var(--accent-hover);
  transform: translateY(-50%) scale(1.05);
}
```

**Rules:**
- NO avatar icons. No user icon, no CFO icon. Waste of space.
- Role label "CFO" appears above CFO messages in section-label style (JetBrains Mono, 10px, uppercase, muted). No label on user messages.
- Timestamps only on hover, in text-faint, 11px.
- Chat bubbles have asymmetric border-radius (tail effect). This adds personality.
- The send button sits INSIDE the input field (absolute positioned). Colored accent with shadow.
- Input area uses glassmorphism (semi-transparent white + backdrop-filter blur).

### Data Tables

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.table th {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 12px 16px;
  text-align: left;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-body);
  vertical-align: middle;
}

.table tr {
  transition: background 0.1s ease;
}

.table tr:hover td {
  background: var(--surface-alt);
}

.table td.mono {
  font-family: var(--font-mono);
  font-weight: 500;
}

.table td.amount {
  font-family: var(--font-mono);
  font-weight: 500;
  text-align: right;
  font-size: 14px;
}
```

- Dollar amounts right-aligned, mono, slightly larger than other cells.
- No alternating row colors. Hover only.
- Sticky header with background matching page.
- Generous row padding (14px) — not cramped.

### Input Fields

```css
.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  width: 100%;
}

.input:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-md), 0 0 0 3px var(--accent-subtle);
  outline: none;
}

.input::placeholder {
  color: var(--text-faint);
}
```

### Navigation Tabs / Filter Buttons

For switching between dashboard views or filtering strategies:

```css
.tab {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 13px;
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab:hover {
  color: var(--text);
  background: var(--surface-alt);
}

.tab[data-active="true"] {
  color: var(--accent);
  background: var(--accent-light);
  font-weight: 600;
}
```

---

## Motion & Animation

Install:
```
npm install motion
```

### Principles
- Everything entering the screen animates in. Nothing appears instantly.
- Motion is soft. Ease-out for entries. Ease-in for exits. Never linear, never bounce.
- Durations: 150ms micro-interactions, 250ms panel transitions, 350ms page transitions.
- If the animation calls attention to itself, it's too much. Pull back.

### Specific Implementations

**Dashboard load — staggered card entry:**
```jsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
>
  {card}
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
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ overflow: 'hidden' }}
    >
      {content}
    </motion.div>
  )}
</AnimatePresence>
```

**Chat messages — entry:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 16, scale: 0.97 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
  {message}
</motion.div>
```

**View crossfade:**
```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={view}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {viewContent}
  </motion.div>
</AnimatePresence>
```

**Animated number counters:**
```jsx
import { useSpring, useMotionValue, useTransform, motion } from 'motion/react';

function AnimatedCurrency({ value }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, v =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
  );
  useEffect(() => { mv.set(value); }, [value]);
  return <motion.span>{display}</motion.span>;
}
```

**Card hover lift:**
Already handled in CSS transitions above. No Motion needed for simple transforms.

**Skeleton loading:**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    var(--surface-alt) 25%,
    var(--surface) 50%,
    var(--surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

Use shimmer (moving gradient) not pulse (opacity change). Shimmer feels more premium.

**Progress bars:**
```jsx
<motion.div
  className="progress-fill"
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
/>
```

**Typing indicator:**
```jsx
{[0, 1, 2].map(i => (
  <motion.span
    key={i}
    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }}
    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
  />
))}
```

### What NOT to Animate
- Text color changes — instant
- Border-radius changes — never animate
- Data that updates in place (cell values refreshing) — just swap, don't animate
- Anything > 400ms
- Bounce or elastic easing (except number counters where spring is appropriate)
- Never use loading spinners — use skeleton shimmer or thin top-of-page progress bar

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐   │
│ │  Metrics Strip — 4 feature cards in a row         │   │
│ │  [Entities: 7] [Active: 6] [At Risk: 2] [Open:20]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌──────────────────────┐  ┌────────────────────────┐   │
│ │  Alerts Panel         │  │  Tax Liability Gauge   │   │
│ │  (prioritized list)   │  │  (projected for year)  │   │
│ │                       │  │                        │   │
│ └──────────────────────┘  └────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │  Entity Map — 2-3 column grid of entity cards     │   │
│ │  Each expandable with accounts + key facts        │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │  Recent Activity / Knowledge Base                 │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- Metrics strip: 4 cards, equal width, gap 16px. Each card uses the feature-card style with 20px radius and accent left edge.
- Alerts + Tax Gauge: 2-column, 60/40 split. Alerts scrollable if >5 items.
- Entity map: responsive grid — 3 columns on desktop, 2 on tablet, 1 on mobile.
- All panels have 24px vertical gap between them.

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* 2-column entity grid */ }
@media (min-width: 768px)  { /* Side rail appears, 2-col metrics */ }
@media (min-width: 1024px) { /* Full layout, 4-col metrics, 3-col entities */ }
@media (min-width: 1280px) { /* Max-width content area, more breathing room */ }
```

- Below 768px: no side rail, bottom tab bar, single-column everything, full-screen chat.
- Touch targets: minimum 44px on mobile.

---

## Anti-Patterns — NEVER Do These

- ❌ Flat cards with no shadow (cards must float)
- ❌ Square corners or border-radius < 8px on any card or button
- ❌ Blue, purple, or "default SaaS" accent colors
- ❌ Gray (#f5f5f5, #e5e5e5) backgrounds — use WARM tones
- ❌ Avatar circles in chat or anywhere
- ❌ Loading spinners — use shimmer skeletons
- ❌ Pill-shaped badges with colored backgrounds (text-only badges)
- ❌ Alternating row colors in tables
- ❌ Modals or dialog boxes — use inline expansion or slide-over panels
- ❌ Toast notifications
- ❌ Icon-heavy navigation — text labels with optional icons
- ❌ Inter, Roboto, Arial, DM Sans, or system fonts as body font
- ❌ Shadows with blue tint — shadows are always warm (rgba black)
- ❌ Cards with colored backgrounds (yellow, orange, etc) — cards are white
- ❌ Animation > 400ms on any element
- ❌ Pure white (#FFFFFF) as page background — page bg is warm
- ❌ Harsh 1px solid borders — use semi-transparent rgba borders
- ❌ Any element that looks like "default Tailwind UI" or "shadcn defaults"

---

## Reference Aesthetic

**Primary inspiration:** Warm editorial dashboard with floating cards on a linen-tone background. Cards feel physical — you could pick them up. Data is confident and large. Typography is modern geometric (Urbanist). Everything has generous radius and soft shadow depth.

**North star references:**
- The inventory dashboard by Ron Design — warm palette, bold metrics, card depth, icon sidebar
- Linear app — information density with elegance
- Vercel dashboard — clean data presentation, monospace values
- Apple's design language — confidence to use whitespace, soft materials, depth through shadow

**The test:** If you screenshot the dashboard and show it to a designer, they should say "that's really well designed" before they notice it's a financial tool. The design should feel premium, intentional, and warm — never generic, never cold, never "template-y."
