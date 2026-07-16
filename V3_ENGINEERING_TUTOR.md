# Version 3 — Engineering Tutor Implementation Report

Scope note up front, same spirit as REDESIGN_NOTES.md: the V3 brief asked for
two things — an AI Engineering Tutor, and a full site-wide progressive-
disclosure pass. The tutor is real, built, and tested below (backend unit-
tested with a live TestClient against every guard/limit path; frontend built
clean with `vite build` and linted with zero new errors). The cleanup pass
turned out to be **mostly already done** — see that section for the actual
evidence, not a guess. Nothing here was left half-finished silently; anything
that needed a judgment call is called out with what was decided and why.

## Before anything was built: what the codebase actually had

No auth, no database, no session system anywhere — the backend was pure
stateless FastAPI (`fastapi`/`uvicorn`/`pydantic` only). All app state lived
client-side in Zustand stores persisted to `localStorage`. Three decisions
were needed before writing code (asked up front, not guessed):

1. **Persistence for daily limits + cache** → **Supabase**, since the backend
   had nowhere to put a counter that survives Render's free-tier spin-down.
2. **What counts as "a user"** for the 10/day limit, with no login system →
   **anonymous browser ID + IP, combined**. The anon ID (generated once,
   stored in `localStorage`) is the primary, user-facing limit; IP is a
   coarser backstop set well above it, so a shared hostel/campus network
   doesn't become the everyday limit anyone hits — see "Rate limiting" below
   for exactly how the two combine.
3. **Site-wide cleanup pass scope** → include it in this delivery.

## AI architecture

```
Frontend                              Backend
────────────────────────────────────  ─────────────────────────────────────
useTutorContext()  ─┐                 POST /api/tutor/ask
  (route + stores)  │                   1. length check
                     ├─► TutorContext    2. rate limit (anon id, then IP)
retrieval.js         │   + question      3. injection guard
  (handbook search) ─┘   + history       4. cache lookup (definitional only)
                                          5. prompt_builder → Gemini
                                          6. cache write (if eligible)
                                        → TutorResponse (answer, navigation,
                                          remaining_today, cached, refused)
```

Handbook retrieval happens **client-side** (`frontend/src/tutor/retrieval.js`),
not on the backend, deliberately: `handbookContent.js` is already the single
source of truth for engineering content, and duplicating it in Python would
mean two copies to keep in sync. The frontend searches it (keyword-matched
against title/equation/meaning/commonMistakes, plus whatever's already tagged
to the current page via `workspaceIndex.js`) and sends the matched excerpts up
as `context.handbook_excerpts`. The backend never invents an explanation from
nothing — it's told explicitly to prefer these excerpts (see prompt below),
matching the brief's "search the handbook first" requirement.

**RAG order actually implemented** (`app/tutor/prompt_builder.py`), matching
the brief's preferred order exactly: Handbook excerpts → current page →
current calculation/selections → current simulation/challenge/commissioning
state → trimmed history → the question.

## Gemini integration

- SDK: `google-genai` (the current official client — the older
  `google-generativeai` package is deprecated). Verified against the actual
  installed package (not assumed from memory): `genai.Client(api_key=...)`,
  `client.models.generate_content(model=, contents=, config=)`, and
  `GenerateContentConfig(system_instruction=, response_mime_type=
  "application/json", response_schema=<Pydantic model>)` were all confirmed
  to exist and accept these exact arguments by introspecting the installed
  `google-genai==2.11.0` package directly, not by guessing at API shape.
- **Structured output**: Gemini is asked to return JSON matching a
  `GeminiOutput` Pydantic model (`answer`, `refused`, `navigate_to`,
  `navigate_label`) via `response_schema` — so navigation suggestions and the
  domain-refusal decision are real fields the model fills in, not something
  regexed out of prose afterward.
- **Model**: `GEMINI_MODEL` env var, defaulting to `gemini-2.5-flash` (the
  documented-stable GA Flash model as of this build). Google's model lineup
  moves fast enough that this is worth checking against
  https://ai.google.dev/gemini-api/docs/models before/after deploying —
  override via the env var, no code change needed.
- **Key handling**: `GEMINI_API_KEY` is read server-side only, in
  `app/tutor/gemini_client.py`. It's never sent to the frontend, logged, or
  included in any error response — a Gemini network/auth failure returns a
  generic "couldn't reach Gemini" message to the client.
