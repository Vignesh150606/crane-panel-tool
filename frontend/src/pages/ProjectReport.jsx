import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Printer, Pencil, Check, FileWarning } from 'lucide-react'

import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import Badge from '../components/ui/Badge'
import { useProjectStore } from '../store/projectStore'
import { CRANE_TYPES } from '../data/craneData'

const TODAY = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

export default function ProjectReport() {
  const store = useProjectStore()
  const { project, craneType, motors, cableBusbar, starDelta, bom } = store
  const [editing, setEditing] = useState(!project.name)

  const crane = craneType ? CRANE_TYPES[craneType] : null

  return (
    <div className="min-h-screen bg-ink">
      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-10 bg-ink/95 backdrop-blur border-b border-steel">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/bom" className="flex items-center gap-1.5 text-text-muted hover:text-text text-sm">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={editing ? Check : Pencil} onClick={() => setEditing((e) => !e)}>
              {editing ? 'Done editing' : 'Edit project info'}
            </Button>
            <Button size="sm" icon={Printer} onClick={() => window.print()}>Print / Save as PDF</Button>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 print:py-0">
        <div className="bg-surface print-surface border border-steel rounded-xl p-6 sm:p-10 print:border-0 print:rounded-none print:p-0">

          {/* Title block */}
          <div className="text-center border-b-2 border-amber print:border-black pb-6 mb-8">
            <div className="text-xs tracking-[0.2em] text-text-dim print:text-gray-500 mb-2">ENGINEERING DESIGN REPORT</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text print:text-black">
              EOT Crane Control Panel Design
            </h1>
            {editing ? (
              <div className="max-w-sm mx-auto mt-4 text-left">
                <TextField label="Project Name" value={project.name} onChange={(v) => store.setProject({ name: v })} placeholder="e.g. 10T EOT Crane — Panel Design" />
              </div>
            ) : (
              <p className="text-amber print:text-black font-semibold mt-2">{project.name || 'Untitled Project'}</p>
            )}
          </div>

          {/* Project info */}
          <Section title="Project Information">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <TextField label="Engineer" value={project.engineer} onChange={(v) => store.setProject({ engineer: v })} placeholder="Your name" />
                <TextField label="College / Organisation" value={project.college} onChange={(v) => store.setProject({ college: v })} placeholder="e.g. SSN College of Engineering" />
                <TextField label="Date" value={project.date} onChange={(v) => store.setProject({ date: v })} placeholder={TODAY} />
              </div>
            ) : (
              <InfoGrid items={[
                { label: 'Engineer', value: project.engineer || '—' },
                { label: 'College / Organisation', value: project.college || '—' },
                { label: 'Date', value: project.date || TODAY },
              ]} />
            )}
          </Section>

          {/* Crane type */}
          <Section title="Crane Type">
            {crane ? (
              <InfoGrid items={[
                { label: 'Type', value: crane.fullName },
                { label: 'Category', value: crane.category },
                { label: 'Capacity Range', value: crane.capacityRange },
                { label: 'Span Range', value: crane.spanRange },
                { label: 'Duty Class', value: crane.specs.typicalDutyClass },
                { label: 'Girders', value: crane.specs.girders },
              ]} />
            ) : (
              <NotYetAvailable link="/cranes" label="Select a crane type" />
            )}
          </Section>

          {/* Motor & load calculations */}
          <Section title="Motor & Load Calculations">
            {motors ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {Object.entries(motors.motors).map(([key, m]) => (
                  <div key={key} className="border border-steel print:border-gray-300 rounded-lg p-3 print-avoid-break">
                    <div className="text-text print:text-black font-semibold text-sm mb-2">{m.label}</div>
                    <MiniRow label="Power" value={`${m.hp} HP / ${m.kw} kW`} />
                    <MiniRow label="FLC" value={`${m.flc} A`} />
                    <MiniRow label="Contactor" value={`${m.contactor_rating} A`} />
                    <MiniRow label="MPCB" value={`${m.mpcb_rating} A`} />
                    <MiniRow label="Overload" value={`${m.overload_setting} A`} />
                    <MiniRow label="Cable" value={`${m.cable_size} mm²`} />
                    {m.star_delta_required && <Badge tone="caution" className="mt-1.5">Star-Delta</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <NotYetAvailable link="/calculator" label="Run the Load Calculator" />
            )}
          </Section>

          {/* Cable & busbar */}
          <Section title="Cable Sizing & Busbar System">
            {cableBusbar ? (
              <InfoGrid items={[
                { label: 'Cable Size', value: `${cableBusbar.result.cable_size} mm²` },
                { label: 'Cable Capacity', value: `${cableBusbar.result.cable_capacity} A` },
                { label: 'Voltage Drop', value: `${cableBusbar.result.voltage_drop_v} V (${cableBusbar.result.voltage_drop_pct}%)` },
                { label: 'System Recommended', value: cableBusbar.result.recommendation === 'busbar' ? 'Rigid Busbar' : 'Stretch Wire' },
              ]} />
            ) : (
              <NotYetAvailable link="/cable-busbar" label="Run the Cable & Busbar Designer" />
            )}
          </Section>

          {/* Star-delta / circuit */}
          <Section title="Starting Method / Circuit Design">
            {starDelta ? (
              <InfoGrid items={[
                { label: 'Motor Rating', value: `${starDelta.inputs.hp} HP` },
                { label: 'Star-Delta Required', value: starDelta.result.required ? 'Yes' : 'No' },
                { label: 'DOL Inrush', value: `${starDelta.result.dol_inrush} A` },
                { label: 'Star Inrush', value: `${starDelta.result.star_inrush} A` },
                { label: 'Timer Setting', value: `${starDelta.inputs.timer}s` },
              ]} />
            ) : (
              <NotYetAvailable link="/star-delta" label="Run the Star-Delta Calculator" />
            )}
          </Section>

          {/* BOM */}
          <Section title="Bill of Materials">
            {bom ? (
              <div className="overflow-x-auto print-avoid-break">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-steel print:border-gray-400">
                      {['Sl.No', 'Component', 'Specification', 'Qty', 'Unit'].map((h) => (
                        <th key={h} className="text-left py-1.5 pr-3 text-text-dim print:text-gray-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bom.result.items.map((item) => (
                      <tr key={item.slNo} className="border-b border-steel/50 print:border-gray-200">
                        <td className="py-1.5 pr-3 text-text-dim print:text-gray-500">{item.slNo}</td>
                        <td className="py-1.5 pr-3 text-text print:text-black font-medium">{item.component}</td>
                        <td className="py-1.5 pr-3 text-text-muted print:text-gray-600">{item.spec}</td>
                        <td className="py-1.5 pr-3 text-amber print:text-black">{item.qty}</td>
                        <td className="py-1.5 pr-3 text-text-dim print:text-gray-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <NotYetAvailable link="/bom" label="Generate the BOM" />
            )}
          </Section>

          {/* Engineering notes */}
          <Section title="Engineering Notes">
            {editing ? (
              <textarea
                value={project.notes}
                onChange={(e) => store.setProject({ notes: e.target.value })}
                placeholder="Add any project-specific notes, deviations from standard assumptions, or site conditions here…"
                rows={4}
                className="w-full bg-inset border border-steel rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber resize-y"
              />
            ) : (
              <p className="text-text-muted print:text-black text-sm leading-relaxed whitespace-pre-wrap">
                {project.notes || 'No additional notes.'}
              </p>
            )}
          </Section>

          {/* Signature footer */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-steel print:border-gray-300">
            <div>
              <div className="border-b border-text-dim print:border-gray-400 h-10" />
              <div className="text-text-dim print:text-gray-500 text-xs mt-1">Engineer Signature</div>
            </div>
            <div className="text-right">
              <div className="text-text print:text-black text-sm">{project.date || TODAY}</div>
              <div className="text-text-dim print:text-gray-500 text-xs mt-1">Date</div>
            </div>
          </div>

          <div className="text-center text-text-dim print:text-gray-400 text-[0.65rem] mt-8">
            Generated by Crane Panel Design Tool · Calculations per IS/IEC standards
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-7 print-avoid-break">
      <h2 className="text-amber print:text-black font-display font-semibold text-sm uppercase tracking-wide mb-3 pb-1.5 border-b border-steel print:border-gray-300">
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-text-dim print:text-gray-500 text-xs mb-0.5">{item.label}</div>
          <div className="text-text print:text-black text-sm font-medium">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function MiniRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs mb-1">
      <span className="text-text-dim print:text-gray-500">{label}</span>
      <span className="text-text print:text-black font-mono">{value}</span>
    </div>
  )
}

function NotYetAvailable({ link, label }) {
  return (
    <div className="no-print flex items-center gap-2 text-text-dim text-sm bg-inset border border-dashed border-steel rounded-lg px-3.5 py-2.5">
      <FileWarning size={14} className="shrink-0" />
      <span>Not yet completed. <Link to={link} className="text-amber underline underline-offset-2">{label} →</Link></span>
    </div>
  )
}
