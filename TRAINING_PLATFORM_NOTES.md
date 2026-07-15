# Version 2 — Industrial Crane Controls Training Platform

Three new modules on top of the existing, already-complete engineering tool (crane
selection through Load Calculator, Cable & Busbar, Control Circuit, Panel Layout, BOM,
Report, plus the Engineering Handbook and Dashboard from Phases 1–3). Nothing about the
existing workflow pages was redesigned — where they were touched at all, it was to add a
cross-link or to extract a shared function, never to restyle or restructure them.

Scope note, same as every previous phase: the brief's three modules, each genuinely
interactive with real scoring/state, plus integration across six existing pages, is a lot
of ground. Rather than three shallow stubs, each module got built to a real, working,
tested state, with the content breadth the brief asked for (12 panel components, 11 fault
scenarios covering the 10 named plus one bonus, 13 commissioning items) — and what's
deferred is written out honestly below, not left implicit.

## New modules

### 1. Interactive Panel Explorer (`/panel-explorer`)
A clickable panel diagram — 12 components (Incoming MCCB, MCB, SPP, Transformer, MPCB,
OLR, KM1/KM2/KM3, Push Buttons, Indicator Lamps, Terminal Blocks) laid out like a real
panel door, DIN-rail rows and cable glands included. Clicking a component shows its
function, typical rating, failure symptoms, maintenance tips, interview questions, and
direct links out to the Handbook topic, the calculator that actually sizes it (where one
exists), and the circuit page where it does something. A small green dot marks components
already viewed, with a completion nudge toward Challenge Mode once all 12 are explored.

### 2. Industrial Challenge Mode (`/challenge-mode`)
Scenario-based fault diagnosis, not a quiz — 11 fault scenarios (the 10 the brief named,
plus Auxiliary Contact Failure as an 11th) across three difficulty levels. Each scenario
gives a symptom report, then one of two interaction modes depending on what the fault
actually is:
- **Live circuit** — for faults that are genuinely part of the FWD/REV interlock this app
  already models (limit switch stuck, relay won't energize, interlock bypassed, E-Stop
  latched), the trainee operates the actual same interlock logic Control Circuit uses,
  with one fault injected, and has to press buttons and read the diagram to figure out
  what's wrong.
- **Field measurements** — for faults outside that model (single phasing, wrong phase
  sequence, brake failure, transformer sag under load, a failed indicator-lamp aux
  contact), the trainee clicks "test points" to reveal readings, the same
  find-the-open-point method Fault Diagnosis's own explainer already teaches.

Multiple-choice diagnosis with real distractors (each with its own rationale for why it's
wrong, not just "incorrect"). Hints cost 15 points each, wrong attempts cost 20; solving
without either is worth 100. Results persist per-scenario (solved/best score/hints used).

### 3. Virtual Commissioning (`/commissioning`)
A 13-item checklist in real commissioning order — incoming supply and phase sequence
first, then control logic, then each motion, then protection and safety devices last.
Three items (spread across different categories, not clustered) are deliberate traps: a
subtly wrong reading — reversed phase sequence, a limit switch that reads triggered with
nothing at the limit, a fault lamp wired the wrong colour — that the trainee has to
actually catch and assess as FAIL, not rubber-stamp as PASS. 10 points per correctly
assessed item (130 max), a completion screen naming exactly which traps were missed if
any were, and runs persist so the Dashboard can show a "last score."

## Integration points

- **Dashboard** — new "Training Progress" section: components explored, challenges solved,
  last commissioning score, each linking to its module. Kept visually and structurally
  separate from the engineering-workflow cards above it (different domain, different
  store — see Engineering assumptions).
- **Handbook** — a "Put it into practice" callout linking to all three modules, added
  below the page header without touching the existing scrollspy/topic-navigation
  internals. Every training module links back to specific Handbook topic anchors for the
  reverse direction.
- **Control Circuit** — header action linking to Challenge Mode ("Diagnose faults").
- **Power Circuit** — header actions linking to Panel Explorer and Challenge Mode.
- **Panel Layout** — header action linking to Panel Explorer.
- **Project Report** — a conditional "Training Readiness" section (components explored /
  challenges solved / last commissioning score) that only appears if the training modules
  were actually used — an untouched summary would be noise in a project deliverable for
  someone who never opened them.
- **Fault Diagnosis** (existing page) — refactored to import its five original fault
  entries from the new shared `data/faultLibrary.js` instead of a local copy, and now
  displays all 11 (the original 5 plus the 6 new ones added for Challenge Mode) since the
  content was already written to the same quality bar. Added a header link into Challenge
  Mode for anyone who wants the same scenarios live instead of reveal-by-reveal.

## Educational value

The organizing idea across all three modules is the same one Fault Diagnosis's diagnostic
explainer already teaches: **localize before you replace, test at the boundary between
working and not working**. Panel Explorer builds the component-level vocabulary first
(what does this device do, how does it fail). Challenge Mode puts that vocabulary to work
under uncertainty — nothing is labeled "the fault is here," the trainee has to operate a
live circuit or take measurements and reason to a conclusion, with wrong answers
explained rather than just marked wrong. Virtual Commissioning adds the discipline real
commissioning requires: verifying claims instead of assuming them, in the order that
actually matters (you don't test a motion before confirming the supply and phase sequence
feeding it), with traps specifically to catch rubber-stamping.

## Engineering assumptions

Worth stating plainly rather than leaving implicit:

- **The interlock decision logic is the one real thing being reused, not re-derived.**
  `lib/relayLogic.js` — extracted verbatim from Control Circuit's own transition function
  — is what both the new `MiniControlCircuit` component and the existing Control Circuit
  page run. A Challenge Mode scenario that "diagnoses" the interlock is testing the actual
  behavior, not a simplified stand-in for it.
