# Product Design Redesign — Phase 1

Scope note up front: the brief this phase responds to (13 sections — full visual
redesign, two brand-new interactive features, an expanded export system, and a
release-quality review) is realistically several weeks of senior-product-team
work, not one pass. Rather than touch all 13 sections shallowly — which on a
codebase this size means broken states and invented behavior — this phase
takes the structural, highest-leverage items to completion and verified them
with a real build + rendered screenshots (desktop, mobile, collapsed sidebar,
mobile drawer, plus a spot-check of Report/BOM/Simulator to confirm nothing
else regressed). Everything below is real, built, and tested. Everything
deferred is listed explicitly at the bottom with why, so it can be picked up
as Phase 2 without guessing what's already done.

## What shipped this phase

**1. Sidebar navigation replaces the 13-item horizontal navbar**
`Navbar.jsx` (deleted) is replaced by `Sidebar.jsx` (desktop, persistent,
collapsible to a 72px icon rail — state persisted) and `MobileHeader.jsx`
(hamburger + slide-in drawer below `lg`). Both render from one shared
`SidebarContent.jsx` so desktop and mobile can't drift out of sync. Sections:
Quick Access (Home, Handbook), Recently Visited (auto-tracked, only shows once
there's history), Design Workflow (numbered 1–7, green check when a step has
data — reuses `projectStore.completedSteps()`), Reference Tools.

**2. One shared nav config** — `src/config/navigation.js`
Previously Navbar, Home, and WorkflowStepper each hardcoded their own copy of
the page list (already slightly out of sync). Now there's one array of
`{path, label, icon, description, step, key}` that all three read from.

**3. Wider layout, applied globally**
The blanket `max-w-[1280px]` wrapper in `App.jsx` (which every single route
rendered through) is now `max-w-[1600px]`, alongside the new sidebar. Because
it's one shared wrapper, every page benefited immediately — this is most of
what "audit every page for unused space" meant in practice, done as one
structural change instead of 15 individual page edits.

**4. Homepage rebuilt**
Old: centered text hero, no illustration, empty right side on wide screens.
New: two-column hero (headline/copy/CTAs/capability strip on the left, a
bespoke SVG panel-schematic illustration on the right — `PanelSchematic.jsx`,
built from the app's own copper/amber/IEC-lamp tokens, not a stock asset).
Capability strip only claims things verified in the actual codebase (IS/IEC
calc references, the FormulaExplainer tier system, live circuit logic, print-
to-PDF export) — deliberately didn't add an "offline support" chip like the
reference image's, since this app has no service worker/PWA layer to back
that claim. Workflow and Reference Tools sections now use a 4-col / 3-col
grid at `xl` instead of maxing out at 3 columns, so the wider container
actually gets used instead of just adding side padding.

**5. Verified, not assumed**
Ran `npm install` + `npm run build` clean, then used Playwright to render and
visually check: home (desktop full-page + mobile), calculator, handbook,
report, BOM, simulator, collapsed sidebar, and the mobile drawer open state.
No console/page errors on any of them.

## Deferred — not started this phase

These are the sections from the brief not touched yet, roadmapped in a
sensible build order rather than attempted shallowly:

- **Industrial Panel Explorer** (new page) — clickable panel diagram cross-
  linked to handbook/calculator/interview content. Not added to navigation
  yet because it doesn't exist — adding a nav entry for it would be a dead
  link.
- **Troubleshooting Challenge Mode** (new feature) — fault-injection
  diagnostic simulator. Same reasoning — not linked until it's real.
- **Export system expansion** — BOM/component-selection/motor-selection as
  separate report exports. Today there's only the one print-to-PDF report.
- **Engineering Handbook doc-software navigation** — search, TOC, sticky
  sidebar, backlinks, related-topics.
- **Per-page layout passes** for the 7 workflow pages individually (Load
  Calculator progressive disclosure, etc.) beyond the shared container fix.
- **Light mode** — the app is dark-only; a real light theme means a second
  full token set, tested across every page, not a toggle that half-works.
- Micro-interaction/empty-state/skeleton polish pass across all pages.
- Persona-based release review (ABB/Siemens engineer, professor, interviewer,
  beginner) — meaningful once the above exists to review.

## Files touched
`App.jsx` (shell rewrite), `Home.jsx` (rebuilt), `WorkflowStepper.jsx`
(reads shared config) — modified.
`Sidebar.jsx`, `MobileHeader.jsx`, `SidebarContent.jsx`,
`config/navigation.js`, `store/uiStore.js`,
`components/illustrations/PanelSchematic.jsx` — new.
`Navbar.jsx` — removed (fully superseded).

## Performance impact
Bundle composition is essentially unchanged (route-level code-splitting was
already in place and is untouched). New illustration is inline SVG (no image
asset added). Sidebar/uiStore add ~2KB uncompressed. No new runtime deps.

---

# Phase 2 — Connected Workspace

Builds directly on Phase 1 — sidebar, wide layout, and homepage are
untouched and kept exactly as they were. This phase's brief (global layout
hierarchy, per-page redesign, handbook overhaul, global search, context
panel, project dashboard, cross-linking, industrial chrome, full consistency
pass) is again more than one pass can respectably finish, so the same
approach as Phase 1 applies: take the structural items all the way to a
real, tested state; name what's deferred instead of half-doing it.

## What shipped this phase

