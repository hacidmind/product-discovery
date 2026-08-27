# Product Discovery Agent — Design Brief (UX/UI Redesign Reference)

## 1. What Is This App?

**Product Discovery Agent** is a desktop web application built for **Product Managers** to run a complete, structured product discovery workflow — capturing customer feedback, analyzing it, scoring opportunities, prioritizing features, managing personas, mapping assumptions, designing experiments, running web research, and visualizing the Opportunity Solution Tree.

It is a **local-first, single-user tool** (no backend database — all data lives in flat JSON files on disk) built with Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.

---

## 2. User Persona

- **Role:** Product Manager (or Product Trio member)
- **Context:** Working alone, at a desk, on a laptop or large monitor
- **Goals:** Turn raw customer signals into structured, scored, prioritized product decisions
- **Current Pain Points:** Tool feels utilitarian, lacks polish, no visual design system, emoji-only icons, no responsive/mobile support, inconsistent interaction patterns

---

## 3. All Screens (12 Total)

| # | Screen | Route | What It Does |
|---|---|---|---|
| 1 | **Dashboard** | `/dashboard` | Landing page — stats cards (totals), top opportunities table, emerging themes list, top features, recent insights feed, activity timeline |
| 2 | **Problem Discovery** | `/discover` | CRUD list of Insights — feedback form with text input + source picker, auto-analysis (sentiment, keywords, themes) on save, filter by source/emotion |
| 3 | **Import** | `/import` | Drag-and-drop document uploader (.txt, .md, .pdf, .docx, .json) — parses content, auto-classifies into insights/opportunities/personas/features/assumptions, shows extraction results in a review panel |
| 4 | **Opportunities** | `/opportunities` | Scored opportunity list — 6-axis sliders (Impact, Frequency, Urgency, Business Value, Strategic Alignment, Confidence), live total score, sort by score/date, inline status changes (New → Exploring → Validated → Building → Shipped) |
| 5 | **Personas** | `/personas` | Persona cards — name, role, demographics, goals, frustrations, behaviors, needs, quotes, JTBD. Manual creation with list editors. Auto-generate from insight themes. Detail modal. |
| 6 | **Interviews** | `/interviews` | Paste interview transcript → auto-extracts pain points, feature requests, emotions, themes, opportunities, unknowns, assumptions. Detail modal shows structured analysis breakdown. |
| 7 | **Features** | `/features` | Prioritization tool — supports 5 frameworks: RICE, ICE, MoSCoW, Kano, Custom Weighted Scoring. Framework-specific input fields. Live score preview. Inline status (Backlog → Next → In Progress → Done). |
| 8 | **Experiments** | `/experiments` | Experiment tracker — hypothesis, success/failure metrics, duration, cost, risk, expected learning, results. Inline status (Planned → Running → Completed). |
| 9 | **Assumptions** | `/assumptions` | Assumption mapper — statement, auto-classified area (Desirability, Feasibility, Viability, Usability, Risk, Ethics), evidence, validation status. Filter by area. Link to experiments. |
| 10 | **Research** | `/research` | Web research tool — query input with 6 categories (Market Analysis, Competitive Landscape, etc.). Split-pane: history list left → detail view right. Sources, insights (key findings, market gaps, opportunities, risks, trends), competitors, market size, recommendations. Action CTAs to create entities from findings. Save/download as .md. |
| 11 | **Solution Tree** | `/tree` | Interactive SVG Opportunity Solution Tree — hierarchical nodes (Outcome → Opportunity → Solution → Experiment). Click to expand/collapse. Drag to pan. Auto-build from data or manual node creation. |
| 12 | **Search** | `/search` | Global fuzzy search across all entity types. Real-time results grouped by type. Click to navigate to entity. |

---

