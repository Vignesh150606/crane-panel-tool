# Changelog

Full detail for each entry lives in its own report file, linked below —
this is the scannable version.

## v1.1.5 — Spacing pass on the sidebar and Handbook (Phase 7, cont.)

Different kind of change from v1.1.3/v1.1.4: those cut duplicate content;
this pass added breathing room to layout that was already lean on content
but visually cramped — prompted by screenshots showing the global sidebar
and the Handbook page looking dense despite having no actual duplicate
text left to remove.

- `components/layout/SidebarContent.jsx`: increased row padding (`py-2` →
  `py-2.5`) and the gap between rows (`mb-0.5` → `mb-1`); increased spacing
  above each section label (`pt-4` → `pt-6`) and added a subtle top border
  between groups (Quick Access / Recently Visited / Design Workflow /
  Reference Tools / Training Modules) so the sidebar reads as distinct
  grouped sections instead of one long undifferentiated list — same
  information, clearer rhythm.
- `pages/EngineeringHandbook.jsx`: increased the gap between the sticky
  left nav and main content (`gap-8` → `gap-10`), the left nav's own topic
  sub-list spacing, the space between sections (`space-y-8` → `space-y-10`)
  and between topic rows within a section (`space-y-2.5` → `space-y-3`),
  and the section-overview card grid's gap and bottom margin. This is the
  page with by far the most stacked rows (19 topics + glossary + FAQ), so
  it got the most attention.
- `components/ui/HandbookEntry.jsx`: slightly taller closed-row padding
  (`py-3` → `py-3.5`).

No content, numbers, or navigation removed or restructured — every link,
section, and topic still does exactly what it did before, just with more
room around it. No backend files touched. `npm run lint`, `npm run build`,
and `ssr-smoke-test.mjs` (19/19) all clean.

Note: this sandbox has no browser/screenshot tooling, so these are
reasoned, deliberate spacing increases against the actual screenshots
provided, not visually verified pixel-by-pixel on this end — worth a fresh
screenshot after deploying to confirm it reads right, especially on the
Handbook's two-column layout at your actual viewport width.

## v1.1.4 — App-wide density audit (Phase 7, cont.)

Follow-up to v1.1.3: re-audited every page/panel in the app for the same
class of problem (repeated or duplicate content on result-heavy screens),
not just the one component fixed last time.

Full page-by-page review found no other instance of the specific
"same sentence repeated per card" pattern v1.1.3 fixed — every other page's
descriptive text (fault descriptions, formula reasoning, checklist items,
toggle captions, page-header one-liners) turned out to be genuinely unique
per-instance content already, not duplicate boilerplate, and most of it was
already behind progressive disclosure (collapsed `FormulaExplainer`/
`CollapsibleSection`) from earlier passes. No changes made to those pages —
per the standing rule, lean pages are left alone rather than churned for
the sake of a diff.

That review did surface a different, real duplication introduced by the
v1.1.3 layout: on three pages, a `StatPlate` showing a component's Amp
rating sat directly above an `EngineeringStatus` card that (post-v1.1.3)
now shows that exact same number inline as "selected", with more context
(required + margin) than the StatPlate had. Confirmed via the backend
(`app/status.py` / `app/routers/calculations.py` / `app/routers/cable.py`)
that these were literally the same value before touching anything, not just
visually similar:

- **Load Calculator** (`pages/LoadCalculator.jsx`, Components tab): removed
  the "Contactor" and "MPCB" StatPlates from each of the 3 motor cards (6
  StatPlates total) — same Amp figures the `EngineeringStatus` cards
  directly below already show. Kept the "Cable Size" StatPlate (mm²), since
  that's cross-section, a different value from the cable's Amp capacity
  that `EngineeringStatus` displays.