- **What I could not test**: actual live calls to Gemini. This sandbox has no
  network route to Google's API (only PyPI/npm/GitHub are reachable), so
  everything Gemini-specific is verified by SDK introspection + a `503 "not
  configured"` path (confirmed working — see Testing below), not by a real
  round trip. Please do one real question after deploying to confirm the live
  response shape matches what `gemini_client.py` expects.

## Backend changes

New: `backend/app/tutor/` (`config.py`, `models.py`, `identity.py`, `store.py`,
`domain_guard.py`, `prompt_builder.py`, `gemini_client.py`, `service.py`),
`backend/app/routers/tutor.py` (`POST /api/tutor/ask`, `GET /api/tutor/usage`),
`backend/supabase/schema.sql`. Existing calculator routers/engineering logic
were **not touched** — `app/engineering.py`, `app/routers/calculations.py`,
`app/routers/cable.py`, `app/routers/bom.py` are unchanged.

`requirements.txt` gained `google-genai==2.11.0` and `supabase==2.31.0`.
`pydantic` had to move from `2.7.1` → `2.13.4` — `google-genai` requires
`>=2.12.5`, confirmed by actually running `pip install` and reading the
resolver's conflict output, not guessed. This is a dependency-version bump
only; no request/response model behavior changes for the existing calculator
endpoints (verified: the full app still imports and serves all existing
routes — see Testing).

## Frontend changes

New: `frontend/src/tutor/` (`tutorStore.js`, `contextBuilder.js`,
`retrieval.js`, `tutorApi.js`, `pageContextStore.js`,
`useTutorPageContext.js`), `frontend/src/components/tutor/` (`TutorPanel.jsx`,
`TutorMessage.jsx`, `SuggestedQuestions.jsx`), and
`frontend/src/components/ui/CollapsibleSection.jsx` (see cleanup-pass
section). `App.jsx` mounts `<TutorPanel />` once at the shell level (next to
`CommandPalette`) so it persists across route changes and shows on every page
except `/report` (print-focused — hidden via the existing `.no-print` class,
same mechanism the report page already uses elsewhere).

`api/client.js` gained optional `headers` support on `request()` — needed so
the tutor can send its anonymous client-id header. This is the only change to
shared infrastructure; every existing call site (`api.post(path, body)`) is
unaffected since the new parameter is optional (confirmed via a clean build).

