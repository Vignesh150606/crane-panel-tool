import { useState, useEffect } from 'react'
import { computeNextActive } from '../../lib/relayLogic'

/**
 * A single reversing (FWD/REV) relay branch pair, built for the two new
 * training modules. It deliberately does NOT reimplement the interlock
 * decision — computeNextActive (lib/relayLogic.js) is the exact same
 * function ControlCircuit.jsx uses, so a scenario built on this component is
 * testing the real interlock behavior, not a simplified stand-in.
 *
 * What's genuinely new here (not present in ControlCircuit.jsx's model,
 * because that page has no reason to model a BROKEN circuit) is the `faults`
 * prop: narrow, explicitly-commented overrides layered on top of the normal
 * decision, each corresponding to a real failure mode that a boolean
 * interlock calculation can't represent on its own —
 *   - a limit switch stuck permanently open/closed (mechanical binding)
 *   - a relay coil that never pulls in even when everything upstream is
 *     correct (burnt coil / broken wire to the coil)
 *   - a relay that energizes but whose NO contact doesn't actually close
 *     the contactor circuit (welded or broken auxiliary contact)
 *   - the interlock itself bypassed (both directions can energize together
 *     — the single most dangerous fault this panel can have)
 * Only ONE of these is ever set per scenario; this is a diagnostic tool, not
 * a general-purpose fault combiner.
 */
