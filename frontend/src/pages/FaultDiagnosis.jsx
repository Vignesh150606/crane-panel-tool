import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, ScanSearch, Settings2, Wrench, Lightbulb } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import FormulaExplainer from '../components/ui/FormulaExplainer'

const FAULTS = [
  {
    id: 'phase_loss',
    title: 'Single Phasing',
    symptoms: ["Motor hums but doesn't rotate", 'SPP trips immediately', 'Increased current on remaining phases'],
    cause: 'One of the three supply phases (R/Y/B) has lost continuity — blown fuse, loose connection, or cable damage.',
    diagnosis: 'SPP (Single Phase Preventer) detects the imbalance and opens its output contact, de-energizing the main contactor coil.',
    fix: 'Check incoming supply at MCB terminals with a multimeter on each phase. Identify the missing phase, check the upstream fuse/breaker and cable continuity.',
    component: 'SPP',
    interviewTip: "Why can't the motor's own overload relay always catch this fast enough on its own? Total current can look close to normal while the two remaining phases each carry roughly double the per-phase load — a thermal element watching total current doesn't see that imbalance directly, which is exactly why a dedicated phase-loss device exists instead of relying on the overload relay alone.",
  },
  {
    id: 'overload_trip',
    title: 'Overload Relay Trip',
    symptoms: ['Motor stops suddenly during operation', 'Overload relay trip flag visible', 'Motor casing hot to touch'],
    cause: 'Motor drawing current above the overload relay setting for an extended period — mechanical jam, excessive load, or voltage imbalance.',
    diagnosis: 'Thermal overload relay bimetallic strip heats up and trips its NC contact in the contactor coil circuit, de-energizing the contactor.',
    fix: 'Check for mechanical obstruction on crane motion. Verify overload setting matches motor FLC (should be ~105% of FLC). Allow cooldown before reset.',
    component: 'Overload Relay',
    interviewTip: 'A candidate who immediately resets and re-runs the motor without checking for a mechanical jam first hasn\'t actually fixed anything — the relay tripped for a reason, and resetting clears the symptom, not the cause. This is the fault most likely to repeat within minutes if skipped.',
  },
  {
    id: 'limit_stuck',
    title: 'Limit Switch Stuck (Open)',
    symptoms: ["One direction of motion doesn't work", 'Opposite direction works fine', 'No fault indication on panel'],
    cause: 'Limit switch roller mechanically stuck in pressed position, or wiring to limit switch broken (open circuit on NC contact).',
    diagnosis: 'The stuck-open NC contact permanently breaks the relay coil circuit for that direction, so the relay never energizes regardless of push button.',
    fix: 'Inspect limit switch roller for mechanical binding/debris. Check continuity of NC contact with a multimeter — should read 0Ω when not triggered.',
    component: 'Limit Switch',
    interviewTip: '"No fault indication on panel" is the diagnostic giveaway here — electrically, a stuck-open limit switch looks identical to nobody pressing the button at all. Symptom #2 (the opposite direction still works fine) is what actually separates this from "the push button itself is broken."',
  },
  {
    id: 'contactor_chatter',
    title: 'Contactor Chattering',
    symptoms: ['Buzzing/chattering sound from contactor', 'Motor starts and stops rapidly', 'Visible arcing at contacts'],
    cause: 'Low control voltage (110V coil supply dropping), worn contactor coil, or loose connection to coil terminal A1/A2.',
    diagnosis: 'Insufficient holding force on the contactor armature causes it to partially release and re-energize repeatedly — a chattering cycle.',
    fix: 'Measure voltage at contactor coil terminals during operation. Check control transformer secondary voltage (should be 110V ±5%). Tighten coil terminal connections.',
    component: 'Contactor',
    interviewTip: 'If chattering only happens under load (not at rest), suspect the control transformer secondary sagging under load rather than the contactor coil itself — check what else shares that 110V rail, since a marginal transformer can be "just adequate" until something else draws current on the same secondary at the same moment.',
  },
  {
    id: 'both_directions',
    title: 'Both Directions Active (Interlock Failure)',
    symptoms: ['Both Forward and Reverse contactors energize together', 'Tripping of main MCB or fuse blow', 'Possible motor winding damage'],
    cause: 'NC interlock contact wiring missing, miswired as NO, or relay contact welded closed due to a previous overload.',
    diagnosis: 'Without a proper interlock, both directional contactors can close simultaneously, creating a phase-to-phase short circuit through the motor.',
    fix: 'CRITICAL — de-energize immediately. Verify NC contact wiring between the relay pair (e.g. R1-R2). Check for welded/stuck relay contacts and replace if found.',
    component: 'Interlock Relay',
    interviewTip: "This is the fault almost every crane-panel interview eventually asks about — it's the one failure mode here that can destroy a motor and panel in under a second, not minutes. See the Control Circuit page's explanation of why swapping two phases (not three) is what makes this specific failure a direct phase-to-phase short, not just a wiring inconvenience.",
  },
]

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
