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
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚙️</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          EOT Crane Control Panel
          <span className="text-industrial-accent"> Design Tool</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          A complete engineering tool for designing, simulating and validating
          industrial crane control panels. Built on real industrial experience
          from EOT crane panel assembly at Nian Drives and Controls.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/cranes"
            className="bg-industrial-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Select Crane Type
          </Link>
          <Link
            to="/simulator"
            className="border border-industrial-accent text-industrial-accent px-6 py-3 rounded-lg font-semibold hover:bg-industrial-accent hover:text-black transition-colors"
          >
            Open Panel Simulator
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
        {features.map(feature => (
          <Link
            key={feature.path}
            to={feature.path}
            className="bg-industrial-panel border border-industrial-steel rounded-xl p-6 hover:border-industrial-accent transition-colors group"
          >
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-industrial-accent transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm">{feature.desc}</p>
          </Link>
        ))}
      </div>

      {/* Tech note */}
      <div className="border border-industrial-steel rounded-xl p-6 mb-8 text-center">
        <p className="text-gray-400 text-sm">
          Built with engineering data from real EOT crane panel assembly •
          Relay interlock logic based on industrial standards •
          Component ratings follow IS/IEC standards
        </p>
      </div>
    </div>
  )
}