- **Nameplate Calculator** (`pages/NameplateCalculator.jsx`): removed the
  "Contactor Rating" and "MPCB Rating" StatPlates. Also dropped the "2x FLC
  rule" caption that lived on the Contactor Rating StatPlate — that
  derivation already has a proper home (the "Learn the theory" link to the
  Handbook's Contactor Sizing entry), so it was a second, thinner copy of
  content that exists in full elsewhere rather than a number found nowhere
  else. Kept Motor Power, Full Load Current, Overload Setting (no
  `EngineeringStatus` shows this one), and Cable Size (mm²).
- **Cable & Busbar** (`pages/CableBusbar.jsx`): removed the "Capacity" (A)
  StatPlate — same figure the "Cable sizing margin" `EngineeringStatus`
  card right below it already shows. Kept "Recommended Size" (mm²).

No number was actually deleted from the app in any of these — each removed
StatPlate's value is still on screen, in the `EngineeringStatus` card
immediately below where the StatPlate used to sit. No backend, calculation,
or validation files touched — `cable_capacity`, `contactor_rating` and
`mpcb_rating` are still returned by the API, just no longer double-rendered
on these three pages. `npm run lint`, `npm run build`, and
`ssr-smoke-test.mjs` (19/19 pages) all clean.

## v1.1.3 — Cut repeated result-page text (Phase 7)

Problem: result-heavy pages built on `EngineeringStatus` (Contactor/MPCB/Cable
margin cards) were showing a full explanatory sentence on every single card,
even though that sentence only has 4 possible variants (undersized / adequate
/ optimal / oversized) — so it just repeated verbatim every time the status
repeated. BOM Generator's 3 motor cards × 2 components each meant the same 4
sentences printed 6 times; Load Calculator's Components tab printed them 9
times. Fixed at the component level so every consuming page inherits it —
no page-specific patches. Numbers were never touched, only the boilerplate
prose explaining them.

- `EngineeringStatus.jsx`: removed the per-instance `sizing_status_description`
  sentence entirely (the API still returns it; the component just no longer
  renders it). Collapsed the `Required: X` / `Selected: Y` / `Margin: Z%`
  three-row block into one line — the margin bar already shows the gap
  visually, so the three labels didn't need a full row each. Added a new
  `EngineeringStatusLegend` export: one shared line explaining what the 4
  badge colors mean, meant to be rendered once per page next to a group of
  cards, not once per card.
- BOM Generator (`pages/BOMGenerator.jsx`): added the shared legend once,
  above the 3-motor card grid — replaces 6 repeated sentences (3 motors ×
  Contactor/MPCB) with 1 legend line.
- Load Calculator (`pages/LoadCalculator.jsx`, Components tab): added the
  shared legend once above the 3-motor grid, and trimmed the existing intro
  paragraph's second sentence ("Each block's margin bar shows how far...")
  since the legend now covers that — replaces 9 repeated sentences (3 motors
  × Contactor/MPCB/Cable) with 1 legend line.
- Nameplate Calculator (`pages/NameplateCalculator.jsx`): added the shared
  legend once above its Contactor/MPCB/Cable row — replaces 3 repeated
  sentences with 1 legend line.
- Cable & Busbar (`pages/CableBusbar.jsx`): component-level sentence removal
  and number-row consolidation apply here too (it uses `EngineeringStatus`),
  but deliberately did **not** add the legend — this page only ever shows one
  status card, so there's no repetition to fix and a 4-item legend for a
  single card would be new clutter on a page that was already lean.
- Audited every other page for the same "small fixed set of sentences
  repeating verbatim across instances" pattern (Crane Selector, Fault
  Diagnosis, Challenge Mode, Virtual Commissioning, Star-Delta, Control/Power
  Circuit, Panel Simulator/Explorer/Layout, Project Report, Project
  Dashboard, Home, Handbook, Tutor). Found nothing else matching it — every
  other repeated-looking block turned out to be genuinely unique per-instance
  content (fault descriptions, formula explanations, checklist items), not
  duplicate boilerplate — so left unchanged rather than manufacturing
  changes on pages that were already lean.
- No backend, calculation, or validation files touched. `npm run lint`,
  `npm run build`, and `ssr-smoke-test.mjs` (19/19 pages) all clean.

## v1.1.2 — Accessible-name audit (Phase 6, cont.)

Requested reference for this round: a Mobbin gallery link for Dovetail (the
research-repository SaaS tool). Mobbin blocks non-authenticated/bot fetches,
so the gallery itself couldn't be opened; image search for the actual product
UI also came back thin. What was verifiable and used instead: Dovetail's own
engineering blog post on their real navigation/IA redesign, which states two
concrete, checkable principles — "every action now has a label, instead of
just an icon" and clearer plain-language naming over abstract internal terms.
This app's dark industrial "Rating Plate" language stays as-is (Dovetail is a
light-mode research tool — copying its visual style here would be the exact
generic-reskin mistake the original brief warned against); the icon-label
principle is the one piece that's genuinely tool-agnostic and worth checking.

