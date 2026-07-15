import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Play, Square, X, Ruler, LayoutPanelTop, Gamepad2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormulaExplainer from '../components/ui/FormulaExplainer'

const PROTECTION_LAYERS_EXPLANATION = {
  formula: 'MCB (incomer) → SPP (phase-loss) → MPCB (per-motor) — three devices, three different failure modes, deliberately not combined into one.',
  variables: [
    { symbol: 'MCB', name: 'Main Circuit Breaker — whole-panel short-circuit/overcurrent protection', value: 'upstream', unit: '' },
    { symbol: 'SPP', name: 'Single Phase Preventer — trips on phase loss or reversal, before it reaches any motor', value: 'mid-stream', unit: '' },
    { symbol: 'MPCB', name: 'Motor Protection Circuit Breaker — one per motion, sized to that motor\'s own FLC', value: 'per-branch', unit: '' },
  ],
  substitution: 'A fault on the Hoist motor should trip the Hoist MPCB only — Long Travel and Cross Travel keep running. That selectivity is the entire reason these are three separate devices instead of one big breaker.',
  result: 'Three failure modes, each caught by the device actually designed for it, without any one motor\'s fault taking down the whole panel.',
  reasoning:
    'A single upstream breaker can\'t do all three jobs well. Short-circuit protection (MCB) needs to be fast and needs a high enough rating to carry the sum of every motor starting simultaneously without nuisance-tripping. Single-phasing protection (SPP) is a completely different failure mode: if one incoming phase is lost (a blown fuse upstream, a loose terminal), a running 3-phase motor doesn\'t just get weaker — the remaining two phases have to carry the full load between them, drawing roughly double the normal current in each, and a plain thermal overload relay is often too slow to catch this before winding insulation cooks. An SPP watches phase balance directly and trips fast, before that damage happens — a plain MCB has no way to detect this at all, since total current can look almost normal from outside. And per-motor overload protection (MPCB) has to be sized to that specific motor\'s FLC and startup characteristic (a motor draws 6-8x FLC for a few seconds at start — a device sized for cable protection would trip on every start), which is exactly why crane panels use one MPCB per motion instead of relying on the main MCB\'s thermal curve for everything downstream.',
  standard: 'General motor circuit protection practice per IEC 60947-2 (circuit breakers) and IEC 60947-4-1 (motor starters/overload relays) — device selection principle, not a specific clause citation.',
  common_mistakes: [
    'Assuming the overload relay will catch single-phasing fast enough — often it won\'t, before winding damage, which is exactly why a dedicated SPP exists.',
    'Sizing the main MCB below what all branch MPCBs could draw simultaneously at motor startup, causing nuisance trips on multi-motion operation.',
  ],
}

const PHASE_REVERSAL_EXPLANATION = {
  formula: 'Swap any two of the three phase connections at the motor terminals → the rotating stator field reverses direction → the rotor (and load) reverses.',
  variables: [
    { symbol: 'R, Y, B', name: 'The three incoming phase conductors', value: 'fixed sequence', unit: '' },
    { symbol: 'Forward', name: 'Contactor wires R→R, Y→Y, B→B to the motor', value: 'R-Y-B', unit: 'sequence' },
    { symbol: 'Reverse', name: 'Contactor swaps two lines, e.g. R→R, Y→B, B→Y', value: 'R-B-Y', unit: 'sequence' },
  ],
  substitution: 'Only 2 of the 3 phase leads are ever physically swapped between the Forward and Reverse contactors — the third runs straight through unchanged.',
  result: 'That\'s why a reversing contactor pair only needs to cross-wire two of the three motor leads, not rebuild all three.',
  reasoning:
    'A 3-phase induction motor\'s rotor follows a rotating magnetic field set up by the stator windings, and the direction that field rotates is set entirely by the order the three phases arrive in — R-Y-B rotates one way, R-B-Y rotates the other. Swapping any two of the three lines flips that sequence and reverses the field (and therefore the rotor) — swapping all three does nothing, since the relative sequence R→Y→B→R is unchanged, just relabeled, which is a genuinely common beginner mistake on first wiring a reversing starter. This is also exactly why the electrical interlock on the Control Circuit page matters so much here: if the Forward and Reverse contactors ever closed at the same instant, those two swapped lines would be shorted directly line-to-line through both contactors — a bolted phase-to-phase fault, not just a wiring error.',
  standard: 'General 3-phase induction motor operating principle (rotating magnetic field) — not tied to a specific IEC clause.',
  common_mistakes: [
    'Swapping all three phase leads instead of two — direction doesn\'t change, only the labeling does.',
    'Treating electrical interlocking on the Control Circuit page as optional because "the buttons won\'t both be pressed" — see the reasoning above for exactly what happens if they are.',
  ],
}

