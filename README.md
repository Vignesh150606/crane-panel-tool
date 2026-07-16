# Crane Panel Design Tool

A full-stack engineering application for designing EOT (Electric Overhead Traveling) crane
control panels — motor sizing, cable/busbar selection, circuit design, panel layout, BOM
generation and a printable project report, with every calculation backed by a formula
explanation, worked example, IS/IEC standard reference and objective engineering status.
Also includes an AI Engineering Tutor (context-aware of whatever page/calculation you're
looking at, grounded in the app's own Handbook — see `V3_ENGINEERING_TUTOR.md`) and three
scenario-based training modules: Panel Explorer, Challenge Mode, and Virtual Commissioning
(see `TRAINING_PLATFORM_NOTES.md`).

Full documentation set — architecture, API reference, deployment, engineering assumptions,
limitations, roadmap, developer guide, demo guide, interview prep — is in `docs/`.

Live: Frontend on Vercel, API on Render (see **Deployment** below for reconnecting them
after this update).

---

## Architecture

```
frontend/   React 19 + Vite + Tailwind v4 + Zustand + Framer Motion
backend/    FastAPI — the single source of truth for every engineering calculation
            + Gemini (Engineering Tutor) + Supabase (tutor rate limits/cache)
```

**Every calculation happens on the backend.** The frontend never re-implements a formula —
it calls one of five calculation endpoints and renders whatever comes back (numbers, the
objective "engineering status", and the full explanation object). This was the biggest
structural change from the previous version, where the backend existed but was never
actually called; all sizing logic was duplicated in frontend JS. See
`backend/app/engineering.py` for the formulas, `backend/app/explain.py` for the
explanations, and `backend/app/status.py` for the margin/compliance logic.

```
POST /api/motor          Motor HP, FLC, contactor/MPCB/cable/overload sizing (all 3 motions)
POST /api/nameplate       Same sizing, starting from known nameplate values
POST /api/star-delta      DOL vs star-delta current/torque comparison
POST /api/cable-busbar    Cable sizing, voltage drop, busbar-vs-stretch-wire recommendation
POST /api/bom             Full bill of materials

POST /api/tutor/ask       Engineering Tutor — context-aware Q&A (added in V3)
GET  /api/tutor/usage     Remaining daily tutor questions for the caller
```

Full request/response shapes for every endpoint are in `docs/API.md`.

**Shared project state** (`frontend/src/store/projectStore.js`, Zustand + localStorage)
lets data flow forward through the workflow — e.g. Load Calculator results prefill the BOM
Generator — without making any page depend on it. Every page falls back to sensible defaults
if the store is empty (fresh visit, direct link, private browsing), so nothing breaks if a
step is skipped or opened standalone.

**Pages that don't call the backend** (Crane Selector, Control/Power Circuit, Panel
Simulator, Panel Layout, Fault Diagnosis, Project Dashboard, Panel Explorer, Challenge Mode,
Virtual Commissioning) are interactive simulators, training modules, and reference content,
not numeric calculators — there's no formula to centralize, so they stay client-side. Full
per-page breakdown in `docs/FOLDER_STRUCTURE.md`.

**PDF export** uses the browser's native print-to-PDF (`window.print()`) against a dedicated
print stylesheet (`index.css` → `@media print`), rather than a client-side PDF-rendering
library — more reliable output, real selectable text, and no extra dependency weight.

---

## Local development

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs at `http://localhost:8000/docs`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173` and talks to `http://localhost:8000` by default (see
`frontend/src/api/client.js`) — no `.env` needed for local dev.

---

## Environment variables

| Where | Variable | Value |
|---|---|---|
| Vercel (frontend) | `VITE_API_URL` | Your Render backend URL, e.g. `https://crane-panel-api.onrender.com` |
| Render (backend) | `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://crane-panel-tool.vercel.app` (comma-separate multiple) |
| Render (backend) | `GEMINI_API_KEY`, `GEMINI_MODEL` | Powers the Engineering Tutor — see `docs/DEPLOYMENT.md` |
| Render (backend) | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Tutor rate-limit/cache persistence — see `docs/DEPLOYMENT.md` |

