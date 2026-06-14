const COMPONENTS = [
  { id: 'mcb', label: 'Main MCB', x: 20, y: 20, w: 60, h: 50, color: '#3b82f6' },
  { id: 'spp', label: 'SPP', x: 90, y: 20, w: 60, h: 50, color: '#8b5cf6' },
  { id: 'transformer', label: 'Control\nTransformer', x: 160, y: 20, w: 70, h: 50, color: '#64748b' },
  { id: 'mpcb1', label: 'MPCB\nHoist', x: 20, y: 90, w: 55, h: 45, color: '#f59e0b' },
  { id: 'mpcb2', label: 'MPCB\nLT', x: 85, y: 90, w: 55, h: 45, color: '#f59e0b' },
  { id: 'mpcb3', label: 'MPCB\nCT', x: 150, y: 90, w: 55, h: 45, color: '#f59e0b' },
  { id: 'cont1', label: 'Cont.\nUp', x: 20, y: 155, w: 50, h: 40, color: '#ef4444' },
  { id: 'cont2', label: 'Cont.\nDown', x: 75, y: 155, w: 50, h: 40, color: '#ef4444' },
  { id: 'cont3', label: 'Cont.\nFwd', x: 130, y: 155, w: 50, h: 40, color: '#ef4444' },
  { id: 'cont4', label: 'Cont.\nRev', x: 185, y: 155, w: 50, h: 40, color: '#ef4444' },
  { id: 'relays', label: '8-pin Relays\n(R1-R6)', x: 20, y: 215, w: 110, h: 45, color: '#22c55e' },
  { id: 'overload', label: 'Overload\nRelays', x: 135, y: 215, w: 70, h: 45, color: '#eab308' },
  { id: 'terminal', label: 'Terminal Blocks', x: 20, y: 280, w: 215, h: 35, color: '#94a3b8' },
]

export default function PanelLayout() {
  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>📐 Panel Layout Visualizer</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>2D component placement following DIN rail mounting standards from real panel assembly.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <svg width="100%" viewBox="0 0 280 340" style={{ fontFamily: 'monospace' }}>
            {/* Panel enclosure */}
            <rect x="5" y="5" width="270" height="330" fill="#0f1923" stroke="#2d3f50" strokeWidth="3" rx="4" />
            <text x="140" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="10">Panel Enclosure (Front View)</text>

            {/* DIN Rails (horizontal lines) */}
            {[15, 85, 150, 210, 275].map((y, i) => (
              <line key={i} x1="15" y1={y} x2="265" y2={y} stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
            ))}
            <text x="270" y="18" fill="#64748b" fontSize="7" writingMode="vertical-rl">DIN Rail</text>

            {/* Components */}
            {COMPONENTS.map(c => (
              <g key={c.id}>
                <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.color + '33'} stroke={c.color} strokeWidth="1.5" rx="3" />
                {c.label.split('\n').map((line, i) => (
                  <text key={i} x={c.x + c.w/2} y={c.y + c.h/2 + (i - (c.label.split('\n').length-1)/2) * 11 + 3}
                    textAnchor="middle" fill={c.color} fontSize="8" fontWeight="600">{line}</text>
                ))}
              </g>
            ))}

            {/* Cable ducts */}
            <rect x="240" y="90" width="8" height="220" fill="#2d3f50" stroke="#64748b" strokeWidth="1" />
            <text x="244" y="85" textAnchor="middle" fill="#64748b" fontSize="7">Duct</text>

            {/* Cable glands at bottom */}
            <text x="140" y="325" textAnchor="middle" fill="#94a3b8" fontSize="8">Cable Glands (IP55) →</text>
            {[40, 80, 120, 160, 200, 240].map(x => (
              <circle key={x} cx={x} cy="335" r="4" fill="#64748b" stroke="#94a3b8" />
            ))}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '0.75rem' }}>Mounting Standards</h3>
            {[
              { label: 'Cable duct gap', value: '100 mm' },
              { label: 'Contactor-to-contactor gap', value: '75 mm' },
              { label: 'Cable gland rating', value: 'IP55' },
              { label: 'Rail type', value: '35mm DIN' },
              { label: 'Wire separation', value: 'Power / Control ducts separate' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>{item.label}</span>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📋 Assembly Sequence</div>
            <ol style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.8', paddingLeft: '1.2rem' }}>
              <li>Drill & tap mounting holes</li>
              <li>Mount DIN rails (top to bottom: MCB row, MPCB row, contactor row, relay row, terminals)</li>
              <li>Mount components on rails</li>
              <li>Route power wiring (separate duct)</li>
              <li>Route control wiring (separate duct)</li>
              <li>Fit cable glands at bottom</li>
              <li>Continuity check + functional test</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}