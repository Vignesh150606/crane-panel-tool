import { useState } from 'react'
import { CRANE_TYPES, DUTY_CLASSES } from '../data/craneData'
import CraneDiagram from '../components/CraneDiagram'

const categories = ['All', 'EOT', 'Gantry', 'Jib', 'Special']

export default function CraneSelector() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('grid') // grid or compare

  const cranes = Object.values(CRANE_TYPES)
  const filtered = filter === 'All' ? cranes : cranes.filter(c => c.category === filter)
  const selectedCrane = selected ? CRANE_TYPES[selected] : null

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🏗️ Crane Type Selector
        </h1>
        <p style={{ color: '#64748b' }}>
          Select a crane type to view specifications, applications, SVG diagram, and component requirements.
        </p>
      </div>

      {/* Filter + View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '2rem',
                border: '1px solid',
                borderColor: filter === cat ? '#f59e0b' : '#2d3f50',
                backgroundColor: filter === cat ? '#f59e0b' : 'transparent',
                color: filter === cat ? 'black' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: filter === cat ? '600' : '400',
                fontSize: '0.875rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['grid', 'compare'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '0.375rem',
                border: '1px solid',
                borderColor: view === v ? '#f59e0b' : '#2d3f50',
                backgroundColor: view === v ? '#1a2632' : 'transparent',
                color: view === v ? '#f59e0b' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {v === 'grid' ? '⊞ Grid' : '⇌ Compare'}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(crane => (
            <div
              key={crane.id}
              onClick={() => setSelected(crane.id === selected ? null : crane.id)}
              style={{
                backgroundColor: '#1a2632',
                border: `2px solid ${selected === crane.id ? '#f59e0b' : '#2d3f50'}`,
                borderRadius: '0.75rem',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (selected !== crane.id) e.currentTarget.style.borderColor = '#64748b' }}
              onMouseLeave={e => { if (selected !== crane.id) e.currentTarget.style.borderColor = '#2d3f50' }}
            >
              {/* SVG Diagram */}
              <div style={{ backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '0.5rem', marginBottom: '0.75rem' }}>
                <CraneDiagram craneId={crane.id} width={260} height={140} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{crane.name}</h3>
                <span style={{
                  backgroundColor: '#0f1923',
                  color: '#f59e0b',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem'
                }}>
                  {crane.category}
                </span>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                {crane.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ backgroundColor: '#0f1923', padding: '0.4rem', borderRadius: '0.375rem' }}>
                  <div style={{ color: '#64748b' }}>Capacity</div>
                  <div style={{ color: '#f59e0b', fontWeight: '600' }}>{crane.capacityRange}</div>
                </div>
                <div style={{ backgroundColor: '#0f1923', padding: '0.4rem', borderRadius: '0.375rem' }}>
                  <div style={{ color: '#64748b' }}>Span</div>
                  <div style={{ color: '#f59e0b', fontWeight: '600' }}>{crane.spanRange}</div>
                </div>
              </div>

              {selected === crane.id && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #2d3f50' }}>
                  <div style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                    ✓ Selected — Full specs below
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <CompareTable cranes={filtered} />
      )}

      {/* Detail Panel */}
      {selectedCrane && (
        <DetailPanel crane={selectedCrane} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function DetailPanel({ crane, onClose }) {
  return (
    <div style={{
      marginTop: '2rem',
      backgroundColor: '#1a2632',
      border: '2px solid #f59e0b',
      borderRadius: '1rem',
      padding: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold' }}>{crane.fullName}</h2>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>{crane.description}</p>
        </div>
        <button
          onClick={onClose}
          style={{ color: '#64748b', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Left: Diagram + specs */}
        <div>
          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <CraneDiagram craneId={crane.id} width={280} height={180} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Capacity Range', value: crane.capacityRange },
              { label: 'Span Range', value: crane.spanRange },
              { label: 'Max Capacity', value: `${crane.specs.maxCapacity}T` },
              { label: 'Duty Class', value: crane.specs.typicalDutyClass },
              { label: 'Girders', value: crane.specs.girders },
              { label: 'Hoist Position', value: crane.specs.hoistPosition },
            ].map(item => (
              <div key={item.label} style={{ backgroundColor: '#0f1923', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Applications, Motions, Duty classes */}
        <div>
          <Section title="🏭 Applications">
            {crane.applications.map(app => (
              <div key={app} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{app}</span>
              </div>
            ))}
          </Section>

          <Section title="⚙️ Operating Motions">
            {crane.motions.map(motion => (
              <div key={motion} style={{
                backgroundColor: '#0f1923',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                marginBottom: '0.4rem',
                color: '#f59e0b',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {motion}
              </div>
            ))}
          </Section>

          <Section title="📊 Duty Class Guide">
            {['M3', 'M4', 'M5'].map(dc => (
              <div key={dc} style={{ marginBottom: '0.4rem' }}>
                <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.8rem' }}>{dc}: </span>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{DUTY_CLASSES[dc]}</span>
              </div>
            ))}
          </Section>

          <div style={{
            backgroundColor: '#0f1923',
            border: '1px solid #22c55e',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginTop: '1rem'
          }}>
            <div style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              💡 Engineering Note
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.5' }}>
              Each motion (LT, CT, Hoist) requires a dedicated pair of contactors with interlock logic
              to prevent simultaneous energisation of opposing directions.
              Contactor rating = 3× motor full load current (IS standard).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h4 style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.6rem' }}>{title}</h4>
      {children}
    </div>
  )
}

function CompareTable({ cranes }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#1a2632' }}>
            <th style={th}>Specification</th>
            {cranes.map(c => (
              <th key={c.id} style={{ ...th, color: '#f59e0b' }}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Category', key: 'category' },
            { label: 'Capacity Range', key: 'capacityRange' },
            { label: 'Span Range', key: 'spanRange' },
            { label: 'Max Capacity', fn: c => `${c.specs.maxCapacity}T` },
            { label: 'Girders', fn: c => c.specs.girders },
            { label: 'Duty Class', fn: c => c.specs.typicalDutyClass },
          ].map((row, i) => (
            <tr key={row.label} style={{ backgroundColor: i % 2 === 0 ? '#0f1923' : '#1a2632' }}>
              <td style={{ ...td, color: '#94a3b8', fontWeight: '600' }}>{row.label}</td>
              {cranes.map(c => (
                <td key={c.id} style={{ ...td, color: '#e2e8f0' }}>
                  {row.fn ? row.fn(c) : c[row.key]}
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ backgroundColor: '#1a2632' }}>
            <td style={{ ...td, color: '#94a3b8', fontWeight: '600' }}>Motions</td>
            {cranes.map(c => (
              <td key={c.id} style={{ ...td, color: '#e2e8f0' }}>
                {c.motions.join(', ')}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const th = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  color: '#e2e8f0',
  borderBottom: '1px solid #2d3f50',
  whiteSpace: 'nowrap'
}

const td = {
  padding: '0.6rem 1rem',
  borderBottom: '1px solid #2d3f50',
  verticalAlign: 'top'
}