export default function MiniControlCircuit({
  motionLabel = 'Motion', fwdLabel = 'FORWARD', revLabel = 'REVERSE',
  pbFwd, pbRev, onPbFwd, onPbRev,
  limitFwd = false, limitRev = false, onLimitFwd, onLimitRev,
  eStop = false, onEStop,
  overloadTripped = false, onOverload,
  showLimitControls = true, showMasterControls = true,
  faults = {},
}) {
  const effLimitFwd = faults.limitFwdStuckOpen ? true : limitFwd
  const effLimitRev = faults.limitRevStuckOpen ? true : limitRev
  const effEStop = faults.eStopStuckPressed ? true : eStop
  const effOverload = faults.overloadWontReset ? (overloadTripped || faults.overloadWontReset === 'always') : overloadTripped

  // activeDir is derived from the props above, but it depends on its OWN
  // previous value (computeNextActive needs to know which direction
  // currently holds the interlock claim to decide whether it should keep
  // holding it) — that makes it genuine internal state, not a value to
  // recompute fresh every render. Synced via effect (not during render)
  // specifically to avoid updating state from within a render pass.
  const [activeDir, setActiveDir] = useState(null)
  useEffect(() => {
    setActiveDir((prev) => computeNextActive(
      { pbFwd, pbRev, limitFwd: effLimitFwd, limitRev: effLimitRev, eStop: effEStop, overload: effOverload, supplyLost: false },
      prev
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pbFwd, pbRev, effLimitFwd, effLimitRev, effEStop, effOverload])

  const controlPowerOk = !effEStop && !effOverload

  // Interlock-bypass fault: the one case the normal decision function
  // structurally cannot return (it always returns at most one direction) —
  // modeled as a direct override of what's ENERGIZED, not a change to the
  // decision function itself, so the function stays the single source of
  // truth for every scenario that doesn't have this specific fault.
  const relayFwdRaw = faults.interlockBypassed
    ? (controlPowerOk && pbFwd && !effLimitFwd)
    : activeDir === 'FWD'
  const relayRevRaw = faults.interlockBypassed
    ? (controlPowerOk && pbRev && !effLimitRev)
    : activeDir === 'REV'

  const relayFwdEnergized = faults.relayFwdWontEnergize ? false : relayFwdRaw
  const relayRevEnergized = faults.relayRevWontEnergize ? false : relayRevRaw
  const contactorFwdOn = relayFwdEnergized && !faults.contactorFwdWontClose
  const contactorRevOn = relayRevEnergized && !faults.contactorRevWontClose

  const wire = (on) => (controlPowerOk && on) ? 'var(--color-safe)' : 'var(--color-steel)'
  const wireClass = (on) => (controlPowerOk && on) ? 'wire-flow' : ''

  return (
    <div>
      <svg width="100%" height="330" viewBox="0 0 480 330" className="font-mono min-w-[440px]">
        {showMasterControls && (
          <>
            <text x="10" y="14" fill="var(--color-danger)" fontSize="9" fontWeight="bold">MASTER FEED</text>
            <MasterNC x={60} y={2} tripped={effEStop} label="E-STOP" />
            <line x1="110" y1="15" x2="180" y2="15" stroke={controlPowerOk ? 'var(--color-safe)' : 'var(--color-danger)'} className={controlPowerOk ? 'wire-flow' : ''} strokeWidth="2" />
            <MasterNC x={180} y={2} tripped={effOverload} label="OVERLOAD" />
            <line x1="230" y1="15" x2="460" y2="15" stroke={controlPowerOk ? 'var(--color-safe)' : 'var(--color-danger)'} className={controlPowerOk ? 'wire-flow' : ''} strokeWidth="2" />
          </>
        )}
        <line x1="20" y1={showMasterControls ? 40 : 15} x2="460" y2={showMasterControls ? 40 : 15} stroke={controlPowerOk ? 'var(--color-amber)' : 'var(--color-danger)'} strokeWidth="2.5" />
        <line x1="20" y1="300" x2="460" y2="300" stroke="var(--color-text-dim)" strokeWidth="2.5" />

        {/* FWD branch */}
        <text x="40" y={showMasterControls ? 58 : 32} fill="var(--color-info)" fontSize="10" fontWeight="bold">{fwdLabel}</text>
        <line x1="45" y1={showMasterControls ? 40 : 15} x2="45" y2="70" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2" />
        <PB x={30} y={70} active={pbFwd} onClick={() => onPbFwd(!pbFwd)} label="PB FWD" />
        <line x1="45" y1="98" x2="45" y2="128" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2" />
        <NC x={30} y={128} open={relayRevEnergized && !faults.interlockBypassed} active={pbFwd} label="REV NC" />
        <line x1="45" y1="156" x2="45" y2="186" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2" />
        <NC x={30} y={186} open={effLimitFwd} active={pbFwd} label="Limit FWD" />
        <line x1="45" y1="214" x2="45" y2="240" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2" />
        <Coil x={18} y={240} energized={relayFwdEnergized} label="R-FWD" broken={faults.relayFwdWontEnergize} />
        <line x1="45" y1="290" x2="45" y2="300" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2" />

        {/* REV branch */}
        <text x="210" y={showMasterControls ? 58 : 32} fill="#a78bfa" fontSize="10" fontWeight="bold">{revLabel}</text>
        <line x1="215" y1={showMasterControls ? 40 : 15} x2="215" y2="70" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2" />
        <PB x={200} y={70} active={pbRev} onClick={() => onPbRev(!pbRev)} label="PB REV" />
        <line x1="215" y1="98" x2="215" y2="128" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2" />
        <NC x={200} y={128} open={relayFwdEnergized && !faults.interlockBypassed} active={pbRev} label="FWD NC" />
        <line x1="215" y1="156" x2="215" y2="186" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2" />
        <NC x={200} y={186} open={effLimitRev} active={pbRev} label="Limit REV" />
        <line x1="215" y1="214" x2="215" y2="240" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2" />
        <Coil x={188} y={240} energized={relayRevEnergized} label="R-REV" broken={faults.relayRevWontEnergize} />
        <line x1="215" y1="290" x2="215" y2="300" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2" />

        {/* Contactors */}
        <text x="360" y={showMasterControls ? 58 : 32} fill="var(--color-safe)" fontSize="10" fontWeight="bold">CONTACTORS</text>
        <line x1="78" y1="264" x2="350" y2="264" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2" />
        <line x1="350" y1="264" x2="350" y2={showMasterControls ? 40 : 15} stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2" />
        <ContactorBox x={330} y={70} energized={contactorFwdOn} relayOn={relayFwdEnergized} label={`Cont.\n${fwdLabel}`} broken={faults.contactorFwdWontClose} />
        <line x1="365" y1="130" x2="365" y2="264" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2" />

        <line x1="248" y1="278" x2="410" y2="278" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2" />
        <line x1="410" y1="278" x2="410" y2="300" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2" />
        <ContactorBox x={330} y={160} energized={contactorRevOn} relayOn={relayRevEnergized} label={`Cont.\n${revLabel}`} broken={faults.contactorRevWontClose} />
        <line x1="410" y1={showMasterControls ? 40 : 15} x2="410" y2="220" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2" />
      </svg>

      {(showLimitControls || showMasterControls) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-xs">
          {showMasterControls && onEStop && (
            <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
              <input type="checkbox" checked={eStop} onChange={(e) => onEStop(e.target.checked)} disabled={faults.eStopStuckPressed} /> E-Stop pressed
            </label>
          )}
          {showMasterControls && onOverload && (
            <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
              <input type="checkbox" checked={overloadTripped} onChange={(e) => onOverload(e.target.checked)} /> Overload tripped
            </label>
          )}
          {showLimitControls && onLimitFwd && (
            <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
              <input type="checkbox" checked={limitFwd} onChange={(e) => onLimitFwd(e.target.checked)} disabled={faults.limitFwdStuckOpen} /> Limit {fwdLabel} triggered
            </label>
          )}
          {showLimitControls && onLimitRev && (
            <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
              <input type="checkbox" checked={limitRev} onChange={(e) => onLimitRev(e.target.checked)} disabled={faults.limitRevStuckOpen} /> Limit {revLabel} triggered
            </label>
          )}
        </div>
      )}
    </div>
  )
}

function PB({ x, y, active, onClick, label }) {
  return (
    <g onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-pressed={active} aria-label={label} style={{ cursor: 'pointer' }}>
      <circle cx={x + 15} cy={y + 12} r="11" fill={active ? 'color-mix(in srgb, var(--color-safe) 27%, transparent)' : 'var(--color-inset)'} stroke={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} strokeWidth="2" />
      <circle cx={x + 15} cy={y + 12} r="5" fill={active ? 'var(--color-safe)' : 'var(--color-steel)'} />
      <text x={x + 15} y={y + 32} textAnchor="middle" fill={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} fontSize="7.5">{label}</text>
    </g>
  )
}

function NC({ x, y, open, active, label }) {
  const closed = !open
  return (
    <g>
      <line x1={x + 15} y1={y} x2={x + 15} y2={y + 7} stroke={active ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2" />
      <line x1={x + 15} y1={y + 19} x2={x + 15} y2={y + 26} stroke={active ? 'var(--color-safe)' : 'var(--color-steel)'} strokeWidth="2" />
      {closed ? (
        <line x1={x + 15} y1={y + 7} x2={x + 15} y2={y + 19} stroke={active ? 'var(--color-safe)' : 'var(--color-text-muted)'} strokeWidth="2" />
      ) : (
        <line x1={x + 15} y1={y + 7} x2={x + 23} y2={y + 14} stroke="var(--color-danger)" strokeWidth="2" />
      )}
      <text x={x + 34} y={y + 11} fill={closed ? 'var(--color-text-muted)' : 'var(--color-danger)'} fontSize="7">{label}</text>
      <text x={x + 34} y={y + 20} fill={closed ? 'var(--color-safe)' : 'var(--color-danger)'} fontSize="6.5">{closed ? 'CLOSED' : 'OPEN'}</text>
    </g>
  )
}

function Coil({ x, y, energized, label, broken }) {
  const color = broken ? 'var(--color-danger)' : 'var(--color-amber)'
  return (
    <g className={energized && !broken ? 'animate-pulse' : ''}>
      <rect x={x} y={y} width="54" height="48" rx="5"
        fill={energized ? `color-mix(in srgb, ${color} 20%, transparent)` : 'var(--color-inset)'}
        stroke={energized ? color : 'var(--color-steel)'} strokeWidth="2" />
      <text x={x + 27} y={y + 21} textAnchor="middle" fill={energized ? color : 'var(--color-text-muted)'} fontSize="10" fontWeight="bold">{label}</text>
      <text x={x + 27} y={y + 40} textAnchor="middle" fill={energized ? (broken ? 'var(--color-danger)' : 'var(--color-safe)') : 'var(--color-steel)'} fontSize="7">
        {broken ? 'NO PULL-IN' : energized ? 'ENERGIZED' : 'OFF'}
      </text>
    </g>
  )
}

function ContactorBox({ x, y, energized, relayOn, label, broken }) {
  const lines = label.split('\n')
  const showFault = relayOn && broken
  return (
    <g className={energized ? 'animate-pulse' : ''}>
      <rect x={x} y={y} width="54" height="48" rx="5"
        fill={energized ? 'color-mix(in srgb, var(--color-safe) 20%, transparent)' : (showFault ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)' : 'var(--color-inset)')}
        stroke={energized ? 'var(--color-safe)' : (showFault ? 'var(--color-danger)' : 'var(--color-steel)')} strokeWidth="2" />
      <text x={x + 27} y={y + 18} textAnchor="middle" fill={energized ? 'var(--color-safe)' : (showFault ? 'var(--color-danger)' : 'var(--color-text-muted)')} fontSize="8" fontWeight="bold">{lines[0]}</text>
      <text x={x + 27} y={y + 29} textAnchor="middle" fill={energized ? 'var(--color-safe)' : (showFault ? 'var(--color-danger)' : 'var(--color-text-muted)')} fontSize="8" fontWeight="bold">{lines[1]}</text>
      <text x={x + 27} y={y + 41} textAnchor="middle" fill={energized ? 'var(--color-safe)' : (showFault ? 'var(--color-danger)' : 'var(--color-steel)')} fontSize="7">
        {energized ? 'CLOSED' : showFault ? "WON'T CLOSE" : 'OPEN'}
      </text>
    </g>
  )
}

function MasterNC({ x, y, tripped, label }) {
  const closed = !tripped
  return (
    <g>
      <line x1={x - 30} y1={y + 13} x2={x - 12} y2={y + 13} stroke={closed ? 'var(--color-safe)' : 'var(--color-danger)'} strokeWidth="2" />
      <line x1={x + 12} y1={y + 13} x2={x + 30} y2={y + 13} stroke={closed ? 'var(--color-safe)' : 'var(--color-danger)'} strokeWidth="2" />
      {closed ? (
        <line x1={x - 12} y1={y + 13} x2={x + 12} y2={y + 13} stroke="var(--color-safe)" strokeWidth="2" />
      ) : (
        <line x1={x - 12} y1={y + 13} x2={x + 4} y2={y} stroke="var(--color-danger)" strokeWidth="2" />
      )}
      <text x={x} y={y - 3} textAnchor="middle" fill={closed ? 'var(--color-text-muted)' : 'var(--color-danger)'} fontSize="7.5" fontWeight="bold">{label}</text>
    </g>
  )
}
