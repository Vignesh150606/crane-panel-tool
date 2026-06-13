// SVG diagrams for each crane type
// These are simplified technical illustrations showing the key structural difference

export default function CraneDiagram({ craneId, width = 300, height = 200 }) {
  const diagrams = {
    EOT_SINGLE: <EOTSingle width={width} height={height} />,
    EOT_DOUBLE: <EOTDouble width={width} height={height} />,
    GANTRY_SINGLE: <GantrySingle width={width} height={height} />,
    GANTRY_DOUBLE: <GantryDouble width={width} height={height} />,
    JIB_WALL: <JibWall width={width} height={height} />,
    JIB_FLOOR: <JibFloor width={width} height={height} />,
    SEMI_GANTRY: <SemiGantry width={width} height={height} />,
    MONORAIL: <Monorail width={width} height={height} />,
  }
  return diagrams[craneId] || <DefaultDiagram width={width} height={height} />
}

// ── Shared colors ──────────────────────────────────────────────
const C = {
  rail: '#64748b',
  girder: '#f59e0b',
  hoist: '#ef4444',
  support: '#94a3b8',
  ground: '#2d3f50',
  text: '#e2e8f0',
  wire: '#22c55e',
}

function EOTSingle({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      {/* Runway rails */}
      <rect x="10" y="30" width="280" height="8" fill={C.rail} rx="2" />
      <text x="150" y="22" textAnchor="middle" fill={C.text} fontSize="10">Runway Rails</text>

      {/* End trucks */}
      <rect x="10" y="38" width="30" height="20" fill={C.support} rx="2" />
      <rect x="260" y="38" width="30" height="20" fill={C.support} rx="2" />

      {/* Single girder */}
      <rect x="40" y="55" width="220" height="16" fill={C.girder} rx="3" />
      <text x="150" y="66" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">Single Girder</text>

      {/* Hoist on bottom flange */}
      <rect x="120" y="71" width="60" height="20" fill={C.hoist} rx="3" />
      <text x="150" y="85" textAnchor="middle" fill="white" fontSize="9">Hoist</text>

      {/* Hook and rope */}
      <line x1="150" y1="91" x2="150" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M140 130 Q150 145 160 130" stroke={C.wire} strokeWidth="2" fill="none" />
      <text x="150" y="155" textAnchor="middle" fill={C.text} fontSize="10">Hook</text>

      {/* Arrows for motions */}
      <text x="150" y="175" textAnchor="middle" fill={C.support} fontSize="9">
        LT ↔ CT ↔ Hoist ↕
      </text>

      {/* Labels */}
      <text x="150" y="195" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">
        EOT Single Girder
      </text>
    </svg>
  )
}

function EOTDouble({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      {/* Runway rails */}
      <rect x="10" y="30" width="280" height="8" fill={C.rail} rx="2" />
      <text x="150" y="22" textAnchor="middle" fill={C.text} fontSize="10">Runway Rails</text>

      {/* End trucks */}
      <rect x="10" y="38" width="30" height="20" fill={C.support} rx="2" />
      <rect x="260" y="38" width="30" height="20" fill={C.support} rx="2" />

      {/* Double girders */}
      <rect x="40" y="55" width="220" height="12" fill={C.girder} rx="3" />
      <rect x="40" y="72" width="220" height="12" fill={C.girder} rx="3" />
      <text x="150" y="64" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Girder 1</text>
      <text x="150" y="81" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Girder 2</text>

      {/* Hoist on top rail between girders */}
      <rect x="115" y="84" width="70" height="20" fill={C.hoist} rx="3" />
      <text x="150" y="98" textAnchor="middle" fill="white" fontSize="9">Hoist (Top)</text>

      {/* Hook */}
      <line x1="150" y1="104" x2="150" y2="140" stroke={C.wire} strokeWidth="2" />
      <path d="M140 140 Q150 155 160 140" stroke={C.wire} strokeWidth="2" fill="none" />

      <text x="150" y="170" textAnchor="middle" fill={C.support} fontSize="9">
        Higher hook height • Heavier loads
      </text>
      <text x="150" y="190" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">
        EOT Double Girder
      </text>
    </svg>
  )
}