- Audited every icon-only control app-wide for an accessible name. Fixed 5
  that had none: the tutor page's error-dismiss button, the toast
  dismiss button, the crane detail panel's close button, the tutor panel's
  close button, and the sidebar's search button in its collapsed (icon-rail)
  state — that last one already had a hover tooltip, but `Tooltip.jsx`'s own
  doc comment says outright that a tooltip is "a visual aid, not a
  replacement for the trigger's own accessible name," which this instance
  wasn't following.
- Checked navigation labels against Dovetail's "rename abstract jargon"
  principle — nothing needed changing; the existing labels (Load Calculator,
  BOM Generator, Star-Delta Calculator, etc.) are already plain, domain-
  standard terms for this audience, not internal/abstract naming.
- Checked `EmptyState` usage against the "empty states should be
  actionable" idea — all 4 current usages sit directly beside their own
  trigger (the form or list that fills them), so no dead-end empty state
  needed a CTA added; left the component alone rather than adding one for
  its own sake.

## v1.1.1 — Density & hierarchy audit (Phase 6)

Scope note: this pass was requested as a full ground-up UI/UX transformation.
Auditing the actual app first (every page, the shared component library, the
"Rating Plate" token system) found it already implementing almost everything
that brief asks for — FormulaExplainer's 4-tier progressive disclosure,
CollapsibleSection, the Phase 5 sidebar/AssistPanel work, ProjectDashboard's
answer-first hero. So instead of discarding a working, purpose-built design
system for a generic one, this phase did a targeted cleanup + density pass
and left the rest alone rather than manufacturing churn. No visual/browser
tooling was available this session (no Playwright, unlike Phase 1/4/5) — this
was verified with `npm run lint`, `npm run build`, and `ssr-smoke-test.mjs`
(19/19 pages), not rendered screenshots. A live visual pass is still worth
doing before calling this final.

- Deleted 4 dead files the codebase had accumulated across earlier phases:
  `layout/PageHeader.jsx` and `WorkflowStepper.jsx` — both superseded per
  the Phase 5 notes above, but never actually removed from the tree — plus
  `Navbar.jsx` and `ContextPanel.jsx`, both fully unreferenced.
- Removed a "Need help?" sidebar card that duplicated the Handbook link
  already pinned under Quick Access.
- Home: the Reference Tools + Training Modules sections (8 equal-weight
  cards, competing for attention with the primary 7-step workflow grid)
  are now two compact list panels — same content, a fraction of the visual
  weight. Workflow cards are still the dominant element on the page.
- Cable & Busbar page: the Bus Bar vs. Stretch Wire recommendation now
  appears before the reasoning that supports it, not after; the size
  comparison chart, cross-section diagram, and formula detail on both
  cards moved behind `CollapsibleSection` instead of stacking under the
  result by default.
- Minor copy fix on Power Circuit (a stray sentence about phase reversal
  had ended up appended to an unrelated paragraph about duct spacing).

*Full detail: see the assistant's summary in this session.*

## v1.1.0 — Structural IA redesign (Phase 5)
*Full detail: `REDESIGN_NOTES.md`, "Phase 5"*

- Merged the always-open right-hand context panel and the floating AI
  Tutor into one drawer (`AssistPanel.jsx`, two tabs) — only one secondary
  panel can be open at a time now, structurally, not by convention.
- Removed the permanent 300px context column. Main workspace now measures
  **81.7%–86.2% of viewport width** at 1440–1920px (measured with
  Playwright against the live build, not estimated).
- Deleted `WorkflowStepper.jsx` — it duplicated the sidebar's own 7-step
  workflow list on every page.
- Added `PageHeader.jsx`: every workspace page now opens with a real title
  + one-line "what to do here" instruction (previously zero of 18 pages
  had an `<h1>`). Sourced from descriptions already in `navigation.js` —
  no new copy needed.

## v1.0.3 — CORS: allow any Vercel deployment of this project

`ALLOWED_ORIGINS` in Render was set to one exact origin, but every new
Vercel deployment gets a new random-hash preview URL
(`crane-panel-tool-<hash>-vignesh-m-s-projects1.vercel.app`), so the tutor
broke on every push that changed the hash — browser reported it as a CORS
preflight failure. `app/config.py` now also exposes
`ALLOWED_ORIGIN_REGEX` (`^https://crane-panel-tool(-[a-zA-Z0-9]+)*\.vercel\.app$`),
wired into `CORSMiddleware` in `app/main.py` alongside the existing exact
list. Matches the stable production alias, every preview hash, and
git-branch preview URLs — nothing to update in Render on future
deployments. Unit-tested against the failing origin plus adversarial
lookalikes (`evil-crane-panel-tool.vercel.app`, wrong TLD, `http://`
instead of `https://`) before shipping.

