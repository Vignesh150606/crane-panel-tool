# Demo Guide

A suggested walkthrough for a 5-10 minute live demo — to a professor, a
placement interviewer, or anyone evaluating this as a portfolio piece.
Screenshots for each step are in `docs/screenshots/`.

## 1. Open with the problem (30s)
Home page (`01-home.png`). One line: "Design and validate an EOT crane
control panel end to end — motor sizing through commissioning — with the
engineering reasoning behind every value, not just a black-box calculator."

## 2. Pick a crane, run a real calculation (90s)
Crane Selector (`02-crane-selector.png`) → Load Calculator, hit Calculate
with the defaults (`03-load-calculator.png`). Point out:
- Real computed HP/kW/FLC per motor (hoist/LT/CT), not placeholder numbers.
- The "Adequately sized, tight margins" banner — margin classification is
  computed, not decorative (see `docs/ENGINEERING_ASSUMPTIONS.md`).
- Click into a `FormulaExplainer` tier — this is where "show your work"
  lives; four levels from a one-line answer to the full IEC-referenced
  derivation.

## 3. Show the live circuit, not just numbers (60s)
Control Circuit (`07-control-circuit.png`). Press and hold a pushbutton —
this is a real relay interlock simulation (`frontend/src/lib/relayLogic.js`),
not an animation. Good line: "This is the same decision logic a real
forward/reverse interlock uses — if you press both directions, the second
one is correctly refused, not just visually blocked."

## 4. The Engineering Tutor (90s) — the differentiator
Open the tutor panel from wherever you are (`18-engineering-tutor.png`,
`20-mobile-drawer.png` for the mobile view). Ask something contextual —
"Why didn't KM2 energize?" on Control Circuit, or "Why was this motor
selected?" on Load Calculator. Key points to make while it answers:
- It already knows the page, the calculation, and the live circuit state —
  the student never re-explains context (see the sequence diagram in
  `docs/ARCHITECTURE.md`).
- It's grounded in the app's own Handbook content first, not a generic
  chatbot wrapper — ask it something covered in the Handbook and it'll
  visibly reference it.
- Try an off-topic question ("what's the weather") to show the domain
  restriction refusing gracefully rather than just answering anything.

## 5. Training modules (60s)
Challenge Mode (`15-challenge-mode.png`) or Virtual Commissioning
(`16-commissioning.png`) — this is deliberately not just calculators; it's
scenario-based fault diagnosis with scored attempts, aimed at viva/interview
prep as much as design work.

## 6. Close on the dashboard + report (30s)
Project Dashboard (`10-project-dashboard.png`) shows workflow completion at
a glance; Project Report (`11-project-report.png`) is the printable
deliverable a real design review would actually want.

## If asked "what would you change with more time"
Have `docs/LIMITATIONS.md` and `docs/ROADMAP.md` open — answering this well
is itself part of the demo. See also `docs/INTERVIEW_PREP.md` for the
likely follow-up questions on engineering decisions and architecture.

## If the backend is asleep (first request of the demo)
Render's free tier spins down when idle — the first request can take
30-50s. Load the app and click through Home/Handbook (no backend needed)
while it wakes up, or open it 2 minutes before the demo starts.