**1. Global workspace chrome — applied to all 12 pages from one place**
Rather than editing each of the 7 workflow + 5 reference pages individually
(high risk of breaking their existing, already-audited engineering logic),
the breadcrumb / project-status-bar / context-panel layer was added once in
`App.jsx`, keyed off the route. Every workflow/reference page picked it up
automatically with **zero changes to the page files themselves** — their
calculations, state, and existing `PageHeader` usage are exactly as they
were before this phase. Home, Handbook, Report and Dashboard opt out (each
has its own layout reason, documented in `App.jsx`).

- `Breadcrumb.jsx` — Home / section / page.
- `ProjectStatusBar.jsx` — project name, selected crane, a bank of 5 status
  LEDs (crane/load/cable/circuit/bom, from `projectStore.completedSteps()`),
  live completion %, and a title-block-style REV A / date stamp.
- `ContextPanel.jsx` — right-hand column (stacks below on <xl) showing up to
  2 related handbook topics (equation, one-line meaning, first common
  mistake, interview tip, deep link) plus a "Next Recommended Step" card.
  **All of this content is pulled from `handbookContent.js`, which already
  existed and was already engineering-audited — nothing new was invented.**
  9 of 13 pages had this tagging built in already (`relatedCalculator`); the
  other 4 (BOM, Nameplate, Power Circuit, Simulator, Fault Diagnosis) got a
  small supplementary map in `workspaceIndex.js` pointing at the same
  existing topics, since the concepts clearly apply there too but weren't
  wired up.

**2. Project Dashboard** — new page, `/dashboard`
Live crane/motor/cable/BOM summary, a completion ring, an incomplete-
sections warning list, and a reset-project action. Every field is read
directly from `projectStore` / `craneData.js` (the same source
`ProjectReport.jsx` already used) — no new project fields were invented to
fill it out.

**3. Global search** — Ctrl/Cmd+K command palette
Searches pages, all 27 handbook formulas, the protection-device glossary,
and IEC symbol reference from one box, with keyboard navigation. Index is
built once from existing data (`workspaceIndex.js`) — no separate content
written for search.

**4. Handbook rebuilt as a real doc layout**
Sticky left nav (scrollspy-highlighted section + topic tree) replaces the
old horizontal pill row; "Browse by Topic" category cards up top; Bookmarks
and Recently Viewed sections (new `handbookStore.js`, same persisted-store
pattern as the rest of the app) that populate as you use it.
`HandbookEntry.jsx` got a bookmark toggle added to its header — its
accordion behavior and all its content rendering are untouched.

**5. Verified, not assumed**
Full rebuild + a route-by-route sweep (all 15 routes, desktop 1680px +
mobile 390px): zero console/page errors, zero horizontal overflow. Also
specifically checked: the context panel's grid collapses from a right column
to full-width-stacked below the `xl` breakpoint (measured via bounding
boxes, not just visually assumed); the sidebar stays `sticky` through a
2000px scroll on the longest page (Handbook); bookmark → recently-viewed →
search all interact correctly end to end.

## Deferred — not started this phase

- **Load Calculator split-layout rebuild** (brief section 3). The current
  5-step wizard already avoids "wall of stacked cards" via progressive
  disclosure, and reworking its interaction model risks the verified
  calculation logic in a 24KB file that's had a full engineering audit pass.
  This deserves a dedicated, focused pass rather than being squeezed in
  alongside 4 other major features — flagging rather than rushing it.
- **Per-page bespoke redesign** of the 7 workflow pages' internal layout
  (their own card structure, spacing, tables). What shipped wraps them
  uniformly from outside; their interiors are unchanged.
- **Industrial Panel Explorer, Challenge Mode, expanded export system,
  light mode** — still not started, carried over from Phase 1.
- **Wire tags / terminal tags / panel tags** inside Panel Layout and Control
  Circuit specifically (brief section 11) — the status bar covers the
  project-metadata half of "industrial feel"; the panel/wire-label half
  would mean editing those two pages' internals directly.
- Full line-by-line UI consistency audit (typography scale, table styles,
  chart styling) across all 12 pages — the shared chrome addresses this at
  the structural level; a detailed pass page-by-page is still open.
- Persona-based release review — meaningful once the deferred items above
  exist.

## Files touched
`App.jsx` (workspace chrome + dashboard route + command palette wiring),
`Home.jsx` (dashboard cross-link, hero-glow overflow fix),
`EngineeringHandbook.jsx` (full rebuild), `HandbookEntry.jsx` (bookmark
toggle added), `Card.jsx` (added a `warning` variant) — modified.
`ProjectDashboard.jsx`, `Breadcrumb.jsx`, `ProjectStatusBar.jsx`,
`ContextPanel.jsx`, `CommandPalette.jsx`, `data/workspaceIndex.js`,
`store/handbookStore.js` — new. `Sidebar.jsx` / `MobileHeader.jsx` /
`SidebarContent.jsx` / `config/navigation.js` — extended (search trigger,
Dashboard entry) without changing Phase 1's structure.

## Performance impact (Phase 2 delta)
Handbook chunk grew ~9KB → 14.6KB (scrollspy + nav tree + bookmark store).
New Dashboard chunk: 6.1KB. Command palette + workspace chrome: ~4KB
combined, loaded in the main bundle since they're global (not route-split).
All still gzip well under 5KB per chunk; no new runtime dependencies.

