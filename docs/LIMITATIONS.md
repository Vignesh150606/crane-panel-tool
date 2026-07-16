# Known Limitations

Organized by category, honestly — a reviewer finding these first is worse
than reading them here.

## Engineering scope
- Preliminary sizing tool, not a substitute for a licensed engineer's final
  panel design sign-off.
- Motor efficiency figures are continuous-duty (S1, IEC 60034-30-1) applied
  to what's usually intermittent crane duty (S3/S4, IS 807) — a defensible
  estimate, not the final motor's actual datasheet value. See
  `docs/ENGINEERING_ASSUMPTIONS.md`.
- No ambient temperature derating, cable grouping factors, or altitude
  correction on component ratings.
- Fixed IS/IEC reference tables (efficiency, cable capacity, ratings series)
  reflect standards as implemented at build time — always cross-check
  against the current standard revision for a real design.

## Accounts & persistence
- No login system. Every project lives in the browser's `localStorage` —
  clearing browser data loses the project. There's no "my projects" list or
  cross-device sync.
- The Engineering Tutor's daily question limit is counted against an
  anonymous browser ID (primary) and IP address (backstop) — see
  `V3_ENGINEERING_TUTOR.md`. The anon-id limit is trivially reset by
  clearing storage or an incognito window; accepted as a real limitation
  given there's no account system to build a harder limit on top of.

## Hosting (free tier)
- Render's free backend tier spins down when idle and takes 30-50s to wake
  on the next request. The frontend accounts for this (longer timeout,
  friendly wake-up message) but it's still a real first-request delay after
  inactivity.
- Because of the above, the tutor's rate limiting and cache had to move to
  Supabase rather than in-memory storage — see `V3_ENGINEERING_TUTOR.md`
  for the reasoning.

## Engineering Tutor
- Requires `GEMINI_API_KEY` and Supabase credentials to be configured post-
  deployment (not included, obviously — see `docs/DEPLOYMENT.md`). Without
  them the panel still renders but returns a clear "not configured yet"
  error rather than a broken UI.
- Not tested against a live Gemini/Supabase round trip from this build
  environment (no network route to either from the sandbox this was built
  in) — verified via SDK introspection and a full mocked/in-memory test
  suite instead. Do one real question after deploying.
- Challenge Mode / Commissioning hint calibration (not stating the fault's
  cause outright) relies on a system-prompt instruction, not a hard
  technical gate — Gemini is a general model, so there's no absolute
  guarantee against a cleverly-phrased request extracting the answer
  directly.
- The anonymous-ID + IP rate limiting is meant to prevent casual abuse and
  contain API cost, not to stop a determined bad actor.

## Testing
- No browser-based E2E test suite is checked into the repo (the
  screenshot/regression walkthrough used to QA this pass was a one-off
  script, not a committed test). `frontend/ssr-smoke-test.mjs` (server-side
  render smoke test across all 18 pages) is the closest thing to an
  automated regression check currently in the repo — see
  `docs/DEVELOPER_GUIDE.md` for how to run it.
- No backend integration tests are checked in for the calculation endpoints
  specifically (the tutor module does have one — see
  `V3_ENGINEERING_TUTOR.md`'s Testing section for what it covers).

## Accessibility
- Not formally audited against WCAG. The dark, high-contrast design token
  system (see `docs/ARCHITECTURE.md`) gives reasonable contrast by default,
  but keyboard navigation and screen-reader labeling haven't been
  systematically verified across all 18 pages.
