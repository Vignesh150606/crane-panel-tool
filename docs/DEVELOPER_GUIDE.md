# Developer Guide

For local setup, see `docs/DEPLOYMENT.md`'s "Local development" section.
This doc covers conventions and how to extend the app.

## Testing commands

```bash
# Frontend
cd frontend
npm run build            # production build — catches syntax/import errors
npm run lint              # eslint — should be zero errors/warnings
node ssr-smoke-test.mjs   # renders all 18 pages server-side with an empty
                           # store, fails loudly on any throw. Add new pages
                           # to the PAGES array at the top of the file.

# Backend
cd backend
python -m py_compile $(find app -name "*.py")   # syntax check
python -m pytest                                  # if/when a formal test
                                                    # suite is added — see
                                                    # docs/ROADMAP.md
```

There's no CI configured yet — run these manually before pushing. A good
first roadmap item if you want one (see `docs/ROADMAP.md`).

## Conventions

**State**: Zustand stores in `frontend/src/store/`, one per domain
(`projectStore` = the design itself, `trainingStore` = practice progress,
kept deliberately separate — see the comment at the top of
`trainingStore.js`). Persisted stores use the `persist` middleware with an
explicit `name` (the localStorage key) — don't reuse a key across stores.

**Adjusting state from props/route changes**: this project's ESLint config
enforces `react-hooks/set-state-in-effect` and `react-hooks/refs` —
`useEffect` calling `setState` to derive state from a changed prop is
flagged, and reading `ref.current` during render is flagged too. The
correct pattern (used in `MobileHeader.jsx`, `CommandPalette.jsx`,
`MiniControlCircuit.jsx` — all fixed in this pass) is to track the previous
value in a second `useState`, compare during render, and conditionally call
`setState` directly in the render body:
```js
const [prevX, setPrevX] = useState(x)
if (x !== prevX) {
  setPrevX(x)
  setDerivedThing(computeFrom(x))
}
```
This is React's own documented pattern for this case, not a project-
specific convention — see the "Adjusting state when a prop changes"
section of the React docs if unfamiliar. Reserve actual `useEffect` for
genuine external-system synchronization (DOM focus, subscriptions, timers,
the `document.body.style.overflow` scroll lock in `MobileHeader.jsx`).

**Engineering logic**: lives ONLY in `backend/app/engineering.py` +
`backend/app/data/standards.py`. The frontend never recomputes an
engineering value — it only sends inputs and renders whatever the backend
returns. If you're tempted to duplicate a formula in a `.jsx` file, don't;
add a field to the relevant Pydantic response model instead.

**Design tokens**: colors/spacing come from CSS custom properties in
`frontend/src/index.css` (`--color-*`). Don't hardcode hex colors in
components — use the Tailwind classes that map to these tokens (`bg-surface`,
`text-copper`, `border-steel`, etc.) so a future palette change is a
one-file edit.

**Progressive disclosure**: for any new secondary/reference content, reach
for `components/ui/CollapsibleSection.jsx` (generic) or follow
`FormulaExplainer.jsx`'s tiered pattern (if it's specifically a
formula/calculation breakdown) rather than inventing a new disclosure
widget — see `docs/ARCHITECTURE.md`'s design system section for why this
matters.

## Adding a new calculator page

1. Backend: add a Pydantic request/response model pair to
   `backend/app/models.py`, a pure calculation function to
   `backend/app/engineering.py`, a route in the relevant
   `backend/app/routers/*.py` (or a new router file + register it in
   `main.py`).
2. Frontend: add the page to `frontend/src/pages/`, a lazy import + route in
   `App.jsx`, a nav entry in `frontend/src/config/navigation.js`
   (`WORKFLOW_ITEMS` or `REFERENCE_ITEMS`), and a typed API wrapper in
   `frontend/src/api/calculations.js`.
3. Add the page to `frontend/ssr-smoke-test.mjs`'s `PAGES` array.
4. If the page has a meaningful "current state" the Engineering Tutor
   should know about beyond what's already in `projectStore`/`trainingStore`
   (e.g. a live simulation), call `usePublishTutorContext(kind, summary)`
   from it — see `frontend/src/tutor/useTutorPageContext.js` and how
   `ControlCircuit.jsx`/`ChallengeMode.jsx`/`VirtualCommissioning.jsx` use
   it.
5. If it introduces new engineering concepts, add a topic to
   `frontend/src/data/handbookContent.js` and tag it to the new page's path
   in `frontend/src/data/workspaceIndex.js`'s `PAGE_TOPICS` map — this is
   what makes both the Handbook's "related topics" panel and the tutor's
   handbook retrieval find it.

## Git

`.gitignore` was added in this pass (there wasn't one before — see
`V1.0_PRODUCTIZATION_REPORT.md`) covering `node_modules/`, `dist/`,
`__pycache__/`, and `.env`. If you're working from a clone that predates
this, run `git rm -r --cached frontend/node_modules` (etc.) once to stop
tracking anything that should have been ignored.
