# Changelog

Full detail for each entry lives in its own report file, linked below —
this is the scannable version.

## v1.0 — Productization pass (this release)
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
