// The single interlock decision function for a reversing (FWD/REV) motion
// branch — extracted from ControlCircuit.jsx so it has exactly one
// implementation instead of being re-derived for the new training modules.
// Challenge Mode and Virtual Commissioning both need the SAME relay behavior
// ControlCircuit.jsx already models (so a "diagnose the fault" scenario is
// testing the real interlock logic, not a simplified stand-in for it) — this
// is that shared implementation. ControlCircuit.jsx imports this too, so
// there is exactly one place this logic can drift from the engineering
// behind it.
//
// Given the NEXT value of whichever input just changed (plus everything
// else as it currently stands) and which direction currently holds the
// interlock claim, decides which direction should hold it next. Pure — no
// side effects, no React state — so it's trivially shareable and testable.
export function computeNextActive(next, prev) {
  const powerOk = !next.supplyLost && !next.eStop && !next.overload
  const fwdWantsRun = powerOk && next.pbFwd && !next.limitFwd
  const revWantsRun = powerOk && next.pbRev && !next.limitRev
  if (prev === 'FWD') return fwdWantsRun ? 'FWD' : (revWantsRun ? 'REV' : null)
  if (prev === 'REV') return revWantsRun ? 'REV' : (fwdWantsRun ? 'FWD' : null)
  if (fwdWantsRun && revWantsRun) return 'FWD' // simultaneous claim: deterministic tie-break for the UI
  if (fwdWantsRun) return 'FWD'
  if (revWantsRun) return 'REV'
  return null
}
