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

# Phase 4 — "Premium industrial product" pass: audit first, then targeted fixes

Scope note up front, same reasoning as Phase 1: the brief this phase responds
to is a generic 14-phase "make it feel like Linear/Figma/TIA Portal" request,
written without visibility into what Phases 1–3 had already built. Before
changing anything, this phase audited the live app against all 14 phases.
Result: most of the structural asks were already shipped —

- **Already done, verified against the brief, left alone:** collapsible
  icon-rail sidebar with hover tooltips and grouped sections (brief Phase
  1/2); a compact contextual right-panel with capped, card-based
  formula/mistake/tip content, not paragraphs (brief Phase 3); chip-style
  (not "tiny orange buttons") suggested questions in the tutor (brief
  Phase 4); tiered `FormulaExplainer`/reveal-on-demand content on 11/18
  pages with zero >220-char inline paragraphs found in a repo-wide grep
  (brief Phase 5); the Load Calculator's input panel is already a compact
  5-field sticky card, not the "huge, intimidating form" the brief
  describes — see the code comment in `LoadCalculator.jsx` explaining why
  a locked step wizard was deliberately replaced with tabs in an earlier
  session (returning users jumping to what they need vs. re-walking steps).
  Reverting that would be a real regression for a form this size, so it
  was left as tabs rather than rebuilt into a wizard on the brief's say-so
  alone — flagging this instead of silently overriding a documented past
  decision.
- **Already done, close enough to the brief's intent it wasn't touched:**
  Crane Selector cards (large SVG, capacity/span stat blocks, hover lift,
  selection state, working Compare mode — brief Phase 7); Engineering
  Handbook (sticky scrollspy nav, search, bookmarks, recently-viewed,
  collapsible formula/example entries — brief Phase 8, minus reading time,
  fixed this phase, see below).
- **Real gap found and fixed — Tutor response formatting.** The tutor
  rendered every answer as one plain-text blob; nothing distinguished a
  formula, a list of steps, or a key term from surrounding prose, despite
  the brief explicitly asking for "beautiful markdown, equations,
  engineering blocks." Root cause was on the backend, not just the
  frontend: `prompt_builder.py`'s `SYSTEM_INSTRUCTION` told Gemini to
  return concise plain prose with no formatting guidance at all, so there
  was nothing for a frontend renderer to render even if one existed.
  Fixed both ends:
  - `backend/app/tutor/prompt_builder.py` — added a formatting instruction
    (bold key terms/ratings, "- " bullets for >2-factor explanations,
    standalone equation lines), scoped so it doesn't force structure onto
    genuinely one-sentence answers.
  - `frontend/src/components/tutor/TutorMarkdown.jsx` (new) — a small,
    dependency-free formatter (no react-markdown/katex added — deliberate,
    see file header) that renders `**bold**`, `` `inline code` ``, "- "/"1. "
    lists, and equation-looking lines in the same amber mono "data face"
    box already used for formulas in `HandbookEntry`/`ContextPanel`, so a
    formula the tutor states reads as the same kind of object as one in
    the Handbook. Verified in isolation with a small Node script covering
    a formula+bullets answer, a plain one-sentence answer, and a numbered-
    steps answer before wiring it into the message bubble.
  - `TutorMessage.jsx` — rebuilt on top of it: rounded chat-app-style
    bubbles, a real citation card for cached/handbook-sourced answers
    (was a small text badge), a proper CTA-style button for suggested
    navigation (was a text link).
  - `TutorPanel.jsx` — replaced the "Thinking…" text loader with an
    animated three-dot indicator in a bubble matching the response shape;
    added a copper→amber accent line and glass (backdrop-blur) treatment
    to the panel and launcher for a more premium chat-dock feel. A true
    token-by-token typing animation was considered and deliberately not
    built — the backend returns the full answer in one response (not a
    stream), so "typing" it out character-by-character would be simulated
    for its own sake and would slow down reading a technical answer,
    working against the brief's own "reduce cognitive load" principle.
  - `SuggestedQuestions.jsx` — added a staggered entrance and hover lift;
    was already chip-shaped, just static.
