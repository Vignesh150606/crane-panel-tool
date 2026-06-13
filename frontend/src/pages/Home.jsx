import { Link } from 'react-router-dom'

const features = [
  {
    path: '/cranes',
    icon: '🏗️',
    title: 'Crane Selector',
    desc: 'Compare EOT, Gantry, Jib and more. View specs, applications and diagrams.'
  },
  {
    path: '/calculator',
    icon: '⚡',
    title: 'Load Calculator',
    desc: 'Enter load in tons — get motor HP, contactor ratings, MPCB sizing, cable size.'
  },
  {
    path: '/simulator',
    icon: '🎛️',
    title: 'Panel Simulator',
    desc: 'Live control panel with NO/NC contacts, interlock logic for CT, LT, Hoist.'
  },
  {
    path: '/power-circuit',
    icon: '🔌',
    title: 'Power Circuit',
    desc: 'Animated MCB → SPP → MPCB → Contactor → Motor power flow diagram.'
  },
  {
    path: '/bom',
    icon: '📋',
    title: 'BOM Generator',
    desc: 'Auto-generate complete bill of materials with part numbers and ratings.'
  },
  {
    path: '/nameplate',
    icon: '🔧',
    title: 'Nameplate Calculator',
    desc: 'Enter motor nameplate values — get contactor rating, MPCB setting, overload relay.'
  },
]

export default function Home() {
  return (
    <div style={{ width: '100%' }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
          EOT Crane Control Panel{' '}
          <span style={{ color: '#f59e0b' }}>Design Tool</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
          A complete engineering tool for designing, simulating and validating
          industrial crane control panels. Built on real industrial experience
          from EOT crane panel assembly at Nian Drives and Controls.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/cranes"
            style={{
              backgroundColor: '#f59e0b',
              color: 'black',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Select Crane Type
          </Link>
          <Link
            to="/simulator"
            style={{
              border: '2px solid #f59e0b',
              color: '#f59e0b',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Open Panel Simulator
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {features.map(feature => (
          <Link
            key={feature.path}
            to={feature.path}
            style={{
              backgroundColor: '#1a2632',
              border: '1px solid #2d3f50',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textDecoration: 'none',
              display: 'block',
              transition: 'border-color 0.2s, transform 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#f59e0b'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#2d3f50'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
            <h3 style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {feature.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {feature.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        border: '1px solid #2d3f50',
        borderRadius: '0.75rem',
        padding: '1rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Built with engineering data from real EOT crane panel assembly •
          Relay interlock logic based on industrial standards •
          Component ratings follow IS/IEC standards
        </p>
      </div>

    </div>
  )
}