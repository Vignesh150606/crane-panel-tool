// Everything in here is derived from data that already exists and was
// already engineering-audited (handbookContent.js, craneData.js,
// navigation.js) — nothing here invents a new formula, standard, or fact.
// What it adds is the *cross-referencing* the original data didn't have
// wired up yet: which handbook topics show up on which working page, and
// a single flat index to search all of it from one box.
import { HANDBOOK_SECTIONS, PROTECTION_GLOSSARY, IEC_SYMBOLS } from '../data/handbookContent'
import { ALL_NAV_ITEMS, WORKFLOW_ITEMS, REFERENCE_ITEMS, TRAINING_ITEMS } from '../config/navigation'

// Flatten every topic once, up front.
const ALL_TOPICS = HANDBOOK_SECTIONS.flatMap((section) =>
  section.topics.map((t) => ({ ...t, sectionTitle: section.title, sectionId: section.id }))
)

// A handful of pages have no formula of their own (BOM, Nameplate, Power
// Circuit, Panel Simulator, Fault Diagnosis) so `topic.relatedCalculator`
// never points at them, even though the *concept* clearly applies there too
// — e.g. the BOM page lists exactly the contactor/MPCB/overload ratings
// the handbook explains. This supplements (never replaces) the tagged
// relationship, reusing only topics that already exist.
const SUPPLEMENTARY_LINKS = {
  '/bom': ['contactor-sizing', 'mpcb-sizing', 'overload-relay', 'cable-sizing'],
  '/nameplate': ['contactor-sizing', 'mpcb-sizing', 'overload-relay', 'motor-efficiency'],
  '/power-circuit': ['dol-starting', 'star-delta-starting'],
  '/simulator': ['no-nc-contacts', 'seal-in-circuits', 'forward-reverse-interlock'],
  '/fault-diagnosis': ['overload-relay', 'no-nc-contacts'],
  '/panel-layout': ['contactor-sizing', 'mpcb-sizing'],
  '/panel-explorer': ['contactor-sizing', 'mpcb-sizing', 'overload-relay', 'no-nc-contacts'],
  '/challenge-mode': ['forward-reverse-interlock', 'no-nc-contacts', 'overload-relay'],
  '/commissioning': ['forward-reverse-interlock', 'no-nc-contacts'],
}

/** Handbook topics relevant to a given page path, tagged relationship first. */
export function getRelatedTopics(path) {
  const tagged = ALL_TOPICS.filter((t) => t.relatedCalculator?.path === path)
  const extraIds = SUPPLEMENTARY_LINKS[path] || []
  const extra = extraIds
    .map((id) => ALL_TOPICS.find((t) => t.id === id))
    .filter((t) => t && !tagged.some((tg) => tg.id === t.id))
  return [...tagged, ...extra]
}

/** The next page in the 7-step design sequence, or null if `path` isn't in it / is the last step. */
export function getNextWorkflowStep(path) {
  const i = WORKFLOW_ITEMS.findIndex((w) => w.path === path)
  if (i === -1 || i === WORKFLOW_ITEMS.length - 1) return null
  return WORKFLOW_ITEMS[i + 1]
}

/** Which nav section a path belongs to, for the breadcrumb. */
export function getSectionForPath(path) {
  if (WORKFLOW_ITEMS.some((w) => w.path === path)) return { label: 'Design Workflow', path: '/' }
  if (REFERENCE_ITEMS.some((r) => r.path === path)) return { label: 'Reference Tools', path: '/' }
  if (TRAINING_ITEMS.some((t) => t.path === path)) return { label: 'Training Modules', path: '/' }
  return null
}

// ── Global search index ───────────────────────────────────────────────
// One flat array, built once at module load. Each entry: { type, title,
// subtitle, to } where `to` is a full path (with #hash where relevant)
// ready to hand straight to react-router's navigate().
function buildSearchIndex() {
  const pages = ALL_NAV_ITEMS.map((item) => ({
    type: 'Page',
    title: item.label,
    subtitle: item.description || 'Open page',
    to: item.path,
  }))

  const topics = ALL_TOPICS.map((t) => ({
    type: 'Formula & Topic',
    title: t.title,
    subtitle: t.equation || t.sectionTitle,
    to: `/handbook#${t.id}`,
  }))

  const glossary = PROTECTION_GLOSSARY.map((g) => ({
    type: 'Glossary',
    title: `${g.term}${g.full !== '—' ? ` — ${g.full}` : ''}`,
    subtitle: g.def,
    to: '/handbook#glossary',
  }))

  const symbols = IEC_SYMBOLS.map((s) => ({
    type: 'IEC Symbol',
    title: s.label,
    subtitle: s.desc,
    to: '/handbook#iec-symbols',
  }))

  return [...pages, ...topics, ...glossary, ...symbols]
}

let _index = null
export function getSearchIndex() {
  if (!_index) _index = buildSearchIndex()
  return _index
}

export function searchAll(query, limit = 30) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return getSearchIndex()
    .filter((e) => e.title.toLowerCase().includes(q) || e.subtitle?.toLowerCase().includes(q))
    .slice(0, limit)
}
