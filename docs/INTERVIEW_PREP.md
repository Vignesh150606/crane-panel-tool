# Interview & Viva Preparation

This project sits at the intersection of two evaluations — an EEE viva
(does the candidate actually understand crane panel design) and a software
interview (can the candidate build and reason about a real system). This
doc prepares for both.

## How to describe this project in 30 seconds

"A full-stack tool that takes an EOT crane's load and speed requirements
through motor sizing, protection device selection, cable/busbar sizing, and
BOM generation — with every result traceable to an IS/IEC standard, not a
black box. I added an AI tutor on top that's context-aware of whatever
page or calculation you're looking at, and did a full audit/documentation
pass to bring it to a releasable v1.0."

## Engineering decisions worth being able to defend

**Why 2.0× FLC for contactor sizing, not the more common 1.25×?**
IEC 60947-4-1 AC-3 defines a range: 1.25× for standard duty, 1.5× for
heavy-duty frequent starting, 2.0× as the ceiling for "severe applications
demanding rapid reverse plugging, inching, or jogging" — which is exactly
what crane hoist/travel motion is. A prior version of this tool used 3.0×
with no cited source; corrected during an audit (see `REDESIGN_NOTES.md`)
once no standard could be found to support going above the documented
severe-duty ceiling. Good answer to "how do you know your numbers are
right": traced every constant back to a standard, and fixed the one that
didn't have one.

**Why look up efficiency per-kW instead of using a flat 85%?**
A 0.75kW motor is genuinely less efficient than a 90kW motor at the same
IE class (see the `IE_EFFICIENCY_TABLE` in
`backend/app/data/standards.py`, sourced from IEC 60034-30-1 via an ABB
technical note). A flat number systematically under-sizes FLC (and
therefore every downstream component) for small motors specifically. Also
worth knowing: an earlier bug applied efficiency twice — once deriving
required HP from the load, again computing FLC from that HP — inflating
FLC by roughly 27% before it was caught and fixed.

**Why is Load Calculator's Long Travel/Cross Travel HP derived from a
fraction of the hook load (`lt_load_factor`/`ct_load_factor`) rather than
computed from crane self-weight directly?** Because crane self-weight
varies by construction and isn't something the tool asks for — the load
factor is a documented approximation (10% for LT, 5% for CT, both
overridable), not a first-principles calculation. Know the difference
between what's derived and what's an assumption — this project tries to be
explicit about which is which (see `docs/ENGINEERING_ASSUMPTIONS.md`).

**Why Supabase for the tutor instead of just using the existing backend
process memory?** Render's free tier spins down when idle, wiping in-memory
state. A "10 questions per day" limit that silently resets every 15 minutes
of inactivity isn't actually a daily limit. This is a good example of a
constraint (free hosting) driving an architecture decision (need external
persistence) rather than the reverse.

## Software architecture worth being able to defend

**Why Zustand instead of Redux/Context?** Flat, per-domain stores
(`projectStore`, `trainingStore`, etc.) with built-in `persist` middleware
for localStorage sync — far less boilerplate than Redux for an app that
doesn't need time-travel debugging or complex middleware chains, and no
Context provider nesting/re-render concerns.