## 4. Navigation & Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (224px fixed, collapsible via Ctrl+B)                │
│                                                               │
│  ┌─────────────────┐                                          │
│  │ 🧭 App Name      │   ┌──────────────────────────────────┐ │
│  │                  │   │ Header Bar (page title)           │ │
│  │ ─────────────── │   ├──────────────────────────────────┤ │
│  │ 1 Dashboard     │   │                                   │ │
│  │ 2 Discover      │   │        Content Area               │ │
│  │ 3 Import        │   │     (scrollable, padded)         │ │
│  │ 4 Opportunities │   │                                   │ │
│  │ 5 Personas      │   │                                   │ │
│  │ 6 Interviews    │   │                                   │ │
│  │ 7 Features      │   │                                   │ │
│  │ 8 Experiments   │   │                                   │ │
│  │ 9 Assumptions   │   │                                   │ │
│  │ 0 Research      │   │                                   │ │
│  │ T Solution Tree │   │                                   │ │
│  │ S Search        │   │                                   │ │
│  │ ─────────────── │   │                                   │ │
│  │ 🌙 Dark Mode    │   │                                   │ │
│  └─────────────────┘   └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Keyboard shortcuts:** `1-9` = navigate to pages, `Ctrl+K` = search, `Ctrl+B` = toggle sidebar, `Esc` = close modal.

---

## 5. Data Model (Entities)

| Entity | Key Fields | Status/State Flow |
|---|---|---|
| **Insight** | title, description, source (7 types), category (6 types), emotion (4 types), tags, themes, quotes, priority (4 levels) | N/A |
| **Opportunity** | title, description, 6-axis scores (impact/frequency/urgency/businessValue/strategic/confidence), totalScore, priority, reasoning | new → exploring → validated → building → shipped |
| **Persona** | name, role, demographics, goals, frustrations, behaviors, needs, quotes, jobsToBeDone | N/A |
| **Interview** | title, transcript, interviewee, date, analysis (painPoints, featureRequests, emotions, themes, opportunities, unknowns, assumptions), tags | N/A |
| **Feature** | title, description, framework (rice/ice/moscow/kano/weighted), scores, totalScore, priority | backlog → next → in_progress → done |
| **Assumption** | statement, area (desirability/feasibility/viability/usability/risk/ethics), risk level, evidence, validationStatus | untested → testing → validated → invalidated |
| **Experiment** | title, hypothesis, success/failure metrics, duration, cost, risk, expectedLearning, results | planned → running → completed |
| **TreeNode** | label, type (outcome/opportunity/solution/experiment), children[], expanded | N/A |
| **ResearchResult** | query, product, category (6 types), sources, summary, insights[], competitors[], marketSize, recommendations, savedFile | N/A |

---

## 6. Reusable UI Components (Current)

| Component | Purpose | Props |
|---|---|---|
| `Textarea` | Auto-resizing textarea | autoFocus |
| `Badge` | Tag/badge | color (5 variants: default, accent, danger, success, warning) |
| `PriorityBadge` | Pre-mapped badge for priority levels | priority |
| `Card` | Bordered container | hover, onClick |
| `Button` | Styled button | variant (primary/secondary/ghost/danger), size (xs/sm/md) |
| `Spinner` | Loading spinner | N/A |
| `EmptyState` | Empty placeholder | icon (emoji), title, description, action slot |
| `Modal` | Overlay dialog | onClose, title, width |
| `Select` | Styled native select | options |
| `ScoreSlider` | Range slider with label + value | min=1, max=10 |
| `ToastProvider/useToast` | Toast notifications | success/error/info |
| `ConfirmDialog` | Delete confirmation | title, message, onConfirm, onCancel |

---

## 7. User Flows (Key Journeys)

### Flow A: Capture Feedback → Score Opportunity → Prioritize Feature
1. Go to **Discover** → enter customer feedback text → auto-analysis runs → insight saved
2. Go to **Opportunities** → "New from Insight" → pick insight → score 6 axes with sliders → opportunity saved with priority
3. Go to **Features** → create feature linked to opportunity → score via framework → prioritized

