import { useLocation } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { usePageContextStore } from './pageContextStore'
import { findNavItem } from '../config/navigation'
import { CRANE_TYPES } from '../data/craneData'

function fmt(n, digits = 2) {
  return typeof n === 'number' ? n.toFixed(digits) : n
}

function motorBranchSummary(branch) {
  if (!branch) return null
  return `${branch.label} ${fmt(branch.hp)}HP, FLC ${fmt(branch.flc)}A, contactor ${branch.contactor_rating}A, `
    + `MPCB ${branch.mpcb_rating}A, cable ${branch.cable_size}${branch.star_delta_required ? ', star-delta required' : ''}`
}

function summarizeMotors(motors) {
  const m = motors?.motors
  if (!m) return null
  return [motorBranchSummary(m.hoist), motorBranchSummary(m.lt), motorBranchSummary(m.ct)]
    .filter(Boolean).join('. ')
}

function summarizeNameplate(nameplate) {
  const r = nameplate?.result
  if (!r) return null
  return `Nameplate entry: ${fmt(r.hp)}HP / FLC ${fmt(r.flc)}A → contactor ${r.contactor_rating}A, `
    + `MPCB ${r.mpcb_rating}A, cable ${r.cable_size}${r.star_delta_required ? ', star-delta required' : ''}`
}

function summarizeCable(cableBusbar) {
  const r = cableBusbar?.result
  if (!r) return null
  const parts = [`Cable size ${r.cable_size ?? '—'}`]
  if (r.voltage_drop_pct != null) parts.push(`voltage drop ${fmt(r.voltage_drop_pct)}%`)
  if (r.recommendation) parts.push(r.recommendation)
  return parts.join(', ')
}

function summarizeStarDelta(starDelta) {
  const r = starDelta?.result
  if (!r) return null
  return `DOL inrush ${fmt(r.dol_inrush, 1)}A vs star inrush ${fmt(r.star_inrush, 1)}A `
    + `(${fmt(r.current_reduction_pct, 1)}% reduction), star-delta ${r.required ? 'required' : 'not required'} for this motor`
}

function summarizeBOM(bom) {
  const items = bom?.result?.items
  if (!items?.length) return null
  return `BOM generated with ${items.length} line items (${items.slice(0, 4).map((i) => i.component).join(', ')}${items.length > 4 ? ', …' : ''})`
}

/**
 * Everything the tutor needs about "what the student is currently looking
 * at", gathered from the current route + projectStore + trainingStore +
 * whatever the current page published via usePublishTutorContext. Handbook
 * excerpt retrieval happens separately in retrieval.js (it depends on the
 * question text too, not just the page), and gets merged in by tutorApi.js
 * right before sending the request.
 */
export function useTutorContext() {
  const location = useLocation()
  const craneType = useProjectStore((s) => s.craneType)
  const motors = useProjectStore((s) => s.motors)
  const nameplate = useProjectStore((s) => s.nameplate)
  const cableBusbar = useProjectStore((s) => s.cableBusbar)
  const starDelta = useProjectStore((s) => s.starDelta)
  const bom = useProjectStore((s) => s.bom)
  const pageContext = usePageContextStore()

  const navItem = findNavItem(location.pathname)

  const context = {
    page_path: location.pathname,
    page_label: navItem?.label || null,
    page_description: navItem?.description || null,

    crane_type: craneType ? (CRANE_TYPES[craneType]?.name || craneType) : null,
    motor_summary: summarizeMotors(motors),
    cable_summary: summarizeCable(cableBusbar),
    star_delta_summary: summarizeStarDelta(starDelta),
    bom_summary: summarizeBOM(bom),
    nameplate_summary: summarizeNameplate(nameplate),

    simulation_summary: pageContext.kind === 'simulation' ? pageContext.summary : null,
    challenge_summary: pageContext.kind === 'challenge' ? pageContext.summary : null,
    commissioning_summary: pageContext.kind === 'commissioning' ? pageContext.summary : null,

    focused_topic_id: pageContext.focusedTopicId || (location.hash ? location.hash.replace('#', '') : null),
    focused_topic_title: pageContext.focusedTopicTitle || null,
  }

  return context
}
