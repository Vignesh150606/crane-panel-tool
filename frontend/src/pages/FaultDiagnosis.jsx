import { useState } from 'react'

const FAULTS = [
  {
    id: 'phase_loss',
    title: 'Single Phasing',
    symptoms: ['Motor hums but doesn\'t rotate', 'SPP trips immediately', 'Increased current on remaining phases'],
    cause: 'One of the three supply phases (R/Y/B) has lost continuity — blown fuse, loose connection, or cable damage.',
    diagnosis: 'SPP (Single Phase Preventer) detects the imbalance and opens its output contact, de-energizing the main contactor coil.',
    fix: 'Check incoming supply at MCB terminals with multimeter on each phase. Identify missing phase, check upstream fuse/breaker and cable continuity.',
    component: 'SPP'
  },
  {
    id: 'overload_trip',
    title: 'Overload Relay Trip',
    symptoms: ['Motor stops suddenly during operation', 'Overload relay trip flag visible', 'Motor casing hot to touch'],
    cause: 'Motor drawing current above the overload relay setting for extended period — mechanical jam, excessive load, or voltage imbalance.',
    diagnosis: 'Thermal overload relay bimetallic strip heats up and trips its NC contact in the contactor coil circuit, de-energizing the contactor.',
    fix: 'Check for mechanical obstruction on crane motion. Verify overload setting matches motor FLC (should be ~105% of FLC). Allow cooldown before reset.',
    component: 'Overload Relay'
  },
  {
    id: 'limit_stuck',
    title: 'Limit Switch Stuck (Open)',
    symptoms: ['One direction of motion doesn\'t work', 'Opposite direction works fine', 'No fault indication on panel'],
    cause: 'Limit switch roller mechanically stuck in pressed position, or wiring to limit switch broken (open circuit on NC contact).',
    diagnosis: 'The stuck-open NC contact permanently breaks the relay coil circuit for that direction, so the relay never energizes regardless of push button.',
    fix: 'Inspect limit switch roller for mechanical binding/debris. Check continuity of NC contact with multimeter — should read 0Ω when not triggered.',
    component: 'Limit Switch'
  },
  {
    id: 'contactor_chatter',
    title: 'Contactor Chattering',
    symptoms: ['Buzzing/chattering sound from contactor', 'Motor starts and stops rapidly', 'Visible arcing at contacts'],
    cause: 'Low control voltage (110V coil supply dropping), worn contactor coil, or loose connection to coil terminal A1/A2.',
    diagnosis: 'Insufficient holding force on the contactor armature causes it to partially release and re-energize repeatedly — a chattering cycle.',
    fix: 'Measure voltage at contactor coil terminals during operation. Check control transformer secondary voltage (should be 110V ±5%). Tighten coil terminal connections.',
    component: 'Contactor'
  },
  {
    id: 'both_directions',
    title: 'Both Directions Active (Interlock Failure)',
    symptoms: ['Both Forward and Reverse contactors energize together', 'Tripping of main MCB or fuse blow', 'Possible motor winding damage'],
    cause: 'NC interlock contact wiring missing, miswired as NO, or relay contact welded closed due to previous overload.',
    diagnosis: 'Without proper interlock, both directional contactors can close simultaneously, creating a phase-to-phase short circuit through the motor.',
    fix: 'CRITICAL — De-energize immediately. Verify NC contact wiring between R1-R2 (or relevant relay pair). Check for welded/stuck relay contacts and replace if found.',
    component: 'Interlock Relay'
  },
]

export default function FaultDiagnosis() {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState({})

  const fault = FAULTS.find(f => f.id === selected)

  const reveal = (key) => setRevealed(prev => ({ ...prev, [key]: true }))

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔍 Fault Diagnosis Simulator</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Common crane panel faults. Click a fault to see symptoms, then reveal cause, diagnosis logic, and fix.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>

        {/* Fault list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {FAULTS.map(f => (
            <button key={f.id} onClick={() => { setSelected(f.id); setRevealed({}) }}
              style={{
                textAlign: 'left', padding: '1rem', borderRadius: '0.5rem',
                border: '2px solid', borderColor: selected === f.id ? '#f59e0b' : '#2d3f50',
                backgroundColor: selected === f.id ? '#1a2632' : 'transparent',
                color: selected === f.id ? '#f59e0b' : '#94a3b8',
                cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem'
              }}>
              ⚠ {f.title}
            </button>
          ))}
        </div>

        {/* Diagnosis area */}
        <div>
          {!fault ? (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '3rem', border: '1px solid #2d3f50', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <p style={{ color: '#64748b' }}>Select a fault scenario to begin diagnosis</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '2px solid #ef4444' }}>
                <h2 style={{ color: '#ef4444', fontWeight: '700', marginBottom: '0.75rem' }}>⚠ {fault.title}</h2>
                <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Observed Symptoms:</div>
                {fault.symptoms.map((s, i) => (
                  <div key={i} style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.3rem', paddingLeft: '1rem' }}>• {s}</div>
                ))}
              </div>

              <RevealCard
                title="🔎 Likely Cause"
                content={fault.cause}
                revealed={revealed.cause}
                onReveal={() => reveal('cause')}
                color="#3b82f6"
              />
              <RevealCard
                title="⚙️ Diagnosis Logic"
                content={fault.diagnosis}
                revealed={revealed.diagnosis}
                onReveal={() => reveal('diagnosis')}
                color="#8b5cf6"
              />
              <RevealCard
                title="🔧 Recommended Fix"
                content={fault.fix}
                revealed={revealed.fix}
                onReveal={() => reveal('fix')}
                color="#22c55e"
              />

              <div style={{ backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid #2d3f50' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600' }}>Faulty Component: </span>
                <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{fault.component}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RevealCard({ title, content, revealed, onReveal, color }) {
  return (
    <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: `1px solid ${color}` }}>
      <h3 style={{ color, fontWeight: '600', marginBottom: '0.75rem' }}>{title}</h3>
      {revealed ? (
        <p style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.6' }}>{content}</p>
      ) : (
        <button onClick={onReveal} style={{ padding: '0.5rem 1rem', backgroundColor: color + '22', border: `1px solid ${color}`, borderRadius: '0.375rem', color, cursor: 'pointer', fontSize: '0.8rem' }}>
          Click to reveal
        </button>
      )}
    </div>
  )
}