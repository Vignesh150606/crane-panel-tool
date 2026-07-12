import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Octagon, BookOpen } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormulaExplainer from '../components/ui/FormulaExplainer'

const MOTIONS = {
  LT: { label: 'Long Travel', fwd: 'FORWARD', rev: 'REVERSE', color: '#3b82f6' },
  CT: { label: 'Cross Travel', fwd: 'LEFT', rev: 'RIGHT', color: '#a78bfa' },
  HOIST: { label: 'Hoist', fwd: 'UP', rev: 'DOWN', color: '#f5a623' },
}

const CROSS_MOTION_EXPLANATION = {
  formula: 'Interlock only applies WITHIN a motion, never ACROSS motions: Hoist UP + Long Travel FORWARD together is normal crane operation; Hoist UP + Hoist DOWN together is a short circuit.',
  variables: [
    { symbol: 'Same motion', name: 'FWD and REV contactors for one motor — share the same motor terminals', value: 'must interlock', unit: '' },
    { symbol: 'Different motions', name: 'Hoist, LT, CT — each has its own motor, own contactors, own power branch', value: 'independent', unit: '' },
  ],
  substitution: 'Try it above: activate Hoist UP, then Long Travel FORWARD, then Cross Travel LEFT — all three run together with no block. Now try Hoist UP then Hoist DOWN — the second one is blocked.',
  result: 'Three independent motions running together isn\'t a bug being allowed through — it\'s the whole point. Only same-motor opposing directions are dangerous.',
  reasoning:
    'It\'s easy to assume "interlocking" means the panel should stop you from running more than one thing at once — but that\'s not what an EOT crane does, and it isn\'t what this panel models. A crane routinely travels the bridge, traverses the trolley, and hoists or lowers the load all at the same time; that\'s normal operation, not a fault condition. Go back to the Power Circuit page: Hoist, Long Travel, and Cross Travel each have their own motor, own MPCB, own contactor pair, and their own branch off the shared supply. Nothing about running one motion has any electrical relationship to another motion — they don\'t share terminals, so there\'s no way for them to short against each other. The ONLY dangerous combination is two contactors that share the same motor terminals trying to feed it opposite phase sequences simultaneously — and that only happens between the Forward and Reverse contactor of the same motion. That\'s why the interlock wiring shown below is per-motion, not a single global "only one thing at a time" lockout.',
  standard: 'General crane control architecture — each motion is an independently protected branch circuit (see Power Circuit page); not a specific IEC clause.',
  common_mistakes: [
    'Assuming a panel that lets you run Hoist and Travel together is missing an interlock — it isn\'t; that\'s intentional and normal.',
    'Confusing an operational restriction (some crane duty cycles/PLCs deliberately limit simultaneous hoist+travel for load-swing safety) with an electrical necessity — the panel doesn\'t need to stop this for wiring-safety reasons, though a site may choose to for handling-safety reasons.',
  ],
}

