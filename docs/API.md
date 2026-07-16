# API Reference

Base URL: your Render deployment (e.g. `https://your-app.onrender.com`).
All endpoints are `Content-Type: application/json`. There is no
authentication on the calculation endpoints — they're pure, stateless
functions with no per-user data. The tutor endpoints identify callers by an
anonymous client ID header (see below), not a login.

Every calculation request field has an engineering-plausible bound (defined
in `backend/app/data/standards.py`) — out-of-range values return `422` with
a clear message rather than silently producing nonsense output.

## Calculation endpoints

### `POST /api/motor`
Sizes the hoist/long-travel/cross-travel motors from crane parameters.

Request (`MotorCalcRequest`):
| Field | Type | Notes |
|---|---|---|
| `load_tons` | float, required | Load to lift/move, tonnes |
| `hoist_speed`, `lt_speed`, `ct_speed` | float, required | m/min |
| `lt_load_factor` | float, default `0.1` | Fraction of hook load the LT motor must move (crane self-weight share) |
| `ct_load_factor` | float, default `0.05` | Fraction of hook load the CT motor must move (crab self-weight share) |
| `voltage`, `power_factor` | float, optional | Defaults from `standards.py` if omitted |
| `ie_class` | `"IE2"` \| `"IE3"`, optional | IEC 60034-30-1 efficiency class — looked up per-motor from its rated kW, not a flat number. Defaults to IE3 (India-mandated minimum since 2023) |
| `efficiency` | float, optional | Manual override, takes priority over `ie_class` |
| `hoist_hp_override`, `lt_hp_override`, `ct_hp_override` | float, optional | Skip the mechanical HP calc and specify HP directly |

Response: `{ motors: { hoist, lt, ct }, assumptions }`, where each of
`hoist`/`lt`/`ct` is `{ label, hp, kw, flc, efficiency_pct,
efficiency_source, contactor_rating, mpcb_rating, overload_setting,
cable_size, star_delta_required }`.

### `POST /api/nameplate`
Given known motor nameplate values (voltage, current, RPM, HP or kW),
returns the same protection-device sizing as `/api/motor` for a single
motor entered directly rather than derived from load/speed.

### `POST /api/cable-busbar`
Request: `{ flc, length, travel_length, voltage? }`. Returns cable size,
voltage drop, and a stretch-wire vs. busbar recommendation.

### `POST /api/star-delta`
Request: `{ hp, timer_seconds?, voltage?, power_factor?, ie_class?,
efficiency? }`. Returns DOL vs. star inrush current comparison and whether
star-delta starting is required for the given motor size.

### `POST /api/bom`
Request: `BOMMotorSet` — `{ hoist_hp, lt_hp, ct_hp, travel_length, voltage?,
power_factor?, ie_class?, efficiency? }`. Returns a full bill of materials
(`items: [{ slNo, component, spec, qty, unit, purpose }, …]`) derived from
the same sizing logic as the other endpoints.

### `GET /health`
`{ "healthy": true }` — used by the frontend's wake-up-the-free-tier-backend
retry logic, and by uptime monitoring if you add any.

## Engineering Tutor endpoints (added in V3)

Both require an `X-Tutor-Client-Id` header — a UUID the frontend generates
once per browser and persists in `localStorage`. This is the primary
identity the daily question limit is counted against (see
`V3_ENGINEERING_TUTOR.md` for the full rate-limiting design, including the
IP-based backstop that doesn't need a header).

### `POST /api/tutor/ask`
Request (`TutorRequest`):
```json
{
  "question": "Why was this motor selected?",
  "context": {
    "page_path": "/calculator",
    "page_label": "Load Calculator",
    "motor_summary": "Hoist 5.5HP, FLC 8.4A, contactor 12A, MPCB 16A...",
    "handbook_excerpts": [ { "id": "...", "title": "...", "equation": "...", "meaning": "..." } ]
  },
  "history": [ { "role": "user", "content": "..." } ]
}
```
`question` is capped at 300 characters (`422` if exceeded). `context` is
built entirely client-side from the current route + Zustand stores — see
`frontend/src/tutor/contextBuilder.js`. Full field list in
`backend/app/tutor/models.py::TutorContext`.

Response (`TutorResponse`):
```json
{
  "answer": "...",
  "cached": false,
  "refused": false,
  "navigation": { "to": "/handbook#overload-relay", "label": "Open Handbook: Overload Relay" },
  "remaining_today": 7,
  "daily_limit": 10
}
```

Errors: `400` (empty/too-long question), `429` (cooldown or daily limit —
message says which), `503` (Gemini not configured — no `GEMINI_API_KEY`),
`502` (Gemini request failed).

### `GET /api/tutor/usage`
Returns `{ remaining_today, daily_limit, cooldown_seconds }` for the calling
identity, without consuming a question. Used to populate the "7/10
questions remaining" display before the student asks anything.

## CORS

`ALLOWED_ORIGINS` env var, comma-separated. Defaults to `*` — fine for
development, set explicitly to your Vercel URL(s) in production (see
`docs/DEPLOYMENT.md`).