### Flow B: Analyze Interview → Map Assumptions → Design Experiment
1. Go to **Interviews** → paste transcript → auto-analysis extracts pain points, assumptions, unknowns
2. Go to **Assumptions** → create from interview findings → classify by area → add evidence
3. Go to **Experiments** → design experiment to validate assumption → track status → record results

### Flow C: Import Document → Bulk Extract → Review & Confirm
1. Go to **Import** → drag PDF/DOCX → system parses and classifies content
2. Review extracted entities in review panel (insights, opportunities, personas, features, assumptions)
3. Confirm import → entities saved to respective collections

### Flow D: Research Market → Generate Report → Action Findings
1. Go to **Research** → enter product + query + category → web search runs
2. System generates structured report (insights, competitors, recommendations)
3. For each finding, click "Create Opportunity" / "Create Feature" / "Create Assumption" / "Create Experiment"
4. Download report as .md

### Flow E: Visualize & Explore the Opportunity Solution Tree
1. Go to **Tree** → auto-built SVG tree from opportunities + experiments
2. Click nodes to expand/collapse branches
3. Drag to pan around large trees
4. Manually add nodes to extend the tree

### Flow F: Global Search
1. Press `Ctrl+K` → type query → fuzzy search across insights, opportunities, personas, interviews, features, assumptions, experiments, research
2. Results grouped by type → click result → navigate to entity

---

## 8. Known UX Issues (Improvement Targets)

1. **Emoji-only icons:** Every icon in the app (sidebar, buttons, cards, empty states, tabs) is a raw emoji character. This creates an inconsistent, unprofessional look that varies by operating system. Should be replaced with a proper icon library (Lucide, Phosphor, or Heroicons).

2. **No mobile/tablet responsiveness:** The app is desktop-only. The 224px fixed sidebar, multi-column grids, and lack of breakpoints mean it is unusable on smaller screens.

3. **No icon library:** No icon component system exists. All "icons" are string-literal emojis.

4. **Inconsistent delete confirmation:** Some pages delete immediately on clicking an X button (personas, interviews, features, experiments, assumptions). Only insights and opportunities use a `ConfirmDialog`. This inconsistency is dangerous.

5. **No visual hierarchy on list pages:** Pages like Opportunities, Features, and Assumptions render flat lists of cards with dense, text-heavy content. There is no visual distinction between items, no grouping, no filtering UI (except a basic status/area filter on Assumptions), and no card status indicators beyond a small badge.

6. **Dashboard is purely tabular/statistical:** The dashboard shows stats cards and tables but lacks any charts (no trend lines, no bar charts, no heatmaps, no visual representations of the data).

7. **No onboarding or empty-state guidance:** First-time users land on empty pages with basic `EmptyState` components. There is no guided setup, no sample data, no walkthrough.

8. **Dark mode flash:** Dark mode is applied client-side only (`useEffect`), causing a flash of the light theme on page load.

9. **Inconsistent form patterns:** Some pages use inline forms, some use modals, some use both. Some have cancel buttons, some don't. Field labels and layouts vary between pages.

10. **Scoring sliders lack context:** The 6-axis sliders on the Opportunity page show raw numbers (1-10) but provide no labels, descriptions, or guidance on what each axis means at different levels.

11. **Tree visualization is low-fidelity:** The SVG tree is functional but visually unrefined — no curved edges, no color-coding beyond labels, no zoom controls, no minimap for large trees.

12. **Research results are static mock data:** The research tool generates structured insights from templates, not real analysis. Real web search results only supplement the sources.

13. **Search navigates to list pages, not items:** Clicking a search result takes you to the entity list page, not to the specific item. There is no deep-linking or scroll-to-item behavior.

14. **No undo support:** Deleted items cannot be recovered without restoring from a backup.