export default function PanelSimulator() {
  const [active, setActive] = useState({ LT: null, CT: null, HOIST: null })
  const [log, setLog] = useState([])
  const [showRelay, setShowRelay] = useState(true)

  const activate = (m, dir) => {
    setActive((prev) => {
      if (prev[m] === dir) {
        addLog(`${MOTIONS[m].label} ${dir} — DEACTIVATED`)
        return { ...prev, [m]: null }
      }
      if (prev[m] !== null) {
        // Real hardware: the energised relay's NC contact is already open in the
        // opposing coil's circuit, so the opposing button physically cannot pull
        // its contactor in. It must be de-energised (or E-Stopped) first.
        addLog(`${MOTIONS[m].label} ${dir} — BLOCKED (interlock: ${prev[m]} still energised, stop it first)`)
        return prev
      }
      addLog(`${MOTIONS[m].label} ${dir} — ACTIVATED (interlock blocks opposing direction)`)
      return { ...prev, [m]: dir }
    })
  }

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString()
    setLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 9)])
  }

  const eStop = () => {
    setActive({ LT: null, CT: null, HOIST: null })
    addLog('EMERGENCY STOP — All motions halted')
  }

  const anyActive = Object.values(active).some((v) => v !== null)

  return (
    <div>
      <PageHeader
        icon={Gamepad2}
        title="Panel Simulator"
        description="Live control panel with relay interlocking logic. Only one direction per motion can be active at a time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-amber font-semibold">Control Panel</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${anyActive ? 'bg-safe' : 'bg-steel'}`} style={anyActive ? { boxShadow: '0 0 8px var(--color-safe)' } : {}} />
              <span className="text-text-dim text-xs">{anyActive ? 'RUNNING' : 'STANDBY'}</span>
            </div>
          </div>

          <button
            onClick={eStop}
            className="w-full bg-danger text-white py-4 rounded-lg border-[3px] font-black text-lg cursor-pointer mb-6 tracking-widest hover:brightness-110 transition-all"
            style={{ borderColor: '#dc2626' }}
          >
            <Octagon size={18} className="inline mr-2 -mt-1" /> EMERGENCY STOP
          </button>

          {Object.entries(MOTIONS).map(([key, m]) => (
            <div
              key={key}
              className="mb-4 bg-inset rounded-xl p-4 border transition-colors"
              style={{ borderColor: active[key] ? m.color : 'var(--color-steel)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-text font-semibold text-sm">{m.label}</span>
                <span className={`text-xs font-semibold ${active[key] ? 'text-safe' : 'text-text-dim'}`}>
                  {active[key] || 'STOPPED'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[m.fwd, m.rev].map((dir) => (
                  <motion.button
                    key={dir}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => activate(key, dir)}
                    className="py-2.5 rounded-md border-2 font-semibold text-sm cursor-pointer transition-colors"
                    style={{
                      borderColor: active[key] === dir ? m.color : 'var(--color-steel)',
                      backgroundColor: active[key] === dir ? `${m.color}33` : 'transparent',
                      color: active[key] === dir ? m.color : 'var(--color-text-muted)',
                    }}
                  >
                    {dir}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          <Button variant="secondary" className="w-full" onClick={() => setShowRelay(!showRelay)}>
            {showRelay ? 'Hide' : 'Show'} Relay Diagram
          </Button>
        </Card>

        <div className="flex flex-col gap-4">
          {showRelay && (
            <Card padding="lg">
              <h3 className="font-display text-amber font-semibold mb-4">Relay Interlock Diagram</h3>
              {Object.entries(MOTIONS).map(([key, m]) => (
                <RelayDiagram key={key} motion={m} activeDir={active[key]} />
              ))}
            </Card>
          )}

          <Card padding="lg">
            <h3 className="font-display text-amber font-semibold mb-3">Activity Log</h3>
            {log.length === 0 ? (
              <p className="text-text-dim text-sm">No activity yet. Press buttons above.</p>
            ) : (
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <div key={i} className={`text-xs font-mono ${i === 0 ? 'text-safe' : 'text-text-dim'}`}>{entry}</div>
                ))}
              </div>
            )}
          </Card>

          <Card variant="inset">
            <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2">
              <BookOpen size={14} /> Interlock Logic
            </div>
            <p className="text-text-dim text-sm leading-relaxed">
              The NC contact of the Forward relay is wired in series with the Reverse relay coil.
              If Forward is energised, its NC opens, so Reverse cannot energise.
              This prevents a short circuit from simultaneous phase reversal.
            </p>
            <div className="mt-3 font-mono text-xs text-safe leading-relaxed">
              <div>FWD Coil ——[REV NC]—— Supply</div>
              <div>REV Coil ——[FWD NC]—— Supply</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <FormulaExplainer title="Why can Hoist, Long Travel and Cross Travel all run together, but FWD/REV can't?" explanation={CROSS_MOTION_EXPLANATION} />
      </div>
    </div>
  )
}

function RelayDiagram({ motion, activeDir }) {
  const fwdActive = activeDir === motion.fwd
  const revActive = activeDir === motion.rev

  return (
    <div className="mb-4">
      <div className="text-text-muted text-xs mb-1.5 font-semibold">{motion.label}</div>
      <svg width="100%" height="60" viewBox="0 0 320 60">
        <g className={fwdActive ? 'animate-pulse' : ''}>
          <rect x="5" y="15" width="60" height="25" rx="4" fill={fwdActive ? `${motion.color}44` : 'var(--color-inset)'} stroke={fwdActive ? motion.color : 'var(--color-steel)'} strokeWidth="2" />
          <text x="35" y="31" textAnchor="middle" fill={fwdActive ? motion.color : 'var(--color-text-muted)'} fontSize="9" fontWeight="bold">{motion.fwd}</text>
          <text x="35" y="42" textAnchor="middle" fill={fwdActive ? 'var(--color-safe)' : 'var(--color-steel)'} fontSize="8">{fwdActive ? 'ENERGISED' : 'OFF'}</text>
        </g>

        <line x1="65" y1="27" x2="100" y2="27" stroke={revActive ? 'var(--color-danger)' : 'var(--color-steel)'} strokeWidth="2" />
        <text x="110" y="20" textAnchor="middle" fill={fwdActive ? 'var(--color-danger)' : 'var(--color-safe)'} fontSize="9">{fwdActive ? 'NC OPEN' : 'NC CLOSED'}</text>
        <rect x="90" y="22" width="40" height="10" rx="2" fill={fwdActive ? 'color-mix(in srgb, var(--color-danger) 20%, transparent)' : 'color-mix(in srgb, var(--color-safe) 20%, transparent)'} stroke={fwdActive ? 'var(--color-danger)' : 'var(--color-safe)'} strokeWidth="1.5" />

        <line x1="130" y1="27" x2="180" y2="27" stroke={revActive ? motion.color : 'var(--color-steel)'} strokeWidth="2" />

        <g className={revActive ? 'animate-pulse' : ''}>
          <rect x="180" y="15" width="60" height="25" rx="4" fill={revActive ? `${motion.color}44` : 'var(--color-inset)'} stroke={revActive ? motion.color : 'var(--color-steel)'} strokeWidth="2" />
          <text x="210" y="31" textAnchor="middle" fill={revActive ? motion.color : 'var(--color-text-muted)'} fontSize="9" fontWeight="bold">{motion.rev}</text>
          <text x="210" y="42" textAnchor="middle" fill={revActive ? 'var(--color-safe)' : 'var(--color-steel)'} fontSize="8">{revActive ? 'ENERGISED' : 'OFF'}</text>
        </g>

        <line x1="240" y1="27" x2="275" y2="27" stroke={fwdActive ? 'var(--color-danger)' : 'var(--color-steel)'} strokeWidth="2" />
        <rect x="255" y="22" width="40" height="10" rx="2" fill={revActive ? 'color-mix(in srgb, var(--color-danger) 20%, transparent)' : 'color-mix(in srgb, var(--color-safe) 20%, transparent)'} stroke={revActive ? 'var(--color-danger)' : 'var(--color-safe)'} strokeWidth="1.5" />
        <text x="275" y="20" textAnchor="middle" fill={revActive ? 'var(--color-danger)' : 'var(--color-safe)'} fontSize="9">{revActive ? 'NC OPEN' : 'NC CLOSED'}</text>
      </svg>
    </div>
  )
}