**Context wiring for "current simulation/challenge/commissioning" state**:
projectStore/trainingStore cover selections and results, but a few pages have
meaningful state that only exists locally (which pushbuttons are held on
Control Circuit, which fault is loaded in Challenge Mode, which commissioning
step is active). Rather than have the context builder reach into every page's
internals, three pages (`ControlCircuit.jsx`, `ChallengeMode.jsx`,
`VirtualCommissioning.jsx`) now call `usePublishTutorContext(kind, summary)`
with a one-line plain-English description of their own live state — e.g.
Control Circuit publishes which pushbuttons/limits are active and which relay
(R1–R6, this app's actual labels) is energized. This is the mechanism behind
"why is this red" / "why didn't the relay energize" style questions actually
working — the tutor is told the real current state, not asked to guess.

One deliberate scope boundary: **Challenge Mode / Commissioning hints**. The
context sent to Gemini includes the fault's actual cause / the step's correct
assessment (needed so a "give me a hint" response can be genuinely
calibrated), with an explicit system-prompt instruction not to state it
outright unless asked directly or after a wrong attempt. This is a judgment
call, not a guarantee — Gemini is a general model, not a rule engine, so
there's no hard technical barrier stopping it from over-explaining if a
student phrases a request cleverly. Worth watching in real use.

## Rate limiting

Two identities checked per question, **in this order**: anonymous browser ID
first (the primary, user-facing "10/day" limit and the 15s cooldown), then IP
(a coarser backstop, default 60/day, no cooldown — a shared network
shouldn't throttle distinct students 15 seconds apart from each other). A
request is blocked if *either* is exhausted. Both are enforced atomically in
Postgres via a single `tutor_usage_try_consume()` function
(`backend/supabase/schema.sql`) that row-locks (`for update`) so two
near-simultaneous requests from the same identity can't both slip through as
the "10th" question — verified this isn't just a comment: it's why the check
is one round-trip stored-procedure call, not a Python read-then-write.

One accepted tradeoff, stated plainly rather than hidden: the anon-id counter
increments *before* the IP check runs, so in the rare case a shared IP is
already at its own cap, that student's anon-id count still ticked up for a
request that never reached Gemini. Given IP limits are set well above normal
per-student usage, this should be a rare edge case, not a everyday cost.

Every call to `/ask` consumes a slot — including ones the injection guard
refuses — deliberately (an earlier draft had this backwards; caught by the
automated rate-limit test below, not left in). Otherwise someone could hammer
the endpoint for free forever by phrasing every request as an obvious
jailbreak attempt, since that path never reaches Gemini.

## Caching

Only for questions the system judges **definitional** — glossary-style
lookups like "What is KM1?" — never for anything referencing the student's
own live numbers, since serving someone else's cached calculation-specific
answer would just be wrong. `domain_guard.is_definitional()` matches a small
set of question shapes (`what is`, `define`, `why <bare noun phrase>`, etc.)
and explicitly excludes anything containing deictic/event words ("this",
"my", "didn't", "tripped", "red", …). This is deliberately conservative —
false negatives (an eligible question not cached) just cost one extra Gemini
call; false positives (a context-specific question served a generic cached
answer) would be a real correctness bug. Verified against every example
question in the brief itself (`What is KM1?`, `What is AC-3?`, `Why overload
relay?`, `What is MPCB?`, `What is NO contact?` all cache-eligible; `Why is
this result red?`, `Why didn't KM2 energize?`, `Give me a hint` all correctly
excluded) — see Testing.

## Domain restriction & misuse prevention

Two layers, doing different jobs on purpose:

- **The system prompt** (`prompt_builder.py`) is the primary domain boundary
  — it's far better than any keyword list at judging "is this actually about
  crane panels" with nuance, and is what handles a student asking about
  movies, politics, sports, or unrelated homework.
- **A narrow regex guard** (`domain_guard.looks_like_injection`) runs first,
  before any rate-limit/Gemini cost, and only catches obvious jailbreak
  phrasing ("ignore previous instructions", "pretend you are ChatGPT", "act
  as DAN", etc.) — deliberately *not* a general off-topic blocklist, since
  that would false-positive on legitimate engineering questions constantly.

## Handbook integration & navigation

`retrieval.js` always includes whatever handbook topics are already tagged to
the current page (`workspaceIndex.getRelatedTopics`), so even a vague "explain
this" stays grounded, then fills remaining slots with keyword-matched topics
from anywhere else in the handbook. Gemini can suggest navigation (a specific
handbook topic, page, or calculator) via the structured `navigate_to` /
`navigate_label` fields, rendered as a button in `TutorMessage.jsx` that calls
`useNavigate()` — real navigation, not a suggestion the student has to act on
manually.

## UI

`TutorPanel.jsx` — a docked launcher pill (bottom-right, shows remaining
count) that expands into a panel matching the app's existing design language
exactly (`bg-surface`/`border-steel`/`bg-inset` tokens, the same
border-radius and shadow conventions as `CommandPalette`), not a generic chat
bubble. Suggested per-page questions use the brief's own worked examples
where the page matches (Control Circuit gets "Why didn't KM2 energize?" /
"Explain this interlock.", Challenge Mode gets "Give me a hint." / "Why is
this diagnosis wrong?", etc. — `SuggestedQuestions.jsx`).

## Testing

No live Gemini/Supabase credentials exist yet (that's on you to add), so
testing focused on everything that doesn't require them: a FastAPI
`TestClient` run against the real app, in-memory storage fallback active,
confirming — usage endpoint responds correctly; asking without a configured
Gemini key returns a clean `503` instead of crashing; the injection guard
fires and returns a refusal *without* reaching Gemini; a 500-character
question is rejected by Pydantic's `max_length`; the rate limiter's cooldown
and daily-limit paths both actually throttle (not just return 200 unconditionally
— an earlier version of this test caught exactly that bug, described above);
`is_definitional()` matches every example question in the brief correctly.
Full backend also `py_compile`s clean and the FastAPI app imports and serves
all 7 routes (5 existing calculator endpoints + 2 new tutor endpoints)
without error.

Frontend: `npm run build` succeeds clean (2,746 modules, no errors) and
`npm run lint` shows **zero new errors** — the 7 pre-existing lint errors in
`CommandPalette.jsx`, `MobileHeader.jsx`, `MiniControlCircuit.jsx`,
`ProjectDashboard.jsx`, and `trainingStore.js` were already there before this
pass (none of those files were touched) and are unrelated to this feature —
left alone per "don't touch verified logic" scope, flagged here rather than
silently fixed or silently ignored.

**Not tested, because it can't be from here**: an actual Gemini round trip,
and the real UI in a browser (no browser tooling in this environment). Please
do a real pass in a dev server before considering this done-done — the
structured-output parsing in particular (`gemini_client.py`'s `.parsed`
handling) is verified against the SDK's type signatures, not against a real
response.

## Setup required before this works

1. **Gemini**: get a key from https://aistudio.google.com/app/apikey, set
   `GEMINI_API_KEY` in Render's environment tab.
2. **Supabase**: create a project (or reuse one), then in the SQL Editor run
   `backend/supabase/schema.sql` once. Set `SUPABASE_URL` and
   `SUPABASE_SERVICE_KEY` (the **service_role** key, not anon/public — the
   backend needs to bypass RLS to write usage counters for anonymous
   visitors) in Render's environment tab.
3. Redeploy the backend so the new dependencies install.
4. No frontend env changes needed — `VITE_API_URL` already points at the
   same backend.

Full details, including every optional tuning env var
(`TUTOR_DAILY_LIMIT_PER_ANON`, `TUTOR_COOLDOWN_SECONDS`, etc.), are in
`backend/.env.example`.

## The site-wide cleanup pass — what actually happened

The brief's "make the entire website cleaner" section directly contradicts
its own opening line ("the engineering platform itself is considered feature
complete... do NOT redesign") — this was flagged before starting, and you
chose to include it anyway. Having now gone through the app page by page, the
honest finding is: **it's mostly already done.**

Every page archetype checked shows mature, already-built progressive
disclosure:
- **Calculators** (Load Calculator, Nameplate, Cable/Busbar, Star-Delta): six
  `FormulaExplainer` blocks per result, each collapsed by default with a
  four-tier reveal (Basic → Intermediate → Industrial → Expert), plus a
  Motor Comparison tab structure so three motors' worth of detail isn't all
  on screen simultaneously.
- **Engineering Handbook**: every topic is a collapsed `HandbookEntry`
  accordion (title only, until clicked) — not a wall of expanded text.
- **Fault Diagnosis**: cause/diagnosis/fix are gated behind explicit
  `RevealCard` clicks, one at a time, with the "Interview Insight" card only
  appearing after the fix is revealed.
- **Crane Selector**: the detail panel is compact stat tiles + short lists,
  nothing that reads as overwhelming.
- **Project Dashboard**: already a scannable stat-card grid, which is the
  correct pattern for a dashboard, not something to hide behind an accordion.
- **Home**: a clean nav-card grid, no dense content at all.
- A proxy check across the remaining pages (Panel Explorer, Power Circuit,
  BOM Generator, Panel Layout, Panel Simulator) found 4–12 existing uses of
  `FormulaExplainer`/reveal-on-demand/animated-disclosure patterns in every
  one of them.

This traces back to a prior session's redesign work (code comments reference
a "Phase 4/5 redesign" and tiered `FormulaExplainer` rollout) that the V3
brief was evidently written without full visibility into.

**What this delivery adds rather than duplicates**: a new
`CollapsibleSection.jsx` primitive (same visual language as
`FormulaExplainer`/`HandbookEntry` — `border-steel`/`bg-inset`/`ChevronDown`)
for wrapping secondary content generically, not just formula breakdowns. It's
available now for the tutor's own future growth or any new page, rather than
being forced onto existing pages that don't need it — over-collapsing content
that's fine to show is its own usability mistake, not a neutral "more
thorough" outcome.

If there's a **specific** page or screen that still feels cluttered in
practice (screenshots help), that's a much more useful starting point than a
blind pass across all 18 pages — happy to take a real, targeted look at
whatever that is.

## Remaining limitations

- Live Gemini/Supabase behavior is unverified — see Testing.
- No admin visibility into tutor usage/cache yet (no dashboard) — `tutor_cache`
  and `tutor_usage` are plain Supabase tables, queryable directly from the
  Supabase dashboard if you want to eyeball hit rates or abuse patterns.
- The anon-id rate limit is trivially reset by clearing browser storage or
  using a private window — accepted going in, given there's no login system
  to build a real per-account limit on top of.
- Challenge Mode / Commissioning hint restraint relies on prompt instructions,
  not a hard technical gate — see the "Backend changes" section above.
