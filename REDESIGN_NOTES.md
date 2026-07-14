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

# Phase 3 — Interior Workspace Completion

Scope note up front, same reasoning as Phase 1/2: the brief (10 sections —
redesign every interior page, a full responsive/consistency/persona review)
is more than one pass covers if taken literally. The two pages the brief
calls "highest priority" (Load Calculator) and names explicitly with a long
list of asks (Cable & Busbar) got full rebuilds. Dashboard got the three
specific gaps the brief named that weren't already there. The remaining
named pages (Control Circuit, Panel Layout, BOM, Project Report) were
individually reviewed against the same bar and found to already meet it —
that judgment call is written out below per page, not just asserted.

## What shipped this phase

**1. Load Calculator — full rebuild, wizard → workspace**
The 5-step locked wizard (Motion Inputs → Motor Sizing → Components →
Formulas → Recommendation, each gated behind the previous) is now a
persistent input panel (left, sticky at `2xl`, editable at any time — no
"unlock" concept, since one API call already returns everything) next to a
4-tab results workspace: **Overview** (status banner computed from every
component's `sizing_status` across all three motors, a Recharts grouped bar
chart comparing HP and FLC per motor, compact per-motor stat cards,
assumptions block), **Components** (the contactor/MPCB/cable recommendation
cards with margin bars, now with a standards-grounded intro line instead of
being the "third step" of five), **Understand Why** (unchanged
FormulaExplainer content, just relocated into its own tab instead of forcing
a scroll past it to reach the summary), **Recommendation** (the final
summary table, unchanged logic). A short staged reveal animation (mechanical
→ motor → protection → cable, ~900ms, skipped under
`prefers-reduced-motion`) plays once per calculation — cosmetic sequencing
only, the API still resolves in one round trip. No calculation logic
touched; only presentation.

**2. Cable & Busbar — full rebuild, calculation-form → decision tool**
Single shared input card (FLC, run length, travel span — one API call
already returned both cable and busbar results; the old two-card layout
implied two separate calculations that never existed). Cable Sizing panel
gained: a voltage-drop gauge (animated fill against the IS 732 limit line,
not just two stat numbers), a visual comparison bar chart of the standard
cable sizes around the selected one (`data/cableReference.js` — a
display-only mirror of the backend's `CABLE_SIZES`/`CABLE_CAPACITY` table,
clearly commented as never driving a calculation) with smaller/inadequate
sizes shown dimmed-red and the selection highlighted, so "why this size and
not a smaller one" is a chart, not just a sentence. Bus Bar panel gained an
explicit decision-flow diagram (travel span → threshold compare → the two
branches, non-chosen one dimmed) and an Industrial Notes block grounded in
the same standards text already used elsewhere in the app (no new
engineering claims introduced).

**3. Project Dashboard — the three specific gaps the brief named**
Added a **Recommended Next Step** card (single CTA — the first workflow
item with no data yet, in the existing numbered order — distinct from the
full incomplete-sections grid, which stays) and an **Engineering Warnings**
card, separate from "incomplete sections" on purpose: incomplete means no
data yet, warnings mean data exists and something in it needs attention
(any component's `sizing_status === 'undersized'`, or
`voltage_drop_exceeds_limit`). Verified via a scripted flow (calculate a
motor, then a cable run long enough to trip the voltage-drop limit) that
the warning card renders with the correct link and message, and that the
next-step card points at the crane selector when no crane's been picked yet.

**4. Reviewed against the new bar, left as-is (with reasoning)**
- **Control Circuit** — already uses `PageHeader` + `Card` + a
  `[1fr_340px]` split layout with the live relay diagram on the left and
  status/legend cards on the right. Meets the same structural bar the new
  Load Calculator/Cable & Busbar pages were just built to.
- **Panel Layout** — already a split layout (component palette + 2D layout
  canvas), diagram-driven, not form-heavy. Not touched.
- **BOM Generator** — already table + summary-card driven, not a wall of
  inputs. Not touched.
- **Project Report** — intentionally a different template (print-formatted
  engineering document, `Section`/`InfoGrid` pattern, hidden chrome on
  print). Matching it to the dashboard-card visual language would work
  against its actual job. Not touched.
- **Engineering Handbook** — already rebuilt in Phase 2 (scrollspy nav,
  bookmarks, tiered content). Brief's asks here ("more diagrams," "more
  worked examples") are content-volume work across ~10 topics, not a
  structural redesign — see Deferred.

**5. Consistency sweep**
Grepped all 15 pages for `PageHeader`/`Card` usage: 13 of 15 use both
consistently; the 2 that don't (`Home.jsx`, `ProjectReport.jsx`) are
deliberately different by role (landing hero, print document), not
oversights.

**6. Verified, not assumed**
`npm run build` clean. Backend + frontend run locally; Playwright swept all
15 routes at the three required viewports (1366×768, 1440×900, 1920×1080)
checking `scrollWidth` vs `clientWidth` for horizontal overflow and
console/page errors — zero overflow issues, zero console errors on any
page/viewport combination. Load Calculator and Cable & Busbar were visually
rendered and inspected screen-by-screen (empty state, calculated state,
every tab, both required widths) before a tool-side image-rendering issue
partway through the session stopped further screenshots from displaying;
the Dashboard changes after that point were verified structurally instead —
scripted flow confirming the warning/next-step cards render the right
content and links (see #3) plus the same overflow/console sweep — but
weren't re-confirmed by eye. Worth a visual spot-check before treating the
Dashboard as fully signed off.

## Deferred — not started this phase

- **Panel Explorer, Challenge Mode, expanded export system, light mode** —
  explicitly out of scope per this phase's brief, carried over.
- **Engineering Handbook content depth** — brief asked for more diagrams,
  more worked examples, better formula presentation across every topic.
  The page's structure was already rebuilt in Phase 2; this is per-topic
  content authoring (~10 topics) that wasn't attempted this pass.
- **Wire tags / terminal tags / panel tags** inside Panel Layout and Control
  Circuit — carried over from Phase 2, still not started.
- **Persona-based release review** (Beginner Student / Final Year Student /
  Electrical Engineer / Professor / Placement Interviewer walking the whole
  app) — the brief's own section 10. Done implicitly for the two rebuilt
  pages while designing them, not run as a formal separate pass across all
  15 pages.
- A visual re-confirmation of the Dashboard screenshots (see #6 above).

## Files touched
`LoadCalculator.jsx`, `CableBusbar.jsx` — full rewrites. `ProjectDashboard.jsx`
— extended (two new cards + a warnings helper), existing sections
unchanged. `data/cableReference.js` — new (display-only cable size/capacity
reference table for the comparison chart).

## Performance impact (Phase 3 delta)
First use of Recharts in the app (previously an installed-but-unused
dependency). It lands in its own shared `BarChart-*.js` chunk (~339KB /
~100KB gzip) — Vite/Rollup automatically hoists it into one chunk shared
between Load Calculator and Cable & Busbar rather than duplicating it, and
it's still route-split so no other page pays for it. Own-code chunk sizes:
Load Calculator 30.1KB (was 17KB), Cable & Busbar 20KB (was ~8KB), Dashboard
8.6KB (was 6.1KB). The Recharts chunk is the one real size tradeoff this
phase made in exchange for the visual comparison chart and motor-comparison
chart the brief asked for — worth knowing about if bundle size on a free
Vercel/Render tier ever becomes a concern.
