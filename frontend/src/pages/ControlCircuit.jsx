import { useState } from 'react'
import { CircuitBoard, Lightbulb, Palette } from 'lucide-react'
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
  formula: 'Relay(dir) = PB(dir) AND NOT LimitSwitch(dir) AND NOT Relay(opposite)',
  variables: [
    { symbol: 'PB(dir)', name: 'Push button pressed', value: 'boolean', unit: '' },
    { symbol: 'Relay(opposite)', name: 'Opposite-direction relay state', value: 'boolean', unit: '' },
  ],
  substitution: 'Each relay\'s coil circuit is wired THROUGH the opposite relay\'s normally-closed (NC) contact.',
  result: 'Only one direction can ever be energized at a time.',
  reasoning:
    'This is boolean interlock logic, not a numeric formula — but the "why" matters just as much. If both FORWARD and REVERSE contactors closed at once, they would connect two phases directly across the supply, causing a phase-to-phase short circuit through the motor windings. Routing each relay\'s coil through the other relay\'s NC contact makes the second direction physically unable to energize once the first is active — no software logic can fail, because it\'s enforced by the wiring itself.',
  standard: 'IS/IEC 60204-1 — electromechanical interlocking for reversing motor control circuits.',
  common_mistakes: [
    'Relying on a PLC/software interlock alone without a hard-wired electromechanical interlock as backup.',
    'Forgetting that limit switches must also be NC (fail-safe) — a broken wire should stop the motion, not enable it.',
  ],
}