Full deployment walkthrough (including the one-time Supabase schema setup)
is in `docs/DEPLOYMENT.md`. The rest of this section covers the calculator
backend specifically, which needs only the first two variables above.

Without `VITE_API_URL` set, the deployed frontend will try to reach `localhost:8000` and every
calculation will fail with a clear "could not reach the calculation server" message rather
than a silent crash — check this first if calculations don't work after deploying.

Without `ALLOWED_ORIGINS` set, the backend defaults to allowing all origins (`*`), which
works but is worth tightening once your Vercel URL is stable.

Render's free tier spins the backend down when idle — the first request after a period of
inactivity can take 30–50s to wake it up. The frontend's API client already accounts for
this with a 25s timeout and an explicit message instead of a generic error.

---

## Deployment

### Backend → Render
1. Root directory: `backend`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment: set `ALLOWED_ORIGINS` (see above)
5. Python version comes from `backend/runtime.txt`

### Frontend → Vercel
1. Root directory: `frontend`
2. Framework preset: Vite (auto-detected)
3. Build command: `npm run build`, output directory: `dist`
4. Environment: set `VITE_API_URL` (see above)

After changing either environment variable, redeploy that service for it to take effect.

---

## Testing

```bash
cd frontend
npm run lint              # ESLint — should report zero problems
npm run build              # production build — should complete with no errors
node ssr-smoke-test.mjs    # renders every page with an empty project store and
                            # fails loudly if any page throws on a fresh/standalone visit
```

The backend has no separate test suite yet — `backend/app/engineering.py` is pure functions
with no I/O, so it's straightforward to add `pytest` coverage for it directly if you want to
extend this (each function takes plain numbers and returns a plain number).

---

## Engineering audit log

This project has gone through several rounds of engineering + code review. Rather than
a single "trust me" claim of correctness, here's what was actually checked and changed,
so a reviewer (or you, six months from now) can see the trail:

- **FLC calculation** — removed a double efficiency-derating bug that inflated full-load
  current by ~27%.
- **Contactor sizing** — corrected from an uncited 3× FLC multiplier to 2×, based on AC-3
  severe-duty/reversing sizing practice (documented with reasoning in `standards.py`; no
  source was found to support 3×, including a duplicate copy of the constant that was
  quietly still using it in `craneData.js` — removed).
- **Motor efficiency** — IE2/IE3 selection added from an IEC 60034-30-1 lookup table with
  linear interpolation.
- **Control circuit** — hand-traced against 21 real operating scenarios (Forward, Reverse,
  E-Stop, overload trip + manual reset, limit switches, simultaneous button press, power
  failure, rapid presses, etc.). Found and fixed: overload reset not recomputing relay
  state after a fault cleared, and no way to simulate a main supply failure at all (both
  now fixed — see `ControlCircuit.jsx`). Full scenario-by-scenario writeup available on
  request; not checked into the repo as a doc file yet.
- **PanelSimulator** — its interlock was cosmetic (displayed NC-contact wiring, but
  clicking the opposing direction just switched over instead of being blocked). Fixed to
  match real relay-logic behaviour.
- **Accessibility** — the two interactive SVG diagrams (control circuit push buttons,
  power circuit component explorer) were mouse-only; added keyboard focus, `role="button"`,
  and Enter/Space activation.
- **Performance** — route-level code splitting (`React.lazy`) cut the single ~508kB JS
  bundle down to per-page chunks (largest is ~25kB); this was a direct fix for the
  "chunk >500kB" build warning, not a speculative optimization.

**v1.0 productization pass** (see `V1.0_PRODUCTIZATION_REPORT.md` for full detail):
- `MiniControlCircuit.jsx` (shared by Challenge Mode and Virtual Commissioning) had the
  same class of bug the audit log above already found and fixed once in `ControlCircuit.jsx`
  — deriving relay state via `useEffect` meant a one-render lag on every prop change, not
  just a lint nitpick. Fixed using React's documented render-time state-adjustment pattern;
  same fix applied to two more instances in `CommandPalette.jsx` and `MobileHeader.jsx`.
  Frontend lint is now zero errors/warnings project-wide.