- **Real gap found and fixed — orange as UI chrome, not just accent.** The
  brief's Phase 10 ask ("orange only indicates active/calculate/warning")
  is mostly already true semantically, but the single heaviest, most
  repeated block of solid orange in the app was the active sidebar nav
  row (`bg-amber` solid fill) — present on every page, in both the desktop
  rail and the mobile drawer (`MobileHeader.jsx` renders the same
  `SidebarContent.jsx`, so one fix covers both). Changed to the
  Linear/Notion convention: a subtle `bg-amber/10` tint + a 3px left
  accent bar, amber text/icon — same visual signal, far less visual
  weight. Left the rest of the amber usage alone: it's already scoped to
  active tabs/filters, computed-value emphasis (the app's own documented
  "Rating Plate" design metaphor — copper/amber marks calculated values on
  purpose, see `index.css`), and primary CTAs, all of which are inside the
  brief's own stated exceptions.
- **Real gap found and fixed — Handbook reading time.** Brief Phase 8
  explicitly asks for "estimated reading time" and "difficulty badge" per
  topic; neither existed. Added reading time to `HandbookEntry.jsx`,
  computed from each topic's own text (~200 wpm). Difficulty badge was
  **not** added — that needs real per-topic engineering judgment (~40
  topics) this pass didn't make, and a wrong/guessed difficulty rating
  would be worse than none. Flagging as still open rather than faking it.

## Deferred — not started this phase

- **Difficulty badges per Handbook topic** — see above, needs authored
  judgment, not invented.
- **Load Calculator step-wizard** — see above, exists as a documented
  disagreement with the brief rather than an oversight; happy to build the
  wizard variant on explicit request despite the tradeoff.
- **Per-page text-density line edits (brief Phase 5)** — the repo-wide
  grep found no long inline paragraphs, so this wasn't a systemic problem
  to fix; a handful of individual pages may still read as dense in
  practice and would need eyes-on review, not a mechanical pass.
- **PowerCircuit / ControlCircuit / FaultDiagnosis / PanelSimulator /
  training pages** — not opened this phase beyond the repo-wide text-
  density grep. These are the largest remaining files by line count and
  are reasonable Phase 5 candidates if a deeper pass is wanted.
- **KaTeX-rendered equations** — the brief's literal "equations" ask was
  interpreted as "formulas read as distinct, formatted objects," which
  `TutorMarkdown`'s equation-line detection delivers; true LaTeX/KaTeX
  typesetting was not added (new dependency, and this app's formulas are
  single-line IEC-style expressions, not multi-line math needing real
  typesetting).
- **Loading skeletons, broader micro-interaction pass, accessibility
  audit (brief Phases 11/13)** — not started.

## Files touched
Backend: `backend/app/tutor/prompt_builder.py`. Frontend:
`components/tutor/TutorMarkdown.jsx` (new), `TutorMessage.jsx` (rewrite),
`TutorPanel.jsx` (edit), `SuggestedQuestions.jsx` (rewrite),
`components/layout/SidebarContent.jsx` (edit), `components/ui/HandbookEntry.jsx`
(edit).

## Performance impact (Phase 4 delta)
No new dependencies. `TutorMarkdown.jsx` is a new ~2KB module that only
loads as part of the already-lazy tutor bundle. Build and lint both clean
(`npm run build`, `npm run lint`) after this pass.

# Phase 5 — Structural IA redesign

Different mandate than Phases 1–4: explicit permission (and instruction) to
delete/merge/move, evaluated against measurable targets rather than taste.
Went back into the app shell itself rather than individual pages. Verified
every change with a real build + a headless-browser pass (Playwright,
screenshots + `getBoundingClientRect` measurements), not just "should work."

## What shipped this phase

- **Merged the two competing secondary panels into one.** The right-hand
  `ContextPanel` was permanently mounted (a fixed 300px grid column, always
  visible, on every workspace page) at the same time the `TutorPanel` could
  independently be popped open as a floating dock — i.e. two secondary
  panels really could be open simultaneously, which is exactly what target
  #2 says shouldn't be possible. Deleted both components. Built
  `AssistPanel.jsx`: one floating drawer, two tabs (Theory / Tutor), driven
  by one new store (`assistPanelStore.js`, `mode: null|'context'|'tutor'`).
  There is now exactly one drawer component in the codebase, so "two
  secondary panels open at once" isn't a state that can exist, structurally,
  not just by convention. Bonus: added a real cross-link — a "Ask Tutor"
  button on each Theory card that switches to the Tutor tab and asks about
  that specific topic, so the two modes reinforce each other instead of
  duplicating each other's content.