export default function ControlCircuit() {
  const [motion, setMotion] = useState('LT')
  const [pbFwd, setPbFwd] = useState(false)
  const [pbRev, setPbRev] = useState(false)
  const [limitFwd, setLimitFwd] = useState(false)
  const [limitRev, setLimitRev] = useState(false)

  const m = MOTIONS[motion]

  const relayRevEnergizedCheck = () => pbRev && !limitRev
  const relayFwdEnergizedCheck = () => pbFwd && !limitFwd
  const relayFwdEnergized = pbFwd && !limitFwd && !relayRevEnergizedCheck()
  const relayRevEnergized = pbRev && !limitRev && !relayFwdEnergizedCheck()

  const reset = () => { setPbFwd(false); setPbRev(false); setLimitFwd(false); setLimitRev(false) }

  const wire = (energized) => energized ? 'var(--color-safe)' : 'var(--color-steel)'
  const wireClass = (energized) => energized ? 'wire-flow' : ''

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
          <svg width="700" height="420" viewBox="0 0 700 420" className="font-mono min-w-[640px]">
            <text x="10" y="20" fill="var(--color-text-muted)" fontSize="11">110V AC (from control transformer)</text>
            <line x1="20" y1="35" x2="680" y2="35" stroke="var(--color-amber)" strokeWidth="3" />
            <text x="10" y="405" fill="var(--color-text-muted)" fontSize="11">0V (Neutral / Common Return)</text>
            <line x1="20" y1="390" x2="680" y2="390" stroke="var(--color-text-dim)" strokeWidth="3" />

            {/* FORWARD/UP/LEFT BRANCH */}
            <text x="60" y="60" fill="var(--color-info)" fontSize="11" fontWeight="bold">{m.fwd}</text>
            <line x1="60" y1="35" x2="60" y2="70" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2.5" />
            <PushButton x={45} y={70} active={pbFwd} onClick={() => setPbFwd(!pbFwd)} label="PB FWD" />
            <line x1="60" y1="100" x2="60" y2="140" stroke={wire(pbFwd)} className={wireClass(pbFwd)} strokeWidth="2.5" />
            <NCContact x={45} y={140} open={relayRevEnergized} active={pbFwd && !relayRevEnergized} label={`${m.relayRev} NC`} />
            <line x1="60" y1="170" x2="60" y2="210" stroke={wire(pbFwd && !relayRevEnergized)} className={wireClass(pbFwd && !relayRevEnergized)} strokeWidth="2.5" />
            <NCContact x={45} y={210} open={limitFwd} active={pbFwd && !relayRevEnergized && !limitFwd} label="Limit FWD" />
            <line x1="60" y1="240" x2="60" y2="280" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <RelayCoil x={30} y={280} energized={relayFwdEnergized} label={m.relayFwd} sublabel={m.fwd} />
            <line x1="60" y1="340" x2="60" y2="390" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />

            {/* REVERSE/DOWN/RIGHT BRANCH */}
            <text x="260" y="60" fill="#a78bfa" fontSize="11" fontWeight="bold">{m.rev}</text>
            <line x1="260" y1="35" x2="260" y2="70" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2.5" />
            <PushButton x={245} y={70} active={pbRev} onClick={() => setPbRev(!pbRev)} label="PB REV" />
            <line x1="260" y1="100" x2="260" y2="140" stroke={wire(pbRev)} className={wireClass(pbRev)} strokeWidth="2.5" />
            <NCContact x={245} y={140} open={relayFwdEnergized} active={pbRev && !relayFwdEnergized} label={`${m.relayFwd} NC`} />
            <line x1="260" y1="170" x2="260" y2="210" stroke={wire(pbRev && !relayFwdEnergized)} className={wireClass(pbRev && !relayFwdEnergized)} strokeWidth="2.5" />
            <NCContact x={245} y={210} open={limitRev} active={pbRev && !relayFwdEnergized && !limitRev} label="Limit REV" />
            <line x1="260" y1="240" x2="260" y2="280" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <RelayCoil x={230} y={280} energized={relayRevEnergized} label={m.relayRev} sublabel={m.rev} />
            <line x1="260" y1="340" x2="260" y2="390" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />

            {/* OUTPUT TO CONTACTOR COILS */}
            <text x="450" y="60" fill="var(--color-safe)" fontSize="11" fontWeight="bold">CONTACTOR COILS</text>
            <line x1="120" y1="310" x2="430" y2="310" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <NOContact x={400} y={295} closed={relayFwdEnergized} label={`${m.relayFwd} NO`} />
            <line x1="430" y1="310" x2="460" y2="310" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <line x1="460" y1="310" x2="460" y2="35" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />
            <ContactorCoil x={440} y={150} energized={relayFwdEnergized} label={`Contactor\n${m.fwd}`} />
            <line x1="460" y1="240" x2="460" y2="310" stroke={wire(relayFwdEnergized)} className={wireClass(relayFwdEnergized)} strokeWidth="2.5" />

            <line x1="260" y1="340" x2="540" y2="340" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <NOContact x={510} y={325} closed={relayRevEnergized} label={`${m.relayRev} NO`} />
            <line x1="540" y1="340" x2="580" y2="340" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <line x1="580" y1="340" x2="580" y2="390" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
            <ContactorCoil x={560} y={200} energized={relayRevEnergized} label={`Contactor\n${m.rev}`} />
            <line x1="580" y1="35" x2="580" y2="200" stroke={wire(relayRevEnergized)} className={wireClass(relayRevEnergized)} strokeWidth="2.5" />
          </svg>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="font-display text-amber font-semibold mb-3">Simulate Limit Switches</h3>
            <Toggle checked={limitFwd} onChange={setLimitFwd} label={`Trigger ${m.fwd} limit switch`} description="Opens the NC contact" />
            <Toggle checked={limitRev} onChange={setLimitRev} label={`Trigger ${m.rev} limit switch`} description="Opens the NC contact" />
            <Button variant="secondary" className="w-full mt-3" onClick={reset}>Reset All</Button>
          </Card>

          <Card>
            <h3 className="font-display text-amber font-semibold mb-3">Live Status</h3>
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
              Press both PB FWD and PB REV — notice only the first one activates. The other relay's NC contact
              opens, blocking the second relay. This is the interlock pattern used on real crane panels.
            </p>
          </div>

          <FormulaExplainer title="Why is this interlock wired this way?" explanation={INTERLOCK_EXPLANATION} />
        </div>
      </div>
    </div>
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
