import { Link, useLocation } from 'react-router-dom'


const navItems = [
  { path: '/', label: 'Home' },
  { path: '/cranes', label: 'Cranes' },
  { path: '/calculator', label: 'Load Calc' },
  { path: '/simulator', label: 'Panel Sim' },
  { path: '/control-circuit', label: 'Control Circuit' },
  { path: '/power-circuit', label: 'Power Circuit' },
  { path: '/star-delta', label: 'Star-Delta' },
  { path: '/cable-busbar', label: 'Cable/Busbar' },
  { path: '/panel-layout', label: 'Panel Layout' },
  { path: '/fault-diagnosis', label: 'Fault Diagnosis' },
  { path: '/bom', label: 'BOM' },
  { path: '/nameplate', label: 'Nameplate' },
]


export default function Navbar() {
  const location = useLocation()

  return (
    <nav style={{
      backgroundColor: '#1a2632',
      borderBottom: '1px solid #2d3f50',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{ color: '#f59e0b', fontSize: '1.5rem' }}>⚙</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>CranePanel Pro</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                backgroundColor: location.pathname === item.path ? '#f59e0b' : 'transparent',
                color: location.pathname === item.path ? 'black' : '#94a3b8',
                fontWeight: location.pathname === item.path ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}