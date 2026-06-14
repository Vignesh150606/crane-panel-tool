import { useState } from 'react'

const MOTIONS = {
  LT: { label: 'Long Travel', fwd: 'FORWARD', rev: 'REVERSE', relayFwd: 'R1', relayRev: 'R2' },
  CT: { label: 'Cross Travel', fwd: 'LEFT', rev: 'RIGHT', relayFwd: 'R3', relayRev: 'R4' },
  HOIST: { label: 'Hoist', fwd: 'UP', rev: 'DOWN', relayFwd: 'R5', relayRev: 'R6' },
}

export default function ControlCircuit() {
  const [motion, setMotion] = useState('LT')
  const [pbFwd, setPbFwd] = useState(false)
  const [pbRev, setPbRev] = useState(false)
  const [limitFwd, setLimitFwd] = useState(false)
  const [limitRev, setLimitRev] = useState(false)

  const m = MOTIONS[motion]

  // Relay energization logic with interlock
  const relayFwdEnergized = pbFwd && !limitFwd && !relayRevEnergizedCheck()
  const relayRevEnergized = pbRev && !limitRev && !relayFwdEnergizedCheck()

  function relayRevEnergizedCheck() {
    return pbRev && !limitRev
  }
  function relayFwdEnergizedCheck() {
    return pbFwd && !limitFwd
  }

  const reset = () => { setPbFwd(false); setPbRev(false); setLimitFwd(false); setLimitRev(false) }

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔄 Control Circuit Visualizer</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Real relay interlock circuit from EOT crane panel. Press push buttons to see relay energization and NO/NC contact states in real time.
      </p>

      {/* Motion selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {Object.entries(MOTIONS).map(([key, mo]) => (
          <button key={key} onClick={() => { setMotion(key); reset() }}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '0.375rem',
              border: '2px solid', borderColor: motion === key ? '#f59e0b' : '#2d3f50',
              backgroundColor: motion === key ? '#f59e0b' : 'transparent',
              color: motion === key ? 'black' : '#94a3b8',
              cursor: 'pointer', fontWeight: '600'
            }}>
            {mo.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>

        {/* Circuit Diagram */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <svg width="100%" viewBox="0 0 700 420" style={{ fontFamily: 'monospace' }}>

            {/* Supply rails */}
            <text x="10" y="20" fill="#94a3b8" fontSize="11">110V AC (from control transformer)</text>
            <line x1="20" y1="35" x2="680" y2="35" stroke="#eab308" strokeWidth="3" />
            <text x="10" y="405" fill="#94a3b8" fontSize="11">0V (Neutral / Common Return)</text>
            <line x1="20" y1="390" x2="680" y2="390" stroke="#64748b" strokeWidth="3" />

            {/* ─────── FORWARD/UP/LEFT BRANCH ─────── */}
            <text x="60" y="60" fill="#3b82f6" fontSize="11" fontWeight="bold">{m.fwd}</text>
            {/* Vertical from top rail */}
            <line x1="60" y1="35" x2="60" y2="70" stroke={pbFwd ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* Push Button FWD */}
            <PushButton x={45} y={70} active={pbFwd} onClick={() => setPbFwd(!pbFwd)} label="PB FWD" />
            <line x1="60" y1="100" x2="60" y2="140" stroke={pbFwd ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* NC contact of REV relay (interlock) */}
            <NCContact x={45} y={140} open={relayRevEnergized} active={pbFwd && !relayRevEnergized}
              label={`${m.relayRev} NC`} />
            <line x1="60" y1="170" x2="60" y2="210" stroke={(pbFwd && !relayRevEnergized) ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* Limit switch FWD (NC) */}
            <NCContact x={45} y={210} open={limitFwd} active={pbFwd && !relayRevEnergized && !limitFwd}
              label="Limit FWD" />
            <line x1="60" y1="240" x2="60" y2="280" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* Relay coil FWD */}
            <RelayCoil x={30} y={280} energized={relayFwdEnergized} label={m.relayFwd} sublabel={m.fwd} />
            <line x1="60" y1="340" x2="60" y2="390" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* ─────── REVERSE/DOWN/RIGHT BRANCH ─────── */}
            <text x="260" y="60" fill="#8b5cf6" fontSize="11" fontWeight="bold">{m.rev}</text>
            <line x1="260" y1="35" x2="260" y2="70" stroke={pbRev ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            <PushButton x={245} y={70} active={pbRev} onClick={() => setPbRev(!pbRev)} label="PB REV" />
            <line x1="260" y1="100" x2="260" y2="140" stroke={pbRev ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            <NCContact x={245} y={140} open={relayFwdEnergized} active={pbRev && !relayFwdEnergized}
              label={`${m.relayFwd} NC`} />
            <line x1="260" y1="170" x2="260" y2="210" stroke={(pbRev && !relayFwdEnergized) ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            <NCContact x={245} y={210} open={limitRev} active={pbRev && !relayFwdEnergized && !limitRev}
              label="Limit REV" />
            <line x1="260" y1="240" x2="260" y2="280" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            <RelayCoil x={230} y={280} energized={relayRevEnergized} label={m.relayRev} sublabel={m.rev} />
            <line x1="260" y1="340" x2="260" y2="390" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* ─────── OUTPUT TO CONTACTOR COILS (NO contacts) ─────── */}
            <text x="450" y="60" fill="#22c55e" fontSize="11" fontWeight="bold">CONTACTOR COILS</text>

            {/* FWD relay NO -> contactor */}
            <line x1="60" y1="280" x2="60" y2="120" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
            <line x1="120" y1="310" x2="430" y2="310" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <NOContact x={400} y={295} closed={relayFwdEnergized} label={`${m.relayFwd} NO`} />
            <line x1="430" y1="310" x2="460" y2="310" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <line x1="460" y1="310" x2="460" y2="35" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <ContactorCoil x={440} y={150} energized={relayFwdEnergized} label={`Contactor\n${m.fwd}`} />
            <line x1="460" y1="240" x2="460" y2="310" stroke={relayFwdEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

            {/* REV relay NO -> contactor */}
            <line x1="260" y1="340" x2="540" y2="340" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <NOContact x={510} y={325} closed={relayRevEnergized} label={`${m.relayRev} NO`} />
            <line x1="540" y1="340" x2="580" y2="340" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <line x1="580" y1="340" x2="580" y2="390" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
            <ContactorCoil x={560} y={200} energized={relayRevEnergized} label={`Contactor\n${m.rev}`} />
            <line x1="580" y1="35" x2="580" y2="200" stroke={relayRevEnergized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />

          </svg>
        </div>

        {/* Controls + status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Simulate Limit Switches</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={limitFwd} onChange={e => setLimitFwd(e.target.checked)} />
              Trigger {m.fwd} limit switch (opens NC)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={limitRev} onChange={e => setLimitRev(e.target.checked)} />
              Trigger {m.rev} limit switch (opens NC)
            </label>
            <button onClick={reset} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', backgroundColor: '#2d3f50', border: 'none', borderRadius: '0.375rem', color: '#94a3b8', cursor: 'pointer' }}>
              Reset All
            </button>
          </div>

          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '0.75rem' }}>Live Status</h3>
            <StatusRow label={`Relay ${m.relayFwd} (${m.fwd})`} active={relayFwdEnergized} />
            <StatusRow label={`Relay ${m.relayRev} (${m.rev})`} active={relayRevEnergized} />
            <StatusRow label={`Contactor ${m.fwd}`} active={relayFwdEnergized} />
            <StatusRow label={`Contactor ${m.rev}`} active={relayRevEnergized} />
          </div>

          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>🎨 Color Legend</div>
            {[
              { color: '#22c55e', label: 'Energized / Current flowing' },
              { color: '#2d3f50', label: 'De-energized / No current' },
              { color: '#ef4444', label: 'Contact open (blocking)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <div style={{ width: '20px', height: '4px', backgroundColor: item.color }} />
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>💡 Try This</div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.6' }}>
              Press both PB FWD and PB REV — notice only the first one activates. The other's relay NC contact opens, blocking the second relay. This is the interlock you wired at Nian Drives.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SVG Sub-components ──────────────────────────────────────
function PushButton({ x, y, active, onClick, label }) {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={x + 15} cy={y + 15} r="14" fill={active ? '#22c55e44' : '#0f1923'} stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2" />
      <circle cx={x + 15} cy={y + 15} r="7" fill={active ? '#22c55e' : '#2d3f50'} />
      <text x={x + 15} y={y + 38} textAnchor="middle" fill={active ? '#22c55e' : '#64748b'} fontSize="8">{label}</text>
    </g>
  )
}

function NCContact({ x, y, open, active, label }) {
  // NC: closed by default (de-energized = closed = current flows)
  const isClosed = !open
  return (
    <g>
      <rect x={x} y={y} width="30" height="30" fill="none" />
      <line x1={x + 15} y1={y} x2={x + 15} y2={y + 8} stroke={active ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
      <line x1={x + 15} y1={y + 22} x2={x + 15} y2={y + 30} stroke={active ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
      {isClosed ? (
        <line x1={x + 15} y1={y + 8} x2={x + 15} y2={y + 22} stroke={active ? '#22c55e' : '#64748b'} strokeWidth="2.5" />
      ) : (
        <line x1={x + 15} y1={y + 8} x2={x + 24} y2={y + 16} stroke="#ef4444" strokeWidth="2.5" />
      )}
      <text x={x + 32} y={y + 12} fill={isClosed ? '#64748b' : '#ef4444'} fontSize="8">{label}</text>
      <text x={x + 32} y={y + 22} fill={isClosed ? '#22c55e' : '#ef4444'} fontSize="8">{isClosed ? 'CLOSED' : 'OPEN'}</text>
    </g>
  )
}

function NOContact({ x, y, closed, label }) {
  return (
    <g>
      <line x1={x} y1={y + 15} x2={x + 8} y2={y + 15} stroke={closed ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
      <line x1={x + 22} y1={y + 15} x2={x + 30} y2={y + 15} stroke={closed ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
      {closed ? (
        <line x1={x + 8} y1={y + 15} x2={x + 22} y2={y + 15} stroke="#22c55e" strokeWidth="2.5" />
      ) : (
        <line x1={x + 8} y1={y + 15} x2={x + 18} y2={y + 5} stroke="#64748b" strokeWidth="2.5" />
      )}
      <text x={x - 5} y={y - 5} fill={closed ? '#22c55e' : '#64748b'} fontSize="8">{label}</text>
    </g>
  )
}

function RelayCoil({ x, y, energized, label, sublabel }) {
  return (
    <g>
      <rect x={x} y={y} width="60" height="60" rx="6"
        fill={energized ? '#f59e0b33' : '#0f1923'}
        stroke={energized ? '#f59e0b' : '#2d3f50'} strokeWidth="2.5" />
      <text x={x + 30} y={y + 25} textAnchor="middle" fill={energized ? '#f59e0b' : '#64748b'} fontSize="14" fontWeight="bold">{label}</text>
      <text x={x + 30} y={y + 40} textAnchor="middle" fill={energized ? '#f59e0b' : '#64748b'} fontSize="8">{sublabel}</text>
      <text x={x + 30} y={y + 52} textAnchor="middle" fill={energized ? '#22c55e' : '#2d3f50'} fontSize="8">{energized ? 'ENERGIZED' : 'OFF'}</text>
    </g>
  )
}

function ContactorCoil({ x, y, energized, label }) {
  const lines = label.split('\n')
  return (
    <g>
      <rect x={x} y={y} width="60" height="60" rx="6"
        fill={energized ? '#22c55e33' : '#0f1923'}
        stroke={energized ? '#22c55e' : '#2d3f50'} strokeWidth="2.5" />
      <text x={x + 30} y={y + 22} textAnchor="middle" fill={energized ? '#22c55e' : '#64748b'} fontSize="9" fontWeight="bold">{lines[0]}</text>
      <text x={x + 30} y={y + 34} textAnchor="middle" fill={energized ? '#22c55e' : '#64748b'} fontSize="9" fontWeight="bold">{lines[1]}</text>
      <text x={x + 30} y={y + 50} textAnchor="middle" fill={energized ? '#22c55e' : '#2d3f50'} fontSize="8">{energized ? 'ON' : 'OFF'}</text>
    </g>
  )
}

function StatusRow({ label, active }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{label}</span>
      <span style={{
        color: active ? '#22c55e' : '#64748b',
        fontWeight: '600', fontSize: '0.75rem',
        padding: '0.15rem 0.6rem', borderRadius: '1rem',
        backgroundColor: active ? '#22c55e22' : '#2d3f5044'
      }}>
        {active ? '● ON' : '○ OFF'}
      </span>
    </div>
  )
}