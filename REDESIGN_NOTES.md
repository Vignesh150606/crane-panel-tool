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