const COMPONENTS = [
  { id: 'mcb', label: 'Main MCB', desc: 'Main Circuit Breaker — first protection point from incoming 3-phase supply', color: '#3b82f6', icon: '⊡' },
  { id: 'spp', label: 'SPP', desc: 'Single Phase Preventer — monitors phase balance, disconnects on phase loss/reversal', color: '#8b5cf6', icon: '⊞' },
  { id: 'mpcb_h', label: 'MPCB Hoist', desc: 'Motor Protection CB for Hoist — sized at motor FLC, protects against overload', color: '#f5a623', icon: '⊟' },
  { id: 'cont_h', label: 'Contactor H', desc: 'Hoist contactors (Up/Down pair) — rated 2x FLC for crane-duty AC-3 reversing, controlled by relay circuit', color: '#f0453d', icon: '⊗' },
  { id: 'motor_h', label: 'Hoist Motor', desc: 'Hoist motor — lifts and lowers load. Phase reversal changes direction.', color: '#3fb950', icon: 'M' },
  { id: 'mpcb_lt', label: 'MPCB LT', desc: 'Motor Protection CB for Long Travel motor', color: '#f5a623', icon: '⊟' },
  { id: 'cont_lt', label: 'Contactor LT', desc: 'LT contactors (Fwd/Rev pair) — phase swap reverses motor direction', color: '#f0453d', icon: '⊗' },
  { id: 'motor_lt', label: 'LT Motor', desc: 'Long Travel motor — moves crane bridge along runway', color: '#3fb950', icon: 'M' },
  { id: 'mpcb_ct', label: 'MPCB CT', desc: 'Motor Protection CB for Cross Travel motor', color: '#f5a623', icon: '⊟' },
  { id: 'cont_ct', label: 'Contactor CT', desc: 'CT contactors (Left/Right pair)', color: '#f0453d', icon: '⊗' },
  { id: 'motor_ct', label: 'CT Motor', desc: 'Cross Travel motor — moves crab across bridge', color: '#3fb950', icon: 'M' },
]

export default function PowerCircuit() {
  const [highlighted, setHighlighted] = useState(null)
  const [animated, setAnimated] = useState(false)

  const comp = highlighted ? COMPONENTS.find((c) => c.id === highlighted) : null
  const lineColor = animated ? 'var(--color-safe)' : 'var(--color-steel)'
  const lineClass = animated ? 'wire-flow' : ''

  return (
    <div>
      <PageHeader
        icon={Zap}
        title="Power Circuit Visualizer"
        description="Visualize the complete power circuit from 3-phase supply to motors. Click any component for details."
        actions={
          <>
            <Button as={Link} to="/panel-explorer" variant="outline" size="sm" icon={LayoutPanelTop}>Explore the physical panel</Button>
            <Button as={Link} to="/challenge-mode" variant="outline" size="sm" icon={Gamepad2}>Diagnose faults</Button>
          </>
        }
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        <Button variant={animated ? 'primary' : 'secondary'} icon={animated ? Square : Play} onClick={() => setAnimated(!animated)}>
          {animated ? 'Stop' : 'Animate'} Current Flow
        </Button>
        <Button variant="secondary" icon={X} onClick={() => setHighlighted(null)}>Clear Selection</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <Card padding="lg" className="overflow-x-auto">
          <svg width="600" height="480" viewBox="0 0 600 480" className="font-mono min-w-[560px]">
            <text x="10" y="30" fill="var(--color-text-muted)" fontSize="11">3-Phase 415V Supply</text>
            {['R', 'Y', 'B'].map((phase, i) => (
              <g key={phase}>
                <line x1="20" y1={50 + i * 12} x2="80" y2={50 + i * 12} stroke={['#ef4444', '#eab308', '#3b82f6'][i]} strokeWidth="3" />
                <text x="8" y={54 + i * 12} fill={['#ef4444', '#eab308', '#3b82f6'][i]} fontSize="10" fontWeight="bold">{phase}</text>
              </g>
            ))}

            <PowerComponent x={80} y={35} w={60} h={45} id="mcb" label="MCB" icon="⊡" highlighted={highlighted} onHover={setHighlighted} color="#3b82f6" />
            <line x1="140" y1="57" x2="160" y2="57" stroke={lineColor} className={lineClass} strokeWidth="3" />

            <PowerComponent x={160} y={35} w={60} h={45} id="spp" label="SPP" icon="⊞" highlighted={highlighted} onHover={setHighlighted} color="#8b5cf6" />
            <line x1="220" y1="57" x2="240" y2="57" stroke={lineColor} className={lineClass} strokeWidth="3" />

            <line x1="240" y1="57" x2="240" y2="400" stroke={lineColor} className={lineClass} strokeWidth="2" />

            <BranchRow y={100} label="HOIST" highlighted={highlighted} onHover={setHighlighted} lineColor={lineColor} lineClass={lineClass} mpcbId="mpcb_h" contId="cont_h" motorId="motor_h" />
            <BranchRow y={240} label="LONG TRAVEL" highlighted={highlighted} onHover={setHighlighted} lineColor={lineColor} lineClass={lineClass} mpcbId="mpcb_lt" contId="cont_lt" motorId="motor_lt" />
            <BranchRow y={370} label="CROSS TRAVEL" highlighted={highlighted} onHover={setHighlighted} lineColor={lineColor} lineClass={lineClass} mpcbId="mpcb_ct" contId="cont_ct" motorId="motor_ct" />
          </svg>
        </Card>

        <div className="flex flex-col gap-4">
          {comp ? (
            <Card style={{ borderColor: comp.color, borderWidth: 2 }}>
              <div className="text-3xl mb-2 text-center">{comp.icon}</div>
              <h3 className="font-bold text-center mb-3" style={{ color: comp.color }}>{comp.label}</h3>
              <p className="text-text text-sm leading-relaxed">{comp.desc}</p>
            </Card>
          ) : (
            <Card className="text-center">
              <p className="text-text-dim text-sm">Click any component to see details</p>
            </Card>
          )}

          <Card>
            <h4 className="text-amber font-semibold text-sm mb-3">Circuit Flow</h4>
            {[
              { label: 'MCB', desc: 'Main protection', color: '#3b82f6' },
              { label: 'SPP', desc: 'Phase protection', color: '#8b5cf6' },
              { label: 'MPCB', desc: 'Motor protection', color: '#f5a623' },
              { label: 'Contactor', desc: 'Direction switch', color: '#f0453d' },
              { label: 'Motor', desc: 'Load drive', color: '#3fb950' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold min-w-[70px]" style={{ color: item.color }}>{item.label}</span>
                <span className="text-text-dim text-xs">{item.desc}</span>
              </div>
            ))}
          </Card>

          <Card variant="inset">
            <div className="flex items-center gap-1.5 text-amber font-semibold text-xs mb-2">
              <Ruler size={13} /> Wiring Rule
            </div>
            <p className="text-text-dim text-xs leading-relaxed">
              Power and control wiring routed through separate cable ducts.
              100mm gap between ducts, 75mm between contactors — panel-builder
              practice, not a value calculated by this tool. See Panel Layout
              for the full caveat on where these figures come from.
              Phase reversal at reverse contactor output.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <FormulaExplainer title="Why three separate protection devices instead of one?" explanation={PROTECTION_LAYERS_EXPLANATION} />
        <FormulaExplainer title="Why do contactors only swap 2 of 3 phases to reverse a motor?" explanation={PHASE_REVERSAL_EXPLANATION} />
      </div>
    </div>
  )
}