**Why does the frontend own all state instead of the backend?** The
backend has no reason to know "your project" — every calculation is a pure
function of its inputs. Putting persistence in the browser means zero
backend database cost/complexity for 95% of the app's functionality; the
one place that genuinely needs server-side memory (the tutor's rate limits)
is the one place that got a database.

**Why does handbook retrieval for the tutor happen client-side, not on the
backend?** `handbookContent.js` is already the single source of truth for
the app's engineering content (rendered directly by the Handbook page).
Duplicating it in Python for backend-side search would mean two copies to
keep in sync for no real benefit — the frontend can search its own
in-memory data just as well and send the top matches up as context.

**Why the `react-hooks/set-state-in-effect` refactors?** (See
`docs/DEVELOPER_GUIDE.md` for the pattern.) `useEffect` that only exists to
call `setState` in response to a changed prop causes an extra render pass
— the component renders once with stale derived state, the effect fires,
then a second render shows the correct value. For something like a relay
interlock simulation, that's a real one-frame-late bug, not just a lint
nitpick. The fix (compare against a "previous value" tracked in state,
conditionally setState during render) is React's own documented pattern
for this exact case.

## Formula derivations (know these cold)

- **Full-load current**: `I = P / (√3 × V × PF × η)` for a 3-phase motor,
  where P is rated output power, V is line voltage, PF is power factor, η
  is efficiency. The √3 exists because line-to-line voltages in a 3-phase
  system are 120° apart, not additive.
- **DOL starting current**: typically 6× FLC for a cage motor — this is why
  star-delta exists for motors above ~5HP (IS 13947 practice).
- **Star-delta current/torque reduction**: connecting windings in star
  during start divides both line current AND starting torque by 3 compared
  to DOL — the torque reduction is the part people forget, and it's why
  star-delta is unsuitable for high-inertia or high-friction starts.
- **Voltage drop**: `Vdrop = √3 × I × R × L` (3-phase), where R is cable
  resistance per unit length and L is one-way length — the same √3-omission
  mistake as FLC calculation is a common error here too.

## Technology choices, if asked "why this stack"

React+Vite (fast dev loop, no SSR needed for a tool), FastAPI+Pydantic
(free request validation from type hints), Zustand (minimal boilerplate for
flat domain stores), Tailwind v4 + CSS custom properties (one-file design
token changes), Gemini via `google-genai` (current official SDK, structured
JSON output support), Supabase (hosted Postgres with a generous free tier
and a SQL function for atomic rate-limit checks — see
`backend/supabase/schema.sql`). Full table in `docs/ARCHITECTURE.md`.

## Likely interview questions

- "Walk me through what happens when I click Calculate." → See the
  sequence diagram in `docs/ARCHITECTURE.md`.
- "How would you add authentication?" → See `docs/ROADMAP.md`'s Accounts
  section — the honest answer includes what it would unlock (real
  per-account tutor limits, cross-device sync) and what's genuinely simple
  vs. genuinely more work (migrating localStorage-based projects).
- "What happens if two requests hit the rate limiter at the same time?" →
  The Supabase stored procedure row-locks (`for update`) so concurrent
  requests from the same identity can't both slip through — see
  `V3_ENGINEERING_TUTOR.md`'s Rate limiting section.
- "How do you know the AI tutor won't just answer anything?" → Two layers:
  a system prompt with an explicit domain boundary (the primary mechanism,
  since it can judge nuance), plus a narrow regex guard for obvious
  jailbreak phrasing that runs before any API cost is spent. See
  `V3_ENGINEERING_TUTOR.md`'s "Domain restriction & misuse prevention".
- "What's the biggest weakness in this project?" → Have a real answer, not
  a humblebrag. Good options from `docs/LIMITATIONS.md`: no accounts (the
  anon-ID rate limit is trivially resettable), no committed E2E test suite,
  motor efficiency uses continuous-duty figures for what's usually
  intermittent-duty motors.

## Likely viva questions (pure engineering)

- Derive FLC from rated HP, voltage, PF, and efficiency.
- Why does a crane hoist motor need a higher contactor duty rating than a
  general-purpose motor circuit?
- What's the difference between an MCCB, an MPCB, and a plain MCB, and
  why does this tool use MPCB?
- Why is voltage drop a bigger concern on long travel spans specifically?
- What would happen if the star-delta transition timer were set too short?
  Too long?
- Why does IS mandate IE3 minimum efficiency, and what's the tradeoff
  against IE2 (cost vs. running efficiency)?

## Potential weaknesses (own these, don't hide them)

See `docs/LIMITATIONS.md` for the full list. If pressed for the single
most important one: **no formal safety/liability framing** — this is
explicitly a learning/preliminary-sizing tool, and that boundary needs to
stay clear if this is ever positioned as more than that.

## Future improvements

See `docs/ROADMAP.md`.
