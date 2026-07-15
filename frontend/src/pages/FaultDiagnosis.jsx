import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, ScanSearch, Settings2, Wrench, Lightbulb, Gamepad2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import { FAULTS } from '../data/faultLibrary'

const DIAGNOSTIC_METHOD_EXPLANATION = {
  formula: 'Localize before you replace: test at the boundary between "working" and "not working," not at the component you first suspect.',
  variables: [
    { symbol: 'V(open contact)', name: 'Voltage measured across an open (non-conducting) contact, circuit energized', value: 'full line/control voltage', unit: 'V' },
    { symbol: 'V(closed contact)', name: 'Voltage measured across a closed (conducting) contact, circuit energized', value: '≈0', unit: 'V' },
  ],
  substitution: 'Probe across each device in the control circuit, one at a time, from the supply toward the coil. The device with full voltage across it, while every device before it reads ~0V, is the open point.',
  result: 'This finds the exact open contact in one pass instead of guessing which of five possible devices (E-Stop, overload NC, limit NC, interlock NC, coil) is the culprit.',
  reasoning:
    'This page\'s five fault scenarios all look different in symptom but are diagnosed the same underlying way: a relay-logic control circuit is a chain of series contacts feeding a coil, and exactly one thing is ever true — either a contact that should be closed is open, or a contact that should be open is closed. Rather than guessing which device (E-Stop, overload, limit switch, interlock relay) is at fault, an energized voltage-drop test finds it directly: with the circuit powered and the relevant push button held, probe across each device in sequence from supply to coil. Every closed contact reads ~0V across its terminals (current flows straight through). The instant you reach the open point, that device shows full control voltage across it — everything after it in the chain reads 0V because no current is flowing at all past that point. This localizes the fault to one device without opening a single connection or guessing based on symptom pattern-matching alone.',
  standard: 'Standard electrical troubleshooting practice (voltage-drop/potential testing) — not tied to a specific IEC clause.',
  common_mistakes: [
    'Testing for continuity (resistance) on a live circuit instead of voltage — always de-energize before a continuity/ohmmeter check, never probe resistance on an energized control circuit.',
    'Assuming the symptom points straight at one component (e.g. "chattering = bad contactor") without actually testing — several different faults can produce very similar symptoms, which is the whole reason a systematic test beats a guess.',
  ],
}

export default function FaultDiagnosis() {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState({})

  const fault = FAULTS.find((f) => f.id === selected)
  const reveal = (key) => setRevealed((prev) => ({ ...prev, [key]: true }))

  return (
    <div>
      <PageHeader
        icon={Search}
        title="Fault Diagnosis Simulator"
        description="Common crane panel faults. Click a fault to see symptoms, then reveal the cause, diagnosis logic, and fix one step at a time."
        actions={<Button as={Link} to="/challenge-mode" variant="outline" size="sm" icon={Gamepad2}>Try it live in Challenge Mode</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="flex flex-col gap-2">
          {FAULTS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setSelected(f.id); setRevealed({}) }}
              className={`text-left px-4 py-3 rounded-lg border-2 font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2
                ${selected === f.id ? 'border-amber bg-surface text-amber' : 'border-steel text-text-muted hover:border-steel-light'}`}
            >
              <AlertTriangle size={14} className="shrink-0" /> {f.title}
            </button>
          ))}
        </div>

        <div>
          {!fault ? (
            <EmptyState icon={Search} title="Select a fault scenario to begin diagnosis" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={fault.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                <Card variant="danger" padding="lg">
                  <h2 className="text-danger font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} /> {fault.title}
                  </h2>
                  <div className="text-text-muted font-semibold text-sm mb-2">Observed Symptoms:</div>
                  {fault.symptoms.map((s, i) => (
                    <div key={i} className="text-text text-sm mb-1 pl-4">• {s}</div>
                  ))}
                </Card>

                <RevealCard title="Likely Cause" icon={ScanSearch} content={fault.cause} revealed={revealed.cause} onReveal={() => reveal('cause')} tone="info" />
                <RevealCard title="Diagnosis Logic" icon={Settings2} content={fault.diagnosis} revealed={revealed.diagnosis} onReveal={() => reveal('diagnosis')} tone="caution" />
                <RevealCard title="Recommended Fix" icon={Wrench} content={fault.fix} revealed={revealed.fix} onReveal={() => reveal('fix')} tone="safe" />

                <Card variant="inset">
                  <span className="text-amber text-sm font-semibold">Faulty Component: </span>
                  <span className="text-text text-sm">{fault.component}</span>
                </Card>

                {revealed.fix && (
                  <Card style={{ borderColor: 'var(--color-amber)' }}>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber">
                      <Lightbulb size={16} /> Interview Insight
                    </h3>
                    <p className="text-text text-sm leading-relaxed">{fault.interviewTip}</p>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="mt-5">
        <FormulaExplainer title="How do you localize a fault like this without guessing?" explanation={DIAGNOSTIC_METHOD_EXPLANATION} />
      </div>
    </div>
  )
}

const TONE_STYLES = {
  info: { border: '#4c9fe8', text: 'text-info', bg: 'bg-info-dim', btnBorder: 'border-info' },
  caution: { border: '#f5a623', text: 'text-amber', bg: 'bg-caution-dim', btnBorder: 'border-amber' },
  safe: { border: '#3fb950', text: 'text-safe', bg: 'bg-safe-dim', btnBorder: 'border-safe' },
}

function RevealCard({ title, icon: Icon, content, revealed, onReveal, tone }) {
  const t = TONE_STYLES[tone]
  return (
    <Card style={{ borderColor: t.border }} padding="lg">
      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${t.text}`}>
        <Icon size={16} /> {title}
      </h3>
      <AnimatePresence mode="wait">
        {revealed ? (
          <motion.p key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text text-sm leading-relaxed">
            {content}
          </motion.p>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={onReveal}
            className={`px-4 py-2 rounded-md border text-sm cursor-pointer ${t.bg} ${t.btnBorder} ${t.text}`}
          >
            Click to reveal
          </motion.button>
        )}
      </AnimatePresence>
    </Card>
  )
}