function PowerComponent({ x, y, w, h, id, label, icon, highlighted, onHover, color }) {
  const isHighlighted = highlighted === id
  return (
    <g
      onClick={() => onHover(id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHover(id) } }}
      role="button"
      tabIndex={0}
      aria-pressed={isHighlighted}
      aria-label={`${label}, show details`}
      style={{ cursor: 'pointer' }}
      className={isHighlighted ? 'animate-pulse' : ''}
    >
      <rect x={x} y={y} width={w} height={h} rx="6"
        fill={isHighlighted ? `${color}33` : 'var(--color-inset)'}
        stroke={isHighlighted ? color : 'var(--color-steel)'} strokeWidth={isHighlighted ? 2.5 : 1.5} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fill={isHighlighted ? color : 'var(--color-text-muted)'} fontSize="14">{icon}</text>
      <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fill={isHighlighted ? color : 'var(--color-text-dim)'} fontSize="9" fontWeight="bold">{label}</text>
    </g>
  )
}

function BranchRow({ y, label, highlighted, onHover, lineColor, lineClass, mpcbId, contId, motorId }) {
  return (
    <g>
      <text x="248" y={y - 5} fill="var(--color-text-muted)" fontSize="10">{label}</text>
      <line x1="240" y1={y + 22} x2="270" y2={y + 22} stroke={lineColor} className={lineClass} strokeWidth="2" />
      <PowerComponent x={270} y={y} w={70} h={45} id={mpcbId} label="MPCB" icon="⊟" highlighted={highlighted} onHover={onHover} color="#f5a623" />
      <line x1="340" y1={y + 22} x2="360" y2={y + 22} stroke={lineColor} className={lineClass} strokeWidth="2" />
      <PowerComponent x={360} y={y} w={80} h={45} id={contId} label="CONTACTOR" icon="⊗" highlighted={highlighted} onHover={onHover} color="#f0453d" />
      <line x1="440" y1={y + 22} x2="460" y2={y + 22} stroke={lineColor} className={lineClass} strokeWidth="2" />
      <PowerComponent x={460} y={y} w={70} h={45} id={motorId} label="MOTOR" icon="M" highlighted={highlighted} onHover={onHover} color="#3fb950" />
    </g>
  )
}