function GantrySingle({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      {/* Ground */}
      <rect x="0" y="175" width="300" height="10" fill={C.ground} />
      <text x="150" y="195" textAnchor="middle" fill={C.support} fontSize="9">Ground Level Rails</text>

      {/* Ground rails */}
      <rect x="20" y="168" width="260" height="7" fill={C.rail} rx="1" />

      {/* Legs */}
      <rect x="30" y="80" width="16" height="88" fill={C.support} rx="2" />
      <rect x="254" y="80" width="16" height="88" fill={C.support} rx="2" />
      <text x="22" y="75" fill={C.text} fontSize="9">Leg</text>
      <text x="248" y="75" fill={C.text} fontSize="9">Leg</text>

      {/* Girder */}
      <rect x="46" y="68" width="208" height="14" fill={C.girder} rx="3" />
      <text x="150" y="79" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Single Girder</text>

      {/* Hoist */}
      <rect x="118" y="82" width="64" height="18" fill={C.hoist} rx="3" />
      <text x="150" y="95" textAnchor="middle" fill="white" fontSize="9">Hoist</text>

      {/* Hook */}
      <line x1="150" y1="100" x2="150" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M142 130 Q150 143 158 130" stroke={C.wire} strokeWidth="2" fill="none" />

      <text x="150" y="158" textAnchor="middle" fill={C.support} fontSize="9">
        Outdoor use • Ground rails
      </text>
    </svg>
  )
}

function GantryDouble({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      <rect x="0" y="175" width="300" height="10" fill={C.ground} />
      <rect x="20" y="168" width="260" height="7" fill={C.rail} rx="1" />
      <rect x="30" y="75" width="18" height="93" fill={C.support} rx="2" />
      <rect x="252" y="75" width="18" height="93" fill={C.support} rx="2" />
      <rect x="48" y="63" width="204" height="12" fill={C.girder} rx="3" />
      <rect x="48" y="78" width="204" height="12" fill={C.girder} rx="3" />
      <text x="150" y="73" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Double Girder</text>
      <rect x="115" y="90" width="70" height="18" fill={C.hoist} rx="3" />
      <text x="150" y="103" textAnchor="middle" fill="white" fontSize="9">Hoist</text>
      <line x1="150" y1="108" x2="150" y2="138" stroke={C.wire} strokeWidth="2" />
      <path d="M142 138 Q150 150 158 138" stroke={C.wire} strokeWidth="2" fill="none" />
      <text x="150" y="160" textAnchor="middle" fill={C.support} fontSize="9">Heavy duty • Port/shipyard use</text>
      <text x="150" y="178" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">Double Girder Gantry</text>
    </svg>
  )
}

function JibWall({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      {/* Wall */}
      <rect x="10" y="20" width="30" height="170" fill={C.ground} rx="2" />
      <text x="25" y="15" textAnchor="middle" fill={C.text} fontSize="9">Wall</text>

      {/* Mast bracket */}
      <rect x="40" y="60" width="15" height="15" fill={C.support} />

      {/* Jib boom */}
      <rect x="55" y="64" width="180" height="10" fill={C.girder} rx="3" />
      <text x="145" y="73" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Jib Boom</text>

      {/* Support strut */}
      <line x1="40" y1="40" x2="235" y2="64" stroke={C.support} strokeWidth="3" />

      {/* Hoist */}
      <rect x="155" y="74" width="50" height="16" fill={C.hoist} rx="3" />
      <text x="180" y="86" textAnchor="middle" fill="white" fontSize="8">Hoist</text>

      {/* Hook */}
      <line x1="180" y1="90" x2="180" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M173 130 Q180 142 187 130" stroke={C.wire} strokeWidth="2" fill="none" />

      {/* Arc indicator */}
      <path d="M55 69 Q120 20 55 69" stroke={C.wire} strokeWidth="1" fill="none" strokeDasharray="4,3" />
      <text x="150" y="160" textAnchor="middle" fill={C.support} fontSize="9">Limited arc • Wall mounted</text>
      <text x="150" y="178" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">Wall Mounted Jib</text>
    </svg>
  )
}

