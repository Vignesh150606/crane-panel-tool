# Changelog

Full detail for each entry lives in its own report file, linked below —
this is the scannable version.

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