- `frontend/ssr-smoke-test.mjs` only covered the 14 pages that existed when it was written —
  the 4 pages added in the V2 training platform update were never added. Extended to cover
  all 18; all pass.
- This README itself was stale in three places (a `Navbar.jsx` reference to a component
  deleted in the redesign, a "five endpoints" count missing the two tutor endpoints added in
  V3, no mention of the Tutor or training modules in the opening description) — fixed here.
- No `.gitignore` existed at the repo root — added one (`node_modules`, `dist`,
  `__pycache__`, `.env`).

**Known limitations, stated plainly rather than glossed over:**
- `PanelLayout.jsx`'s clearance figures (100mm/75mm) are disclosed on-page as
  panel-builder practice, not a specific IEC 61439-6 clause — nobody has been able to
  verify these against the actual (paywalled) standard text yet.
- No automated test suite exists yet for `engineering.py`, despite it being the single
  highest-value place to have one.
- The tier system (Basic → Intermediate → Industrial → Expert) is fully built and used
  consistently on the pages that have `FormulaExplainer` content, but not every page has
  been rewritten to the same educational depth yet.
- A full accessibility pass (contrast audit, screen-reader labeling beyond the two fixes
  above) hasn't been done — only the two mouse-only controls found so far were fixed.

Full current limitations list (including the V3 Engineering Tutor's, which weren't relevant
when this section was first written) is kept in `docs/LIMITATIONS.md` going forward, so
there's one place to check rather than two lists drifting apart.

---

## Pushing this update to Git

From the project root, with your existing remote already configured:

```bash
git add -A
git commit -m "Full-stack rebuild: backend-driven calculations, formula explanations, engineering status, workflow state, redesigned UI"
git push origin main    # replace 'main' if your default branch has a different name
```

Vercel and Render will pick up the push automatically if they're already connected to this
repo (both redeploy on push to the tracked branch by default).

---

## Project structure

```
backend/app/
  main.py            FastAPI app, CORS, routers
  config.py           ALLOWED_ORIGINS from env
  models.py           Pydantic request validation (engineering-plausible bounds)
  engineering.py       Pure calculation functions — the actual formulas
  explain.py           Builds the formula/reasoning/standard/mistakes payload
  status.py            Builds the safety-margin / sizing-status / compliance payload
  data/standards.py    All constants, ratings tables, IS/IEC references — single source of truth
  routers/             calculations.py, cable.py, bom.py, tutor.py
  tutor/               Engineering Tutor backend — Gemini integration, Supabase-backed
                       rate limiting/cache, prompt building (see docs/ARCHITECTURE.md)

frontend/src/
  api/                 fetch client + typed endpoint wrappers
  store/                Zustand project state (persisted, with safe fallbacks)
  components/ui/        Shared design-system components (Button, Card, FormulaExplainer,
                         EngineeringStatus, Toast, CollapsibleSection, etc.)
  components/layout/     Sidebar, MobileHeader, SidebarContent, CommandPalette,
                         ContextPanel, WorkflowStepper, ProjectStatusBar, Breadcrumb,
                         PageTransition
  components/tutor/      TutorPanel, TutorMessage, SuggestedQuestions
  components/training/   MiniControlCircuit, InspectionPanel (shared by Challenge Mode
                         and Virtual Commissioning)
  tutor/                 Engineering Tutor client logic — context building, handbook
                         retrieval, the tutor API client (see docs/ARCHITECTURE.md)
  pages/                 One file per route (18 pages — see docs/FOLDER_STRUCTURE.md)
  lib/validate.js       Client-side validation mirroring the backend's bounds
```

Full annotated structure, including what every page/module does, is in
`docs/FOLDER_STRUCTURE.md`. The complete documentation set — architecture,
API reference, deployment, engineering assumptions, limitations, roadmap,
developer guide, demo guide, interview prep — is in `docs/`.