- **Workspace width — measured, not eyeballed.** Removing the permanent
  300px context column let the main content grid go full-width. Measured
  actual rendered content width vs. viewport with Playwright on the live
  build: **81.7% at 1440px, 86.2% at 1920px, 74.2% at 2560px ultrawide**
  (bumped the container's max-width one step at the `2xl` breakpoint so
  ultrawide didn't fall short of the 70% target). All comfortably clear of
  the 70% floor. Numbers are reproducible — see the Playwright snippet in
  this repo's history if you want to re-run them after further changes.
- **Deleted `WorkflowStepper.jsx`.** It was a full second copy of the exact
  7-step workflow list already shown in the sidebar — same steps, same
  numbers, same "current step" highlight, rendered a second time as a
  horizontal bar above every page's content. Straightforwardly the
  "duplicate navigation" target #5 was describing. The sidebar is now the
  one place workflow position is shown. Also recovers real vertical space
  on every page.
- **The "5-second scan test" — found it failing on literally every
  workspace page, fixed once at the shell level.** Grepped all 18 pages:
  zero of them had an `<h1>` (only the print report did). Every workspace
  page opened straight into filter chips / a form / a card grid with no
  on-page statement of what it's for — the only wayfinding signal was a
  12px breadcrumb. Rather than hand-edit 14 pages, added one
  `PageHeader.jsx`, mounted once in `App.jsx` above the existing
  Breadcrumb/ProjectStatusBar, that reads the title + one-line description
  already sitting in `navigation.js` (used for tooltips, never surfaced as
  an actual heading) and renders it as a real page title. Zero new copy
  written — the descriptions were already good, just never shown. Covers
  all 14 non-excluded workspace pages in one change; Home, Handbook,
  Dashboard, and the Report already have their own purpose-built headers
  and were correctly left alone (`WORKSPACE_EXCLUDED` in `App.jsx`).
- **Verification, not just claims.** Built the app, installed deps fresh,
  ran `npm run lint` and `npm run build` clean. Ran a headless Chromium
  (Playwright) against the actual preview build: screenshotted Home, Crane
  Selector, Load Calculator, Engineering Handbook, the Assist panel open
  and closed, and a mobile (390px) view; measured real content-width
  percentages at three viewport sizes rather than asserting the layout
  math worked.

## Deferred — not started this phase

- **Per-page whitespace/typography pass (target #6) and the "hide one of
  two useful things behind an interaction" pass (target #7)** — the shell
  changes (merged panel, wider workspace, page headers) are the structural,
  systemic wins; a page-by-page density/typography pass on all 18 pages is
  a much larger, slower job (eyes-on per page, not a shared-component fix)
  and wasn't attempted this round.
- **Individual page content audits for duplicate explanations** beyond the
  shell-level ones found (WorkflowStepper, the two-panel overlap) — e.g.
  whether any single page repeats the same formula explanation in two
  places on itself. Not checked page-by-page this round.
- Same deferred items as Phase 4 (difficulty badges, Load Calculator
  wizard reconsideration, KaTeX, accessibility audit) — unchanged.

## Files touched
New: `store/assistPanelStore.js`, `components/layout/AssistPanel.jsx`,
`components/layout/PageHeader.jsx`. Deleted:
`components/layout/ContextPanel.jsx`, `components/tutor/TutorPanel.jsx`,
`components/layout/WorkflowStepper.jsx`. Edited: `App.jsx`,
`tutor/tutorStore.js` (dropped now-unused `open`/`setOpen`/`toggleOpen`),
`config/navigation.js` (comment only), `store/projectStore.js` (comment
only).

## Performance impact (Phase 5 delta)
Net negative bundle size — this phase deleted more than it added
(`TutorPanel.jsx` + `ContextPanel.jsx` + `WorkflowStepper.jsx` removed,
`AssistPanel.jsx` + two small new files added, and `AssistPanel.jsx` reuses
most of the deleted files' logic rather than duplicating it). No new
dependencies. Build stayed clean.
