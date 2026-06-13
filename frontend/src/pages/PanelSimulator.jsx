import { useState } from 'react'

const MOTIONS = {
  LT: { label: 'Long Travel', fwd: 'FORWARD', rev: 'REVERSE', color: '#3b82f6' },
  CT: { label: 'Cross Travel', fwd: 'LEFT', rev: 'RIGHT', color: '#8b5cf6' },
  HOIST: { label: 'Hoist', fwd: 'UP', rev: 'DOWN', color: '#f59e0b' }
}

export default function PanelSimulator() {
  const [active, setActive] = useState({ LT: null, CT: null, HOIST: null })
  const [log, setLog] = useState([])
  const [showRelay, setShowRelay] = useState(true)

  const activate = (motion, dir) => {
    setActive(prev => {
      const newState = { ...prev }
      if (prev[motion] === dir) {
        newState[motion] = null
        addLog(`${MOTIONS[motion].label} ${dir} — DEACTIVATED`)
      } else {
        newState[motion] = dir
        addLog(`${MOTIONS[motion].label} ${dir} — ACTIVATED (interlock blocks opposing direction)`)
      }
      return newState
    })
  }

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString()
    setLog(prev => [`[${time}] ${msg}`, ...prev.slice(0, 9)])
  }

  const eStop = () => {
    setActive({ LT: null, CT: null, HOIST: null })
    addLog('⚠ EMERGENCY STOP — All motions halted')
  }

  const anyActive = Object.values(active).some(v => v !== null)

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🎛️ Panel Simulator</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Live control panel with relay interlocking logic. Only one direction per motion can be active at a time.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Control Panel */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '2px solid #2d3f50' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#f59e0b', fontWeight: '600' }}>Control Panel</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: anyActive ? '#22c55e' : '#2d3f50', boxShadow: anyActive ? '0 0 8px #22c55e' : 'none' }} />
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{anyActive ? 'RUNNING' : 'STANDBY'}</span>
            </div>
          </div>

          {/* E-Stop */}
          <button
            onClick={eStop}
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', padding: '1rem', borderRadius: '0.5rem', border: '3px solid #dc2626', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '1.5rem', letterSpacing: '0.1em' }}
          >
            ⛔ EMERGENCY STOP
          </button>

          {/* Motion Controls */}
          {Object.entries(MOTIONS).map(([key, motion]) => (
            <div key={key} style={{ marginBottom: '1.25rem', backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${active[key] ? motion.color : '#2d3f50'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{motion.label}</span>
                <span style={{ color: active[key] ? '#22c55e' : '#64748b', fontSize: '0.75rem', fontWeight: '600' }}>
                  {active[key] || 'STOPPED'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[motion.fwd, motion.rev].map(dir => (
                  <button
                    key={dir}
                    onClick={() => activate(key, dir)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '0.375rem',
                      border: '2px solid',
                      borderColor: active[key] === dir ? motion.color : '#2d3f50',
                      backgroundColor: active[key] === dir ? motion.color + '33' : 'transparent',
                      color: active[key] === dir ? motion.color : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setShowRelay(!showRelay)}
              style={{ flex: 1, padding: '0.5rem', backgroundColor: '#2d3f50', border: 'none', borderRadius: '0.375rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {showRelay ? 'Hide' : 'Show'} Relay Diagram
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Relay Diagram */}
          {showRelay && (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
              <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Relay Interlock Diagram</h3>
              {Object.entries(MOTIONS).map(([key, motion]) => (
                <RelayDiagram key={key} motionKey={key} motion={motion} activeDir={active[key]} />
              ))}
            </div>
          )}

          {/* Activity Log */}
          <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Activity Log</h3>
            {log.length === 0 ? (
              <p style={{ color: '#2d3f50', fontSize: '0.8rem' }}>No activity yet. Press buttons above.</p>
            ) : (
              log.map((entry, i) => (
                <div key={i} style={{ color: i === 0 ? '#22c55e' : '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                  {entry}
                </div>
              ))
            )}
          </div>

          {/* Interlock explanation */}
          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📚 Interlock Logic</div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.6' }}>
              The NC contact of the Forward relay is wired in series with the Reverse relay coil.
              If Forward is energised, its NC opens → Reverse cannot energise.
              This prevents short circuit from simultaneous phase reversal.
            </p>
            <div style={{ marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#22c55e' }}>
              <div>FWD Coil ——[REV NC]—— Supply</div>
              <div>REV Coil ——[FWD NC]—— Supply</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelayDiagram({ motionKey, motion, activeDir }) {
  const fwdActive = activeDir === motion.fwd
  const revActive = activeDir === motion.rev

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: '600' }}>{motion.label}</div>
      <svg width="100%" height="60" viewBox="0 0 320 60">
        {/* Forward relay coil */}
        <rect x="5" y="15" width="60" height="25" rx="4"
          fill={fwdActive ? motion.color + '44' : '#0f1923'}
          stroke={fwdActive ? motion.color : '#2d3f50'} strokeWidth="2" />
        <text x="35" y="31" textAnchor="middle" fill={fwdActive ? motion.color : '#64748b'} fontSize="9" fontWeight="bold">
          {motion.fwd}
        </text>
        <text x="35" y="42" textAnchor="middle" fill={fwdActive ? '#22c55e' : '#2d3f50'} fontSize="8">
          {fwdActive ? 'ENERGISED' : 'OFF'}
        </text>

        {/* NC contact of FWD in REV circuit */}
        <line x1="65" y1="27" x2="100" y2="27" stroke={revActive ? '#ef4444' : '#2d3f50'} strokeWidth="2" />
        <text x="110" y="20" textAnchor="middle" fill={fwdActive ? '#ef4444' : '#22c55e'} fontSize="9">
          {fwdActive ? 'NC OPEN' : 'NC CLOSED'}
        </text>
        <rect x="90" y="22" width="40" height="10" rx="2"
          fill={fwdActive ? '#ef444433' : '#22c55e33'}
          stroke={fwdActive ? '#ef4444' : '#22c55e'} strokeWidth="1.5" />

        {/* Line to REV coil */}
        <line x1="130" y1="27" x2="180" y2="27" stroke={revActive ? motion.color : '#2d3f50'} strokeWidth="2" />

        {/* Reverse relay coil */}
        <rect x="180" y="15" width="60" height="25" rx="4"
          fill={revActive ? motion.color + '44' : '#0f1923'}
          stroke={revActive ? motion.color : '#2d3f50'} strokeWidth="2" />
        <text x="210" y="31" textAnchor="middle" fill={revActive ? motion.color : '#64748b'} fontSize="9" fontWeight="bold">
          {motion.rev}
        </text>
        <text x="210" y="42" textAnchor="middle" fill={revActive ? '#22c55e' : '#2d3f50'} fontSize="8">
          {revActive ? 'ENERGISED' : 'OFF'}
        </text>

        {/* NC contact of REV in FWD circuit */}
        <line x1="240" y1="27" x2="275" y2="27" stroke={fwdActive ? '#ef4444' : '#2d3f50'} strokeWidth="2" />
        <rect x="255" y="22" width="40" height="10" rx="2"
          fill={revActive ? '#ef444433' : '#22c55e33'}
          stroke={revActive ? '#ef4444' : '#22c55e'} strokeWidth="1.5" />
        <text x="275" y="20" textAnchor="middle" fill={revActive ? '#ef4444' : '#22c55e'} fontSize="9">
          {revActive ? 'NC OPEN' : 'NC CLOSED'}
        </text>
      </svg>
    </div>
  )
}