# Future Roadmap

Not commitments — a organized list of what would genuinely move this
forward, roughly ordered by impact within each category.

## Accounts & persistence
- Real user accounts (even a lightweight magic-link/OAuth setup) would
  unlock: cross-device project sync, a real per-account tutor limit instead
  of the anon-id/IP approximation, and a "my projects" history instead of
  one project per browser.
- If accounts land, the tutor's rate limiting could move from
  anon-id-or-IP to a proper per-account limit — closing the "clear storage
  to reset" gap noted in `docs/LIMITATIONS.md`.

## Engineering depth
- Pull actual motor datasheet efficiency (S3/S4 duty) instead of the S1
  IEC-table estimate, if a manufacturer catalog integration is ever worth
  the maintenance cost.
- Ambient temperature / altitude / cable-grouping derating factors.
- Additional crane types beyond the current library (see
  `frontend/src/data/craneData.js` for what's covered today).

## Engineering Tutor
- Admin visibility into usage/cache (currently just raw Supabase tables,
  queryable but not surfaced in-app) — a simple dashboard showing
  question volume, cache hit rate, and common questions would help tune the
  daily limits and caching heuristics with real data instead of estimates.
- Voice input for the tutor panel (useful on a shop floor / lab bench where
  typing is inconvenient).
- Streaming responses instead of waiting for the full answer — Gemini
  supports this; not implemented in V3 to keep the structured-JSON-output
  parsing simple.

## Testing
- A committed browser E2E suite (Playwright) covering the core workflow
  end to end — the walkthrough script used to QA this pass
  (`docs/screenshots/` was generated from it) is a reasonable starting
  point to formalize into `frontend/e2e/`.
- Backend integration tests for the calculation endpoints, not just the
  tutor module.

## Accessibility
- A formal WCAG pass — keyboard navigation and screen-reader labeling
  audit across all pages, not just the ones touched incidentally during
  feature work.

## Portfolio / distribution
- A hosted public demo instance with its own (lower) rate limits, separate
  from a "real" deployment, so recruiters/professors can try it without
  needing to deploy it themselves.