## v1.0.2 — Premium UX pass (Phase 4)
*Full detail: `REDESIGN_NOTES.md`, "Phase 4"*

- Audited the live app against a full 14-phase "premium industrial
  product" design brief before changing anything — most of it was already
  shipped in earlier phases; see Phase 4 notes for what was verified vs.
  genuinely fixed vs. deliberately left as-is (with reasons).
- Engineering Tutor: answers now render lightweight markdown (bold terms,
  bullet/numbered steps, standalone equations in the same style as
  Handbook formulas) instead of one plain-text blob — fixed at the root by
  adding formatting guidance to the Gemini prompt, not just the frontend.
  New citation card for handbook-sourced answers, animated typing
  indicator, glass/accent styling on the tutor dock.
- Sidebar: active nav item changed from a solid amber fill to a subtle
  tinted background + left accent bar (desktop rail and mobile drawer
  both, one shared component) — same signal, less visual weight.
- Engineering Handbook: entries now show a computed estimated reading
  time.

## v1.0 — Productization pass
*Full detail: `V1.0_PRODUCTIZATION_REPORT.md`*

- Codebase audit: fixed a real one-frame-stale bug in the shared crane
  interlock simulation (`MiniControlCircuit.jsx`, used by Challenge Mode and
  Virtual Commissioning) and 3 other `react-hooks/set-state-in-effect`
  instances (`CommandPalette.jsx`, `MobileHeader.jsx`) — all replaced with
  React's documented render-time state-adjustment pattern. Fixed 2 unused-
  variable lint errors. Frontend lint is now zero errors/warnings.
- Extended `ssr-smoke-test.mjs` to cover 4 pages added in the V2 training
  platform update that were never added to it (`ProjectDashboard`,
  `PanelExplorer`, `ChallengeMode`, `VirtualCommissioning`) — 18/18 pages
  now covered, all passing.
- Added a root `.gitignore` (none existed — `node_modules`/`dist`/`.env`
  were untracked but unignored).
- Full documentation set added: architecture guide with diagrams, API
  reference, deployment guide, engineering assumptions reference, folder
  structure reference, known limitations, roadmap, developer guide, demo
  guide, interview/viva prep guide.
- Real screenshots (not placeholders) captured via a scripted Playwright
  walkthrough across desktop and mobile — `docs/screenshots/`.
- Performance/security audit: confirmed route-based code splitting,
  tree-shaken icon imports, and input validation were already solid;
  documented rather than re-built (see the productization report for what
  was checked and found already correct).

## v3 — Engineering Tutor
*Full detail: `V3_ENGINEERING_TUTOR.md`*

- AI Engineering Tutor added: Gemini-powered, context-aware of the current
  page/calculation/simulation state, grounded in the app's own Handbook
  content, restricted to the app's engineering domain.
- Supabase added as the tutor's persistence layer (daily rate limits,
  definitional-question caching) — the app's first database; everything
  else remains stateless/localStorage-based.
- Investigated the "clean up every page" ask from the same brief and found
  it largely already done by the v2/redesign work below — added a reusable
  `CollapsibleSection` primitive rather than force changes onto pages that
  didn't need them.

## v2 — Industrial Crane Controls Training Platform
*Full detail: `TRAINING_PLATFORM_NOTES.md`*

- Interactive Panel Explorer (`/panel-explorer`), Industrial Challenge Mode
  (`/challenge-mode` — scenario-based fault diagnosis, scored), Virtual
  Commissioning (`/commissioning` — 13-step checklist with deliberate wrong
  readings to catch).

## v1 — Product redesign (3 phases)
*Full detail: `REDESIGN_NOTES.md`*

- Phase 1: sidebar navigation replacing a 13-item horizontal navbar, one
  shared nav config, wider layout, rebuilt homepage.
- Phase 2: "Connected Workspace" — cross-page context linking.
- Phase 3: interior workspace completion.
- Also in this era (see engineering audit log in `README.md`): corrected a
  double-efficiency-deration bug inflating FLC ~27%, corrected an unsourced
  3× contactor multiplier to the IEC 60947-4-1-documented 2× ceiling,
  replaced a flat 85% efficiency assumption with a real per-kW IE2/IE3
  lookup table, fixed a forward/reverse simultaneous-press race condition.
