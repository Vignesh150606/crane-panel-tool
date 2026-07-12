import { useState } from 'react'
import { CircuitBoard, Lightbulb, Palette, AlertOctagon, RotateCcw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import FormulaExplainer from '../components/ui/FormulaExplainer'

const MOTIONS = {
  LT: { label: 'Long Travel', fwd: 'FORWARD', rev: 'REVERSE', relayFwd: 'R1', relayRev: 'R2' },
  CT: { label: 'Cross Travel', fwd: 'LEFT', rev: 'RIGHT', relayFwd: 'R3', relayRev: 'R4' },
  HOIST: { label: 'Hoist', fwd: 'UP', rev: 'DOWN', relayFwd: 'R5', relayRev: 'R6' },
}

const INTERLOCK_EXPLANATION = {
  formula: 'Relay(dir) energizes only if: PB(dir) held AND Limit(dir) NOT tripped AND Relay(opposite) NOT already energized',
  variables: [
    { symbol: 'PB(dir)', name: 'Push button held', value: 'boolean', unit: '' },
    { symbol: 'Relay(opposite)', name: 'Opposite-direction relay state', value: 'boolean', unit: '' },
  ],
  substitution: 'Each relay\'s coil circuit is wired THROUGH the opposite relay\'s normally-closed (NC) auxiliary contact.',
  result: 'Only one direction can ever be energized — and it is whichever one activates FIRST, not a fixed side.',
  reasoning:
    'This is boolean interlock logic, but it hides a timing detail that matters: it is NOT symmetric in real hardware. If both FORWARD and REVERSE contactors closed at once, they would connect two phases directly across the supply, causing a phase-to-phase short circuit through the motor windings — so the wiring must guarantee only one, ever. Routing each relay\'s coil through the OTHER relay\'s NC contact does this: the moment one relay energizes, its NC contact opens and physically locks the opposite coil\'s circuit out — even if that button is also being held down. No software logic can fail here, because it\'s enforced by the wiring itself, not a program.',
  standard: 'IS/IEC 60204-1 — electromechanical interlocking for reversing motor control circuits.',
  common_mistakes: [
    'Relying on a PLC/software interlock alone without a hard-wired electromechanical interlock as backup.',
    'Forgetting that limit switches must also be NC (fail-safe) — a broken wire should stop the motion, not enable it.',
  ],
}

const SIMULTANEOUS_PRESS_EXPLANATION = {
  formula: 'Both PB(FWD) and PB(REV) held at the same instant',
  variables: [],
  substitution: 'Whichever relay\'s coil draws in fractionally first opens the other\'s NC contact first.',
  result: 'Exactly ONE direction wins — never both, and (on real hardware) not reliably a predictable one.',
  reasoning:
    'This is one of the most common interview and viva questions on reversing starters, and it\'s subtle: a pure truth-table treats "both inputs true" as ambiguous. Real relays don\'t evaluate instantaneously — every coil has a finite pull-in time (a few milliseconds), and no two relays are perfectly identical (tiny differences in coil resistance, spring tension, contact gap). So when both buttons are pressed at the exact same instant, one relay will always start moving fractionally before the other, its NC contact opens first, and that cuts power to the second coil before it can complete pull-in. The interlock guarantees ONE wins, never both — but does not guarantee WHICH one, unless one button was already held down first (in which case that one always keeps its claim). This is exactly why reversing starters for higher-power motors (per Siemens/Schneider/ABB application guides) often add a MECHANICAL interlock too — a physical lever linking the two contactors so one literally cannot close while the other is closed, removing any doubt at all rather than depending on microsecond timing.',
  standard: 'IEC 60204-1 Cl.9.2.5.4 / manufacturer application guides (Siemens, Schneider, ABB) for reversing contactor assemblies.',
  common_mistakes: [
    'Assuming "neither will energize" if both buttons are pressed together — in real electromechanical hardware, one normally does.',
    'Treating electrical interlock alone as sufficient for high-power reversing duty instead of adding a mechanical interlock.',
  ],
}

const SUPPLY_FAILURE_EXPLANATION = {
  formula: 'No coil in this circuit is latching — every contactor and relay here is a plain AC coil held in only by continuous current.',
  variables: [
    { symbol: 'Supply', name: 'Incoming 415V feeding the 110V control transformer', value: 'boolean', unit: '' },
  ],
  substitution: 'Removing supply removes the field holding every coil closed, exactly like opening the E-Stop or Overload NC contact does.',
  result: 'The visible effect (everything drops out) is identical to an E-Stop or overload trip — but the cause and the fix are different.',
  reasoning:
    'This is a standard, deliberate contactor behaviour called "no-volt release," and it is a safety feature, not a fault: an ordinary AC contactor has no memory of its own — its armature is only held in by the magnetic field from the coil\'s current, so the instant that current stops for any reason, the contactor drops out under spring pressure. E-Stop and the overload relay are protective devices that are meant to open — something on the panel decided to interrupt power on purpose, and a human is expected to investigate why before clearing it. A supply failure is different: nothing on the panel chose this, the incoming electricity actually went away (a tripped upstream breaker, a utility outage, a broken feeder). Because this circuit has no seal-in/latching relay anywhere, both cases behave identically once power actually flows again: if a push button is still being physically held down at that instant, the relay it commands re-energizes immediately, no fresh press required. For a crane, whether that is desirable is a genuinely debated design question — see the note on restart lockout in the overload explanation.',
  standard: 'General AC contactor operating principle (electromagnetic armature actuation) — see any Siemens/Schneider/ABB contactor datasheet\'s "no-volt release" or "under-voltage release" description.',
  common_mistakes: [
    'Assuming a dropped-out contactor after a power dip is a wiring fault — for a plain (non-latching) coil, this is completely normal behaviour.',
    'Wiring safety-critical loads to auto-restart on power return without asking whether that is actually the desired behaviour for that specific machine.',
  ],
}

const PROTECTION_EXPLANATION = {
  formula: 'Control power reaches the branches only if: E-Stop NC closed AND Overload Relay NC closed',
  variables: [
    { symbol: 'E-Stop', name: 'Emergency stop pushbutton (NC, mushroom-head, latching)', value: 'boolean', unit: '' },
    { symbol: 'Overload NC', name: 'Thermal overload relay auxiliary contact', value: 'boolean', unit: '' },
  ],
  substitution: 'Both contacts sit in SERIES in the master 110V feed, upstream of both direction branches.',
  result: 'Either one opening kills power to BOTH directions at once — not just the one running.',
  reasoning:
    'Two different failure philosophies, same wiring principle (normally-closed, fail-safe): E-Stop is a manually operated NC pushbutton — pressing it mechanically breaks the circuit immediately, and it physically latches down so it cannot be released by accident; a deliberate twist-and-release is required before anything can run again. The overload relay\'s NC contact is different: it opens automatically when the thermal element detects sustained overcurrent, protecting the motor windings from heat damage — but it does NOT reset itself even after the motor cools down. This is deliberate: if the overload relay is left to reset on its own, an intermittent fault could cycle the motor on and off indefinitely, overheating it a little more each time. Requiring a human to press a physical reset button forces someone to actually go find out WHY it tripped before running the motor again. ' +
    'One more thing worth knowing at this level: this circuit is deliberately memory-less — press-and-hold PB(dir) is the only thing deciding whether a relay is energized, and Reset Overload only clears the fault flag, it does not force a fresh button press. So if you are still holding PB FWD when you clear the overload, motion resumes immediately with no separate restart action — that matches simple hold-to-run/deadman pendant control, standard for cranes precisely because releasing any button always stops motion. Some machinery safety practice (unexpected-start prevention, per ISO 12100 / EN 1037 principles) instead calls for an explicit restart lockout after any protective trip: clearing the fault should not be enough, the operator must release and re-press before anything moves. Both are legitimate design choices — a restart lockout needs a genuinely different circuit (a seal-in/latching auxiliary relay that PB(dir) only sets, never directly drives), which this simulator does not currently model.',
  standard: 'IS 13947-4-1 / IEC 60947-4-1 — thermal overload relay manual-reset requirement; IEC 60204-1 — E-stop category 0/1 requirements.',
  common_mistakes: [
    'Wiring the overload relay NC contact into only ONE direction branch instead of the shared master feed — a trip should stop the motor regardless of which direction it was running.',
    'Using an auto-reset overload relay on a crane — masks intermittent faults instead of forcing investigation.',
    'Assuming a fault reset always requires a fresh button press — on a memory-less hold-to-run circuit like this one it doesn\'t, unless you deliberately add a seal-in/latching restart lockout.',
  ],
}

export default function ControlCircuit() {
  const [motion, setMotion] = useState('LT')
  const [pbFwd, setPbFwd] = useState(false)
  const [pbRev, setPbRev] = useState(false)
  const [limitFwd, setLimitFwd] = useState(false)
  const [limitRev, setLimitRev] = useState(false)
  const [eStop, setEStop] = useState(false)
  const [overloadTripped, setOverloadTripped] = useState(false)
  const [supplyLost, setSupplyLost] = useState(false)

  const [activeDir, setActiveDir] = useState(null)

  const m = MOTIONS[motion]
  const controlPowerOk = !supplyLost && !eStop && !overloadTripped

  // Pure transition function — given the NEXT value of whichever input just
  // changed (plus everything else as it currently stands), decides which
  // direction should hold the interlock claim. Called directly from each
  // event handler below (not from an effect), so there's exactly one state
  // update per user action instead of a derived render-then-effect cascade.
  const computeNextActive = (next, prev) => {
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

  const snapshot = (overrides = {}) => ({ pbFwd, pbRev, limitFwd, limitRev, eStop, overload: overloadTripped, supplyLost, ...overrides })
  const applyTransition = (overrides) => setActiveDir((prev) => computeNextActive(snapshot(overrides), prev))

  const handlePbFwd = (v) => { setPbFwd(v); applyTransition({ pbFwd: v }) }
  const handlePbRev = (v) => { setPbRev(v); applyTransition({ pbRev: v }) }
  const handleLimitFwd = (v) => { setLimitFwd(v); applyTransition({ limitFwd: v }) }
  const handleLimitRev = (v) => { setLimitRev(v); applyTransition({ limitRev: v }) }
  const handleEStop = (v) => { setEStop(v); applyTransition({ eStop: v }) }
  const handleOverload = (v) => { setOverloadTripped(v); applyTransition({ overload: v }) }
  const handleSupplyLost = (v) => { setSupplyLost(v); applyTransition({ supplyLost: v }) }

  const relayFwdEnergized = activeDir === 'FWD'
  const relayRevEnergized = activeDir === 'REV'

  const reset = () => {
    setPbFwd(false); setPbRev(false); setLimitFwd(false); setLimitRev(false)
    setEStop(false); setActiveDir(null)
    // Overload is intentionally NOT cleared by Reset All — thermal overload
    // relays require a deliberate, separate manual reset (see button below),
    // matching real hardware so the simulator doesn't teach a shortcut that
    // doesn't exist on an actual panel.
    // Supply failure is also NOT cleared here — that's the utility restoring
    // power, not something an operator "resets" from the panel.
  }
  // NOTE (fixed in this pass): this used to only clear the overloadTripped flag
  // without recomputing activeDir, which left the relay OFF even if the PB was
  // still being held through the trip — contradicting this circuit's own stated
  // model (a memory-less, purely combinational hold-to-run circuit: see
  // INTERLOCK_EXPLANATION.formula, which has no "requires a fresh press" term).
  // On real hard-wired hold-to-run pendant controls with no seal-in relay, the
  // instant the overload NC recloses, current already has a path through
  // whichever PB is still physically held, and the contactor pulls in
  // immediately — no separate restart action needed. If you later add a true
  // seal-in/latching branch, this is the place to add a deliberate restart-lockout
  // instead (see the Expert-tier note below).
  const resetOverload = () => { setOverloadTripped(false); applyTransition({ overload: false }) }
  const resetSupply = () => { setSupplyLost(false); applyTransition({ supplyLost: false }) }

  // Every downstream wire is gated by control power (E-stop NOT pressed AND
  // overload NOT tripped) — both sit in series in the master 110V feed, so
  // either one removes power from BOTH directions at once, not just the one
  // in use.
  const wire = (energized) => (controlPowerOk && energized) ? 'var(--color-safe)' : 'var(--color-steel)'
  const wireClass = (energized) => (controlPowerOk && energized) ? 'wire-flow' : ''

  return (
    <div>
      <PageHeader
        icon={CircuitBoard}
        title="Control Circuit Visualizer"
        description="Real relay interlock circuit from an EOT crane panel. Press push buttons to see relay energization and NO/NC contact states in real time."
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.entries(MOTIONS).map(([key, mo]) => (
          <button
            key={key}
            onClick={() => { setMotion(key); reset() }}
            className={`px-4 py-2 rounded-md border-2 font-semibold text-sm transition-colors cursor-pointer
              ${motion === key ? 'bg-amber border-amber text-ink' : 'border-steel text-text-muted hover:border-steel-light'}`}
          >
            {mo.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <Card padding="lg" className="overflow-x-auto">
          <svg width="700" height="460" viewBox="0 0 700 460" className="font-mono min-w-[640px]">
            {/* MASTER FEED: E-STOP + OVERLOAD RELAY NC, in series, upstream of the
                whole circuit below. Either one opening removes power from BOTH
                directions at once — drawn as its own row so the series
                relationship to everything below is unambiguous. */}
            <text x="20" y="18" fill="var(--color-danger)" fontSize="10" fontWeight="bold">MASTER FEED — SUPPLY, E-STOP + OVERLOAD RELAY NC (in series, both directions)</text>
            <SupplySource x={20} y={17} lost={supplyLost} />
            <line x1="45" y1="30" x2="100" y2="30" stroke={(!supplyLost && eStop) ? 'var(--color-danger)' : (supplyLost ? 'var(--color-steel)' : 'var(--color-safe)')} strokeWidth="2.5" />
            <MasterNCContact x={100} y={17} tripped={eStop} label="E-STOP" />
            <line x1="160" y1="30" x2="260" y2="30" stroke={controlPowerOk ? 'var(--color-safe)' : 'var(--color-danger)'} className={controlPowerOk ? 'wire-flow' : ''} strokeWidth="2.5" />
            <MasterNCContact x={260} y={17} tripped={overloadTripped} label="OVERLOAD" />
            <line x1="320" y1="30" x2="680" y2="30" stroke={controlPowerOk ? 'var(--color-safe)' : 'var(--color-danger)'} className={controlPowerOk ? 'wire-flow' : ''} strokeWidth="2.5" />
            <line x1="680" y1="30" x2="680" y2="65" stroke={controlPowerOk ? 'var(--color-safe)' : 'var(--color-danger)'} strokeWidth="2.5" />

            <text x="10" y="60" fill="var(--color-text-muted)" fontSize="11">110V AC (protected, to direction branches)</text>
            <line x1="20" y1="65" x2="680" y2="65" stroke={controlPowerOk ? 'var(--color-amber)' : 'var(--color-danger)'} strokeWidth="3" />
            <text x="10" y="445" fill="var(--color-text-muted)" fontSize="11">0V (Neutral / Common Return)</text>
            <line x1="20" y1="420" x2="680" y2="420" stroke="var(--color-text-dim)" strokeWidth="3" />

            {/* FORWARD/UP/LEFT BRANCH */}
            <text x="60" y="90" fill="var(--color-info)" fontSize="11" fontWeight="bold">{m.fwd}</text>
            <line x1="60" y1="65" x2="60" y2="100" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2.5" />
            <PushButton x={45} y={100} active={pbFwd} onClick={() => handlePbFwd(!pbFwd)} label="PB FWD" />
            <line x1="60" y1="130" x2="60" y2="170" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2.5" />
            <NCContact x={45} y={170} open={relayRevEnergized} active={pbFwd && !relayRevEnergized} label={`${m.relayRev} NC`} />
            <line x1="60" y1="200" x2="60" y2="240" stroke={wire(pbFwd && !relayRevEnergized)} className={wireClass(pbFwd && !relayRevEnergized)} strokeWidth="2.5" />
            <NCContact x={45} y={240} open={limitFwd} active={pbFwd && !relayRevEnergized && !limitFwd} label="Limit FWD" />
            <line x1="60" y1="270" x2="60" y2="310" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <RelayCoil x={30} y={310} energized={relayFwdEnergized} label={m.relayFwd} sublabel={m.fwd} />
            <line x1="60" y1="370" x2="60" y2="420" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />

            {/* REVERSE/DOWN/RIGHT BRANCH */}
            <text x="260" y="90" fill="#a78bfa" fontSize="11" fontWeight="bold">{m.rev}</text>
            <line x1="260" y1="65" x2="260" y2="100" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2.5" />
            <PushButton x={245} y={100} active={pbRev} onClick={() => handlePbRev(!pbRev)} label="PB REV" />
            <line x1="260" y1="130" x2="260" y2="170" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2.5" />
            <NCContact x={245} y={170} open={relayFwdEnergized} active={pbRev && !relayFwdEnergized} label={`${m.relayFwd} NC`} />
            <line x1="260" y1="200" x2="260" y2="240" stroke={wire(pbRev && !relayFwdEnergized)} className={wireClass(pbRev && !relayFwdEnergized)} strokeWidth="2.5" />
            <NCContact x={245} y={240} open={limitRev} active={pbRev && !relayFwdEnergized && !limitRev} label="Limit REV" />
            <line x1="260" y1="270" x2="260" y2="310" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <RelayCoil x={230} y={310} energized={relayRevEnergized} label={m.relayRev} sublabel={m.rev} />
            <line x1="260" y1="370" x2="260" y2="420" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />

            {/* OUTPUT TO CONTACTOR COILS */}
            <text x="450" y="90" fill="var(--color-safe)" fontSize="11" fontWeight="bold">CONTACTOR COILS</text>
            <line x1="120" y1="340" x2="430" y2="340" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <NOContact x={400} y={325} closed={relayFwdEnergized} label={`${m.relayFwd} NO`} />
            <line x1="430" y1="340" x2="460" y2="340" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <line x1="460" y1="340" x2="460" y2="65" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <ContactorCoil x={440} y={180} energized={relayFwdEnergized} label={`Contactor\n${m.fwd}`} />
            <line x1="460" y1="270" x2="460" y2="340" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />

            <line x1="260" y1="370" x2="540" y2="370" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <NOContact x={510} y={355} closed={relayRevEnergized} label={`${m.relayRev} NO`} />
            <line x1="540" y1="370" x2="580" y2="370" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <line x1="580" y1="370" x2="580" y2="420" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <ContactorCoil x={560} y={230} energized={relayRevEnergized} label={`Contactor\n${m.rev}`} />
            <line x1="580" y1="65" x2="580" y2="230" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
          </svg>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="font-display text-danger font-semibold mb-3 flex items-center gap-1.5"><AlertOctagon size={15} /> Master Feed Protection</h3>
            <Toggle checked={supplyLost} onChange={handleSupplyLost} label="Simulate main supply failure" description="415V incoming lost — the 110V control rail it feeds dies with it" />
            {supplyLost && (
              <Button variant="secondary" className="w-full mt-2 mb-1" icon={RotateCcw} onClick={resetSupply}>Restore Supply</Button>
            )}
            <Toggle checked={eStop} onChange={handleEStop} label="Press E-Stop" description="Latching NC — cuts power to both directions instantly" />
            <Toggle checked={overloadTripped} onChange={handleOverload} label="Simulate overload trip" description="Thermal NC — does NOT self-reset" />
            {overloadTripped && (
              <Button variant="secondary" className="w-full mt-2" icon={RotateCcw} onClick={resetOverload}>Manually Reset Overload</Button>
            )}
          </Card>

          <Card>
            <h3 className="font-display text-amber font-semibold mb-3">Simulate Limit Switches</h3>
            <Toggle checked={limitFwd} onChange={handleLimitFwd} label={`Trigger ${m.fwd} limit switch`} description="Opens the NC contact" />
            <Toggle checked={limitRev} onChange={handleLimitRev} label={`Trigger ${m.rev} limit switch`} description="Opens the NC contact" />
            <Button variant="secondary" className="w-full mt-3" onClick={reset}>Reset All (E-Stop, PBs, Limits)</Button>
          </Card>

          <Card>
            <h3 className="font-display text-amber font-semibold mb-3">Live Status</h3>
            <StatusRow label="Main supply (415V)" active={!supplyLost} />
            <StatusRow label="Control power (Supply + E-Stop + Overload OK)" active={controlPowerOk} />
            <StatusRow label={`Relay ${m.relayFwd} (${m.fwd})`} active={relayFwdEnergized} />
            <StatusRow label={`Relay ${m.relayRev} (${m.rev})`} active={relayRevEnergized} />
            <StatusRow label={`Contactor ${m.fwd}`} active={relayFwdEnergized} />
            <StatusRow label={`Contactor ${m.rev}`} active={relayRevEnergized} />
          </Card>

          <Card variant="inset">
            <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2.5">
              <Palette size={14} /> Color Legend
            </div>
            {[
              { color: 'var(--color-safe)', label: 'Energized / current flowing' },
              { color: 'var(--color-steel)', label: 'De-energized / no current' },
              { color: 'var(--color-danger)', label: 'Contact open (blocking)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-1 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-text-muted text-xs">{item.label}</span>
              </div>
            ))}
          </Card>

          <div className="flex items-start gap-2 bg-info-dim/50 border border-info/30 rounded-lg px-3.5 py-3">
            <Lightbulb size={15} className="text-info shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Press both PB FWD and PB REV — notice only the first one activates and stays active even while both
              are held. Now try Reset then Press E-Stop — everything drops out immediately, in either direction.
            </p>
          </div>

          <FormulaExplainer title="Why is this interlock wired this way?" explanation={INTERLOCK_EXPLANATION} />
          <FormulaExplainer title="What if FWD and REV are pressed at the exact same instant?" explanation={SIMULTANEOUS_PRESS_EXPLANATION} />
          <FormulaExplainer title="Why does E-Stop cut both directions, and why doesn't overload self-reset?" explanation={PROTECTION_EXPLANATION} />
          <FormulaExplainer title="Why does a supply failure look the same as E-Stop or overload, but isn't?" explanation={SUPPLY_FAILURE_EXPLANATION} />
        </div>
      </div>
    </div>
  )
}

function SupplySource({ x, y, lost }) {
  // Deliberately NOT drawn as a contact symbol (unlike MasterNCContact) — a
  // supply failure is the source itself disappearing, not a switch opening.
  // Teaching it as a "contact" would blur an important distinction covered in
  // the explanation panel below: E-Stop/Overload are protective devices that
  // deliberately open; a supply failure is an external event nothing on the
  // panel controls.
  return (
    <g>
      <rect x={x} y={y - 2} width="25" height="24" rx="3"
        fill={lost ? 'var(--color-inset)' : 'color-mix(in srgb, var(--color-safe) 20%, transparent)'}
        stroke={lost ? 'var(--color-danger)' : 'var(--color-safe)'} strokeWidth="2" />
      <text x={x + 12} y={y + 13} textAnchor="middle" fill={lost ? 'var(--color-danger)' : 'var(--color-safe)'} fontSize="7" fontWeight="bold">415V</text>
      <text x={x + 12} y={y - 6} textAnchor="middle" fill={lost ? 'var(--color-danger)' : 'var(--color-text-muted)'} fontSize="8" fontWeight="bold">SUPPLY</text>
      <text x={x + 12} y={y + 34} textAnchor="middle" fill={lost ? 'var(--color-danger)' : 'var(--color-safe)'} fontSize="8">{lost ? 'LOST' : 'OK'}</text>
    </g>
  )
}

function MasterNCContact({ x, y, tripped, label }) {
  const isClosed = !tripped
  return (
    <g>
      <line x1={x - 40} y1={y + 13} x2={x - 15} y2={y + 13} stroke={isClosed ? 'var(--color-safe)' : 'var(--color-danger)'} strokeWidth="2.5" />
      <line x1={x + 15} y1={y + 13} x2={x + 40} y2={y + 13} stroke={isClosed ? 'var(--color-safe)' : 'var(--color-danger)'} strokeWidth="2.5" />
      {isClosed ? (
        <line x1={x - 15} y1={y + 13} x2={x + 15} y2={y + 13} stroke="var(--color-safe)" strokeWidth="2.5" />
      ) : (
        <line x1={x - 15} y1={y + 13} x2={x + 5} y2={y - 2} stroke="var(--color-danger)" strokeWidth="2.5" />
      )}
      <text x={x} y={y - 4} textAnchor="middle" fill={isClosed ? 'var(--color-text-muted)' : 'var(--color-danger)'} fontSize="9" fontWeight="bold">{label}</text>
      <text x={x} y={y + 30} textAnchor="middle" fill={isClosed ? 'var(--color-safe)' : 'var(--color-danger)'} fontSize="8">{isClosed ? 'CLOSED' : 'TRIPPED'}</text>
    </g>
  )
}

function PushButton({ x, y, active, onClick, label }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={x + 15} cy={y + 15} r="14" fill={active ? 'color-mix(in srgb, var(--color-safe) 27%, transparent)' : 'var(--color-inset)'} stroke={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} strokeWidth="2" />
      <circle cx={x + 15} cy={y + 15} r="7" fill={active ? 'var(--color-safe)' : 'var(--color-steel)'} />
      <text x={x + 15} y={y + 38} textAnchor="middle" fill={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} fontSize="8">{label}</text>
    </g>
  )
}

function NCContact({ x, y, open, active, label }) {
  const isClosed = !open
  return (
    <g>
      <line x1={x + 15} y1={y} x2={x + 15} y2={y + 8} stroke={active ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2.5" />
      <line x1={x + 15} y1={y + 22} x2={x + 15} y2={y + 30} stroke={active ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2.5" />
      {isClosed ? (
        <line x1={x + 15} y1={y + 8} x2={x + 15} y2={y + 22} stroke={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} strokeWidth="2.5" />
      ) : (
        <line x1={x + 15} y1={y + 8} x2={x + 24} y2={y + 16} stroke="var(--color-danger)" strokeWidth="2.5" />
      )}
      <text x={x + 32} y={y + 12} fill={isClosed ? 'var(--color-text-muted)' : 'var(--color-danger)'} fontSize="8">{label}</text>
      <text x={x + 32} y={y + 22} fill={isClosed ? 'var(--color-safe)' : 'var(--color-danger)'} fontSize="8">{isClosed ? 'CLOSED' : 'OPEN'}</text>
    </g>
  )
}

function NOContact({ x, y, closed, label }) {
  return (
    <g>
      <line x1={x} y1={y + 15} x2={x + 8} y2={y + 15} stroke={closed ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2.5" />
      <line x1={x + 22} y1={y + 15} x2={x + 30} y2={y + 15} stroke={closed ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2.5" />
      {closed ? (
        <line x1={x + 8} y1={y + 15} x2={x + 22} y2={y + 15} stroke="var(--color-safe)" strokeWidth="2.5" />
      ) : (
        <line x1={x + 8} y1={y + 15} x2={x + 18} y2={y + 5} stroke="var(--color-text-muted)" strokeWidth="2.5" />
      )}
      <text x={x - 5} y={y - 5} fill={closed ? 'var(--color-safe)' : 'var(--color-text-muted)'} fontSize="8">{label}</text>
    </g>
  )
}

function RelayCoil({ x, y, energized, label, sublabel }) {
  return (
    <g className={energized ? 'animate-pulse' : ''}>
      <rect x={x} y={y} width="60" height="60" rx="6"
        fill={energized ? 'color-mix(in srgb, var(--color-amber) 20%, transparent)' : 'var(--color-inset)'}
        stroke={energized ? 'var(--color-amber)' : 'var(--color-steel)'} strokeWidth="2.5" />
      <text x={x + 30} y={y + 25} textAnchor="middle" fill={energized ? 'var(--color-amber)' : 'var(--color-text-muted)'} fontSize="14" fontWeight="bold">{label}</text>
      <text x={x + 30} y={y + 40} textAnchor="middle" fill={energized ? 'var(--color-amber)' : 'var(--color-text-muted)'} fontSize="8">{sublabel}</text>
      <text x={x + 30} y={y + 52} textAnchor="middle" fill={energized ? 'var(--color-safe)' : 'var(--color-steel)'} fontSize="8">{energized ? 'ENERGIZED' : 'OFF'}</text>
    </g>
  )
}

function ContactorCoil({ x, y, energized, label }) {
  const lines = label.split('\n')
  return (
    <g className={energized ? 'animate-pulse' : ''}>
      <rect x={x} y={y} width="60" height="60" rx="6"
        fill={energized ? 'color-mix(in srgb, var(--color-safe) 20%, transparent)' : 'var(--color-inset)'}
        stroke={energized ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2.5" />
      <text x={x + 30} y={y + 22} textAnchor="middle" fill={energized ? 'var(--color-safe)' : 'var(--color-text-muted)'} fontSize="9" fontWeight="bold">{lines[0]}</text>
      <text x={x + 30} y={y + 34} textAnchor="middle" fill={energized ? 'var(--color-safe)' : 'var(--color-text-muted)'} fontSize="9" fontWeight="bold">{lines[1]}</text>
      <text x={x + 30} y={y + 50} textAnchor="middle" fill={energized ? 'var(--color-safe)' : 'var(--color-steel)'} fontSize="8">{energized ? 'ON' : 'OFF'}</text>
    </g>
  )
}

function StatusRow({ label, active }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-text-muted text-sm">{label}</span>
      <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${active ? 'text-safe bg-safe-dim' : 'text-text-dim bg-steel/30'}`}>
        {active ? '● ON' : '○ OFF'}
      </span>
    </div>
  )
}