- **Fault injection is new, deliberately narrow, and layered on top, not built into the
  shared function.** Real crane panels can't have a "burnt relay coil" as a normal state,
  so that behavior doesn't belong in `computeNextActive` itself — it's a small set of
  explicit, commented overrides in `MiniControlCircuit` (stuck limit switch, dead relay
  coil, failed auxiliary contact, bypassed interlock), applied on top of the same shared
  decision.
- **"Incoming MCCB" and "MCB" are two different real devices, not a renaming of one.**
  This app's own BOM logic (`backend/app/routers/bom.py`) sizes one shared incomer,
  called "Main MCB" there. Panel Explorer's "Incoming MCCB" IS that same device (larger
  panels commonly use an MCCB in that role) — its rating links back to the real
  calculator. "MCB" here is the separate, smaller breaker protecting the control
  transformer primary, a real device this app's calculators don't size, and the content
  says so rather than implying a number that doesn't exist.
- **"KM1/KM2/KM3" is shown as one designation per motion (Hoist/LT/CT), not per physical
  contactor.** Physically each is a Forward/Reverse pair under electrical interlock — the
  component detail says this explicitly rather than quietly picking a number.
- **Every rating in Panel Explorer is a typical reference range, not a recalculation.**
  Framed as "typical" throughout, the same way Panel Layout already frames its clearances.
  Where this app DOES calculate a real value for that component (contactor, MPCB,
  overload setting), the component links to that calculator instead of restating a
  number, so there's exactly one source for it.
- **Three commissioning traps and eleven fault scenarios are fixed, not randomized.** A
  randomized fault-injection system was considered and deliberately not built — determinism
  means a training run is reproducible and reviewable, which matters more here than replay
  variety.
- **Training progress lives in its own store (`trainingStore.js`), not `projectStore`.**
  Resetting a project (a real, destructive action already in the app) shouldn't
  accidentally wipe a learner's practice history, and the two are genuinely different
  kinds of data.

## Files modified

**New:**
`lib/relayLogic.js` · `components/training/MiniControlCircuit.jsx` ·
`components/training/InspectionPanel.jsx` · `data/panelComponents.js` ·
`data/faultLibrary.js` · `data/commissioningChecklist.js` · `store/trainingStore.js` ·
`pages/PanelExplorer.jsx` · `pages/ChallengeMode.jsx` · `pages/VirtualCommissioning.jsx`

**Refactored (behavior preserved, logic extracted/reused, not redesigned):**
`pages/ControlCircuit.jsx` (interlock function now imported, not locally defined) ·
`pages/FaultDiagnosis.jsx` (faults now imported from the shared library; page now shows
11 scenarios instead of 5, same reveal-card UI, unchanged)

**Extended (cross-links / integration only):**
`pages/PowerCircuit.jsx` · `pages/PanelLayout.jsx` · `pages/ProjectDashboard.jsx` ·
`pages/ProjectReport.jsx` · `pages/EngineeringHandbook.jsx` · `pages/Home.jsx` ·
`config/navigation.js` · `data/workspaceIndex.js` ·
`components/layout/SidebarContent.jsx` · `App.jsx` (3 new routes)

## Verified, not assumed

`npm run build` clean throughout — checked after the core extraction, again after all
three modules, again after full integration. Backend + frontend run locally; Playwright
swept all 18 routes (15 existing + 3 new) at the three required viewports for horizontal
overflow and console errors — none found. Beyond structural checks, the actual interactive
logic was functionally tested end-to-end: fault injection confirmed to correctly block the
right branch while leaving the other healthy (not just "renders without crashing"); a
correct diagnosis confirmed to score exactly 100 with no hints/wrong attempts; a hint
reveal confirmed to dock exactly 15 points; a full 13-item commissioning run confirmed to
reach the completion screen with the right score and correctly name a rubber-stamped trap
as missed. MiniControlCircuit was also specifically stress-tested (rapid button toggling)
for React state-update warnings, since its derived `activeDir` state needed a genuine fix
mid-build (see below) — none found after the fix.

One real bug caught and fixed during this build, worth naming rather than burying: the
first version of `MiniControlCircuit` computed its derived "active direction" during
render and called a callback to update it — a React anti-pattern (updating state from a
child during a parent's render pass) that happened to work in casual testing but would
have been fragile under different render timing. Rewritten to own that state internally
via `useEffect` before any page was built on top of it.

## Remaining / future ideas

- **Randomized commissioning traps** — currently fixed for determinism (see Engineering
  assumptions); a "randomize which 3 of a larger trap pool appear" mode would add replay
  value at the cost of reproducibility, worth considering as an opt-in rather than default.
- **Panel Explorer → BOM cross-link** — components could show "how many of these are on
  your current project" once a BOM has been generated, not just typical ratings.
  Straightforward addition, not built this pass to keep Panel Explorer a pure reference
  tool rather than starting to blend it with project-specific state.
- **Challenge Mode scenario authoring for Panel Explorer's remaining components** (SPP,
  transformer, terminal blocks, indicator lamps don't yet have a dedicated Challenge Mode
  scenario built around them specifically, though several existing scenarios touch them).
- **A fourth module the brief didn't ask for but the other three set up well**: a timed
  "full panel commission + first fault" combined scenario, chaining Virtual Commissioning
  into a Challenge Mode scenario on the just-commissioned panel — deferred as genuine new
  scope, not integration.
- **MiniControlCircuit as a real embed inside Control Circuit itself** — currently a
  fresh, visually-consistent component rather than the literal existing page component
  (see Engineering assumptions in Phase 3's equivalent note); revisiting that as a true
  shared-component refactor of Control Circuit's diagram, not just its logic, would remove
  the last bit of presentational (not logic) duplication between the two.
