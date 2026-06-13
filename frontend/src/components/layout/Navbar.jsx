import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/cranes', label: 'Crane Selector' },
  { path: '/calculator', label: 'Load Calculator' },
  { path: '/simulator', label: 'Panel Simulator' },
  { path: '/power-circuit', label: 'Power Circuit' },
  { path: '/bom', label: 'BOM Generator' },
  { path: '/nameplate', label: 'Nameplate Calc' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-industrial-panel border-b border-industrial-steel">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-industrial-accent font-bold text-xl">⚙</span>
            <span className="text-white font-bold text-lg">CranePanel Pro</span>
          </Link>
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                  location.pathname === item.path
                    ? 'bg-industrial-accent text-black font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-industrial-steel'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}