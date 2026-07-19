import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, ClipboardList, LayoutPanelTop } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormulaExplainer from '../components/ui/FormulaExplainer'

const COMPONENTS = [
  { id: 'mcb', label: 'Main MCB', x: 20, y: 20, w: 60, h: 50, color: '#3b82f6' },
  { id: 'spp', label: 'SPP', x: 90, y: 20, w: 60, h: 50, color: '#8b5cf6' },
  { id: 'transformer', label: 'Control\nTransformer', x: 160, y: 20, w: 70, h: 50, color: '#94a3b8' },
  { id: 'mpcb1', label: 'MPCB\nHoist', x: 20, y: 90, w: 55, h: 45, color: '#f5a623' },
  { id: 'mpcb2', label: 'MPCB\nLT', x: 85, y: 90, w: 55, h: 45, color: '#f5a623' },
  { id: 'mpcb3', label: 'MPCB\nCT', x: 150, y: 90, w: 55, h: 45, color: '#f5a623' },
  { id: 'cont1', label: 'Cont.\nUp', x: 20, y: 155, w: 50, h: 40, color: '#f0453d' },
  { id: 'cont2', label: 'Cont.\nDown', x: 75, y: 155, w: 50, h: 40, color: '#f0453d' },
  { id: 'cont3', label: 'Cont.\nFwd', x: 130, y: 155, w: 50, h: 40, color: '#f0453d' },
  { id: 'cont4', label: 'Cont.\nRev', x: 185, y: 155, w: 50, h: 40, color: '#f0453d' },
  { id: 'relays', label: '8-pin Relays\n(R1-R6)', x: 20, y: 215, w: 110, h: 45, color: '#3fb950' },
  { id: 'overload', label: 'Overload\nRelays', x: 135, y: 215, w: 70, h: 45, color: '#eab308' },
  { id: 'terminal', label: 'Terminal Blocks', x: 20, y: 280, w: 215, h: 35, color: '#94a3b8' },
]

const CLEARANCE_EXPLANATION = {
  formula: 'Power duct <-> Control duct gap >= 100mm; Contactor <-> Contactor gap >= 75mm',
  variables: [],
  substitution: 'Fixed clearances per panel-builder practice under IEC 61439-6, not a calculated value.',
  result: '100mm / 75mm',
  reasoning:
    'Power cables carry switching transients that induce noise into nearby control wiring if run too close — the 100mm duct separation keeps that electromagnetic coupling below the level that causes false relay triggers. The 75mm contactor gap is thermal and mechanical: contactors dissipate heat during switching and arc briefly at contact separation, and this spacing keeps that heat and arc energy from affecting the neighbouring device.',
  standard: 'IEC 61439-6 — busbar trunking and panel assembly clearances; general panel-builder practice for EMI and thermal separation.',
  common_mistakes: [
    'Running control wiring in the same duct as power wiring "just for this one run" — a single exception defeats the separation.',
    'Tightening contactor spacing to fit more components without checking heat dissipation under full duty cycle.',
  ],
}

export default function PanelLayout() {
  const [hovered, setHovered] = useState(null)

  return (
    <div>
      <PageHeader
        icon={LayoutGrid}
        title="Panel Layout Visualizer"
        description="2D component placement following DIN rail mounting standards from real panel assembly."
        actions={<Button as={Link} to="/panel-explorer" variant="outline" size="sm" icon={LayoutPanelTop}>Explore each component in depth</Button>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <Card padding="lg" className="overflow-x-auto">
          <svg width="100%" viewBox="-5 -15 290 360" className="font-mono min-w-[400px]">
            <text x="140" y="-5" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">Panel Enclosure (Front View)</text>
            <rect x="5" y="5" width="270" height="330" fill="var(--color-inset)" stroke="var(--color-steel)" strokeWidth="3" rx="4" />

            {[15, 85, 150, 210, 275].map((y, i) => (
              <line key={i} x1="15" y1={y} x2="265" y2={y} stroke="var(--color-text-dim)" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
            ))}
            <text x="270" y="18" fill="var(--color-text-dim)" fontSize="7" writingMode="vertical-rl">DIN Rail</text>

            {COMPONENTS.map((c) => {
              const isHovered = hovered === c.id
              return (
                <g
                  key={c.id}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered((h) => (h === c.id ? null : c.id))}
                  role="button" tabIndex={0} aria-label={c.label.replace('\n', ' ')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHovered((h) => (h === c.id ? null : c.id)) } }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={`${c.color}${isHovered ? '55' : '33'}`} stroke={c.color} strokeWidth={isHovered ? 2.5 : 1.5} rx="3" />
                  {c.label.split('\n').map((line, i) => (
                    <text key={i} x={c.x + c.w / 2} y={c.y + c.h / 2 + (i - (c.label.split('\n').length - 1) / 2) * 11 + 3}
                      textAnchor="middle" fill={c.color} fontSize="8" fontWeight="600">{line}</text>
                  ))}
                </g>
              )
            })}

            <rect x="240" y="90" width="8" height="220" fill="var(--color-steel)" stroke="var(--color-text-dim)" strokeWidth="1" />
            <text x="244" y="85" textAnchor="middle" fill="var(--color-text-dim)" fontSize="7">Duct</text>

            <text x="140" y="325" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">Cable Glands (IP55) →</text>
            {[40, 80, 120, 160, 200, 240].map((x) => (
              <circle key={x} cx={x} cy="335" r="4" fill="var(--color-steel)" stroke="var(--color-text-muted)" />
            ))}
          </svg>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="font-display text-amber font-semibold mb-3">Mounting Standards</h3>
            {[
              { label: 'Cable duct gap', value: '100 mm' },
              { label: 'Contactor-to-contactor gap', value: '75 mm' },
              { label: 'Cable gland rating', value: 'IP55' },
              { label: 'Rail type', value: '35mm DIN' },
              { label: 'Wire separation', value: 'Power / Control ducts separate' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between mb-2 text-sm">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-safe font-semibold font-mono">{item.value}</span>
              </div>
            ))}
          </Card>

          <Card variant="inset">
            <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2">
              <ClipboardList size={14} /> Assembly Sequence
            </div>
            <ol className="text-text-dim text-sm leading-relaxed pl-5 list-decimal space-y-1">
              <li>Drill & tap mounting holes</li>
              <li>Mount DIN rails (top to bottom: MCB row, MPCB row, contactor row, relay row, terminals)</li>
              <li>Mount components on rails</li>
              <li>Route power wiring (separate duct)</li>
              <li>Route control wiring (separate duct)</li>
              <li>Fit cable glands at bottom</li>
              <li>Continuity check + functional test</li>
            </ol>
          </Card>

          <FormulaExplainer title="Why these clearances?" explanation={CLEARANCE_EXPLANATION} />
        </div>
      </div>
    </div>
  )
}