15. **No accessibility:** No ARIA labels, no screen-reader support, no focus management beyond basic `:focus-visible` styles, no keyboard navigation within pages (only sidebar nav).

---

## 9. Design System (Current Tokens)

```
Colors:
  Background:   --bg            (white / gray-950)
  Secondary:    --bg-secondary  (gray-50 / gray-900)
  Tertiary:     --bg-tertiary   (gray-100 / gray-800)
  Text:         --text          (gray-900 / gray-100)
  Text Sec:     --text-secondary (gray-500 / gray-400)
  Text Ter:     --text-tertiary (gray-400 / gray-500)
  Border:       --border        (gray-200 / gray-700)
  Accent:       --accent        (#2563eb blue)
  Accent Hover: --accent-hover  (#1d4ed8)
  Accent Light: --accent-light  (#dbeafe / #1e3a5f)
  Danger:       --danger        (#dc2626)
  Success:      --success       (#16a34a)
  Warning:      --warning       (#d97706)

Radius:  8px (--radius)
Font:    System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)
Sizes:   xs (12px), sm (14px), md (16px), lg (18px), xl (20px)
```

---

## 10. What a Redesign Should Address

1. **Replace all emoji icons with a proper icon library** — Lucide Icons recommended (free, lightweight, React-native)
2. **Create a consistent color palette** — define primary, secondary, neutral, semantic (success/warning/danger/info) color scales
3. **Define a proper typography scale** — headings (h1-h4), body, caption, label styles with consistent sizing and weight
4. **Design responsive layouts** — breakpoints for tablet portrait, tablet landscape, and desktop
5. **Add data visualizations** — line charts for trends, bar charts for comparisons, heatmaps, radar/spider charts for opportunity scores
6. **Improve card design** — add status indicators, progress bars, contextual action menus, visual hierarchy
7. **Standardize interaction patterns** — consistent modal vs inline editing, consistent confirmation on destructive actions, consistent empty states
8. **Add onboarding flow** — guided setup wizard or progressive disclosure on first visit
9. **Redesign the Dashboard** — make it insight-first, show visual trends, highlight action items
10. **Redesign the Solution Tree** — curved edges, color-coded node types, zoom controls, minimap, better layout algorithm
11. **Add proper loading states** — skeleton screens instead of spinners, optimistic UI updates
12. **Fix dark mode** — server-side detection via cookie or `prefers-color-scheme` to eliminate flash
13. **Add accessibility** — ARIA labels, keyboard navigation, focus trapping in modals, screen-reader announcements for state changes
14. **Deep-link search results** — add `id` routes for entities so search can navigate to the specific item
15. **Add undo/trash pattern** — soft-delete with recovery period instead of immediate hard delete

---

## 11. File Reference (Key Source Files)

```
src/app/(main)/layout.tsx          — App shell (sidebar + header)
src/app/(main)/dashboard/page.tsx   — Dashboard (stats, tables, feed)
src/app/(main)/discover/page.tsx    — Insights list + form
src/app/(main)/import/page.tsx      — Document import + review
src/app/(main)/opportunities/page.tsx — Opportunity scoring
src/app/(main)/personas/page.tsx    — Persona management
src/app/(main)/interviews/page.tsx  — Interview analysis
src/app/(main)/features/page.tsx    — Feature prioritization
src/app/(main)/experiments/page.tsx — Experiment tracker
src/app/(main)/assumptions/page.tsx — Assumption mapper
src/app/(main)/research/page.tsx    — Web research tool
src/app/(main)/tree/page.tsx        — Solution tree (SVG)
src/app/(main)/search/page.tsx      — Global search
src/components/app-layout.tsx       — Sidebar + header component
src/components/ui/index.tsx         — Reusable UI component library
src/lib/types.ts                    — All TypeScript type definitions
src/lib/storage.ts                  — JSON file CRUD
src/lib/analysis.ts                 — Rule-based NLP analysis
src/app/globals.css                 — Global styles + CSS variables
```