function JibFloor({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      <rect x="0" y="175" width="300" height="10" fill={C.ground} />
      <rect x="138" y="80" width="24" height="95" fill={C.support} rx="2" />
      <rect x="130" y="168" width="40" height="10" fill={C.rail} rx="2" />
      <text x="150" y="77" textAnchor="middle" fill={C.text} fontSize="9">Floor Pillar</text>
      <rect x="150" y="65" width="130" height="12" fill={C.girder} rx="3" />
      <text x="215" y="75" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Jib Boom</text>
      <line x1="150" y1="71" x2="280" y2="65" stroke={C.support} strokeWidth="2" />
      <rect x="220" y="77" width="50" height="16" fill={C.hoist} rx="3" />
      <text x="245" y="89" textAnchor="middle" fill="white" fontSize="8">Hoist</text>
      <line x1="245" y1="93" x2="245" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M238 130 Q245 142 252 130" stroke={C.wire} strokeWidth="2" fill="none" />
      <path d="M150 71 A80 80 0 0 1 150 71" stroke={C.wire} strokeWidth="1" fill="none" strokeDasharray="4,3" />
      <text x="150" y="155" textAnchor="middle" fill={C.support} fontSize="9">360° rotation • Floor pillar</text>
      <text x="150" y="173" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">Floor Mounted Jib</text>
    </svg>
  )
}

function SemiGantry({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      <rect x="0" y="175" width="300" height="10" fill={C.ground} />
      {/* Wall side - elevated rail */}
      <rect x="10" y="50" width="20" height="125" fill={C.ground} rx="2" />
      <rect x="10" y="45" width="35" height="8" fill={C.rail} rx="2" />
      <text x="22" y="40" textAnchor="middle" fill={C.text} fontSize="8">Wall Rail</text>
      {/* Ground side leg */}
      <rect x="254" y="95" width="16" height="80" fill={C.support} rx="2" />
      <rect x="248" y="168" width="28" height="7" fill={C.rail} rx="1" />
      <text x="262" y="90" textAnchor="middle" fill={C.text} fontSize="8">Ground</text>
      {/* Girder - angled because one side higher */}
      <line x1="45" y1="53" x2="254" y2="95" stroke={C.girder} strokeWidth="12" strokeLinecap="round" />
      <text x="150" y="78" textAnchor="middle" fill="black" fontSize="9" fontWeight="bold">Girder</text>
      {/* Hoist */}
      <rect x="118" y="82" width="54" height="16" fill={C.hoist} rx="3" />
      <text x="145" y="94" textAnchor="middle" fill="white" fontSize="8">Hoist</text>
      <line x1="145" y1="98" x2="145" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M138 130 Q145 142 152 130" stroke={C.wire} strokeWidth="2" fill="none" />
      <text x="150" y="155" textAnchor="middle" fill={C.support} fontSize="9">Wall + Ground rail hybrid</text>
      <text x="150" y="173" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">Semi Gantry</text>
    </svg>
  )
}

function Monorail({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      {/* Single rail */}
      <rect x="10" y="40" width="280" height="10" fill={C.rail} rx="2" />
      <text x="150" y="32" textAnchor="middle" fill={C.text} fontSize="10">Single Overhead Rail</text>
      {/* Trolley */}
      <rect x="110" y="50" width="80" height="20" fill={C.support} rx="3" />
      <text x="150" y="64" textAnchor="middle" fill="white" fontSize="9">Trolley</text>
      {/* Hoist */}
      <rect x="120" y="70" width="60" height="18" fill={C.hoist} rx="3" />
      <text x="150" y="83" textAnchor="middle" fill="white" fontSize="9">Hoist</text>
      {/* Hook */}
      <line x1="150" y1="88" x2="150" y2="130" stroke={C.wire} strokeWidth="2" />
      <path d="M142 130 Q150 145 158 130" stroke={C.wire} strokeWidth="2" fill="none" />
      {/* Direction arrows */}
      <text x="50" y="58" fill={C.wire} fontSize="16">←</text>
      <text x="234" y="58" fill={C.wire} fontSize="16">→</text>
      <text x="150" y="158" textAnchor="middle" fill={C.support} fontSize="9">Fixed path • Assembly lines</text>
      <text x="150" y="178" textAnchor="middle" fill={C.girder} fontSize="10" fontWeight="bold">Monorail Crane</text>
    </svg>
  )
}

function DefaultDiagram({ width, height }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 200">
      <text x="150" y="100" textAnchor="middle" fill={C.text} fontSize="14">Select a crane type</text>
    </svg>
  )
}