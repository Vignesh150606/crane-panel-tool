# v1.0 Release Notes

## What this is

An EOT crane control panel design and training tool: motor sizing →
protection device selection → cable/busbar sizing → control circuit
simulation → panel layout → BOM → printable report, with every number
traceable to an IS/IEC standard, plus an AI Engineering Tutor that
understands whatever page or calculation you're currently looking at, and
three training modules (Panel Explorer, Challenge Mode, Virtual
Commissioning) for scenario-based practice.

## Who it's for

Engineering students learning crane panel design, professors wanting a
teaching aid with real (not toy) calculations, and placement interviewers
evaluating either the engineering content or the software build.

## What's in v1.0

Everything built across four prior passes, brought to a consistent,
documented, audited state in this release:
- **18 pages**: 5 calculators, control/power circuit visualizers, panel
  layout, BOM generator, printable report, dashboard, handbook, 3 training
  modules, fault diagnosis, panel simulator, crane selector.
- **Engineering Tutor**: Gemini-powered, page/calculation-aware, Handbook-
  grounded, rate-limited and cached. Requires your own `GEMINI_API_KEY` and
  Supabase project — see `docs/DEPLOYMENT.md`.
- **Full documentation set**: architecture, API reference, deployment,
  engineering assumptions, folder structure, limitations, roadmap,
  developer guide, demo guide, interview/viva prep — all in `docs/`.
- **Zero-error lint, 18/18 SSR smoke test pass** — see
  `V1.0_PRODUCTIZATION_REPORT.md` for the full QA record.

## What's NOT in v1.0

Honestly, upfront (full list in `docs/LIMITATIONS.md`):
- No user accounts — every project lives in one browser's `localStorage`.
- No committed automated E2E test suite.
- The Engineering Tutor's daily limit is approximate (anon browser ID + IP),
  not a hard per-account guarantee, since there's no login system.
- Free-tier hosting means the backend can take 30-50s to wake up after
  inactivity.

## Upgrading from a pre-v1.0 checkout

Nothing breaks — this pass was audit/documentation/bug-fix, not a rewrite
(explicitly out of scope per this pass's brief). If you're pulling this
into an existing deployment:
1. `git pull`, reinstall (`pip install -r requirements.txt` — pydantic
   version changed in V3, see `V3_ENGINEERING_TUTOR.md`; `npm install`).
2. No new env vars in this pass specifically (V3 already added the Gemini/
   Supabase ones — see `docs/DEPLOYMENT.md` if you haven't set those up
   yet).
3. Re-run `npm run build && npm run lint` — should be clean.
