import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Search, HelpCircle, Tag, Bookmark, History, ChevronRight, LayoutPanelTop, Gamepad2, ClipboardCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import HandbookEntry from '../components/ui/HandbookEntry'
import { HANDBOOK_SECTIONS, PROTECTION_GLOSSARY, IEC_SYMBOLS } from '../data/handbookContent'
import { useHandbookStore } from '../store/handbookStore'

const FAQ = [
  {
    q: 'Why does this app use 2x FLC for contactor sizing instead of the 3x figure I\'ve seen elsewhere?',
    a: 'An earlier version of this tool used 3x with no cited basis. It was corrected to 2x, based on AC-3/AC-4 severe-duty reversing sizing practice — see the Contactor Sizing entry above and the README\'s engineering audit log for the full correction history.',
  },
  {
    q: 'Why can Hoist, Long Travel and Cross Travel all run at the same time, but Forward/Reverse on one motion can\'t?',
    a: 'Interlocking only applies within one motion — the Forward and Reverse contactors of the same motor share terminals and would short each other if both closed. Different motions have entirely separate motors and branches with no electrical relationship to each other. See the Forward/Reverse Interlocking entry and the Panel Simulator page.',
  },
  {
    q: 'Why doesn\'t the overload relay reset itself automatically?',
    a: 'If it did, an intermittent fault could cycle the motor on and off repeatedly, overheating it a little more each time. Requiring a manual reset forces someone to actually investigate why it tripped before running the motor again. See the Overload Relay Setting entry and the Control Circuit page.',
  },
  {
    q: 'Is every number in this app verified against the actual IEC/IS standard text?',
    a: 'No, and this app is upfront about that rather than overclaiming — the standards themselves are paywalled. Formulas and reasoning here are checked against solid engineering fundamentals and cross-referenced within the app for consistency; a few specific figures (e.g. panel clearance distances) are explicitly flagged as unverified rather than presented as certain. See the README\'s "Known limitations" section.',
  },
]

const STATIC_SECTIONS = [
  { id: 'glossary', title: 'Glossary', icon: Tag },
  { id: 'iec-symbols', title: 'IEC Symbols', icon: Tag },
  { id: 'faq', title: 'FAQ', icon: HelpCircle },
]

function findTopicById(id) {
  for (const section of HANDBOOK_SECTIONS) {
    const t = section.topics.find((t) => t.id === id)
    if (t) return t
  }
  return null
}

export default function EngineeringHandbook() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(HANDBOOK_SECTIONS[0]?.id)
  const openedFromHash = useRef(false)
  const bookmarks = useHandbookStore((s) => s.bookmarks)
  const recent = useHandbookStore((s) => s.recent)

  const filteredSections = useMemo(() => {
    if (!search.trim()) return HANDBOOK_SECTIONS
    const q = search.toLowerCase()
    return HANDBOOK_SECTIONS
      .map((section) => ({
        ...section,
        topics: section.topics.filter((t) =>
          t.title.toLowerCase().includes(q) ||
          t.meaning?.toLowerCase().includes(q) ||
          t.equation?.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.topics.length > 0)
  }, [search])

  // Deep-link support: /handbook#some-topic-id scrolls to and auto-expands
  // that entry. Unchanged from before, still the mechanism every
  // "Learn the theory" link across the app relies on.
  useEffect(() => {
    if (openedFromHash.current) return
    const hash = location.hash?.replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      openedFromHash.current = true
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const btn = el.querySelector('button')
        if (btn && el.querySelector('[aria-expanded="false"]')) btn.click()
      }, 150)
    }
  }, [location.hash])

  // Lightweight scrollspy — highlights whichever section is currently
  // nearest the top of the viewport in the left nav, doc-site style.
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [filteredSections])

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Engineering Handbook"
        description="Every formula and control-circuit concept used anywhere in this app, in one place — equation, variables, a worked example, and where it's actually used."
      />

      <div className="flex items-center gap-4 flex-wrap bg-inset border border-steel rounded-lg px-4 py-3 mb-6 text-xs">
        <span className="text-text-muted font-semibold shrink-0">Put it into practice:</span>
        <Link to="/panel-explorer" className="flex items-center gap-1.5 text-amber hover:text-amber-dim transition-colors"><LayoutPanelTop size={13} /> Panel Explorer</Link>
        <Link to="/challenge-mode" className="flex items-center gap-1.5 text-amber hover:text-amber-dim transition-colors"><Gamepad2 size={13} /> Challenge Mode</Link>
        <Link to="/commissioning" className="flex items-center gap-1.5 text-amber hover:text-amber-dim transition-colors"><ClipboardCheck size={13} /> Virtual Commissioning</Link>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
        {/* ── Sticky left navigation ─────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto space-y-5 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the handbook…"
              className="w-full pl-9 pr-3 py-2.5 bg-inset border border-steel rounded-lg text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          {bookmarks.length > 0 && (
            <NavGroup icon={Bookmark} label="Bookmarked">
              {bookmarks.map((id) => {
                const t = findTopicById(id)
                if (!t) return null
                return <NavLink key={id} href={`#${id}`} label={t.title} active={activeId === id} />
              })}
            </NavGroup>
          )}

          {recent.length > 0 && (
            <NavGroup icon={History} label="Recently Viewed">
              {recent.map((id) => {
                const t = findTopicById(id)
                if (!t) return null
                return <NavLink key={id} href={`#${id}`} label={t.title} active={activeId === id} />
              })}
            </NavGroup>
          )}

          <nav aria-label="Handbook sections" className="space-y-0.5">
            {HANDBOOK_SECTIONS.map((section) => (
              <div key={section.id}>
                <a
                  href={`#section-${section.id}`}
                  className={`block px-2.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors
                    ${activeId === section.id ? 'text-amber' : 'text-text-dim hover:text-text-muted'}`}
                >
                  {section.title}
                </a>
                <div className="border-l border-steel ml-2.5 pl-2.5 space-y-0.5 mb-1.5">
                  {section.topics.map((t) => (
                    <NavLink key={t.id} href={`#${t.id}`} label={t.title} active={activeId === t.id} compact />
                  ))}
                </div>
              </div>
            ))}
            {STATIC_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors
                  ${activeId === s.id ? 'text-amber' : 'text-text-dim hover:text-text-muted'}`}
              >
                <s.icon size={12} /> {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* ── Main content ───────────────────────────────────────────── */}
        <div className="min-w-0">
          {!search && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
              {HANDBOOK_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className="group flex items-center justify-between gap-2 bg-surface border border-steel rounded-lg px-4 py-3 hover:border-amber transition-colors"
                >
                  <div>
                    <div className="text-text text-sm font-semibold">{section.title}</div>
                    <div className="text-text-dim text-xs mt-0.5">{section.topics.length} topic{section.topics.length !== 1 ? 's' : ''}</div>
                  </div>
                  <ChevronRight size={15} className="text-text-dim group-hover:text-amber group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              ))}
            </div>
          )}

          {search && filteredSections.length === 0 && (
            <Card className="text-center py-8 text-text-dim text-sm mb-6">
              No formulas match "{search}" — try a different term, or clear the search to browse everything.
            </Card>
          )}

          <div className="space-y-8">
            {filteredSections.map((section) => (
              <section key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
                <h2 className="font-display text-lg text-amber font-semibold mb-3">{section.title}</h2>
                <div className="space-y-2.5">
                  {section.topics.map((topic) => (
                    <HandbookEntry key={topic.id} topic={topic} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {!search && (
            <>
              <section id="glossary" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-lg text-amber font-semibold mb-3 flex items-center gap-2">
                  <Tag size={18} /> Protection Device & Term Glossary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PROTECTION_GLOSSARY.map((g) => (
                    <Card key={g.term} padding="sm">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-sm text-copper font-semibold">{g.term}</span>
                        {g.full !== '—' && <span className="text-[0.65rem] text-text-dim">{g.full}</span>}
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{g.def}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section id="iec-symbols" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-lg text-amber font-semibold mb-3">IEC Symbol Reference</h2>
                <p className="text-text-dim text-xs mb-3">
                  General conventions per IEC 60617 — shape descriptions below, not pixel-precise renderings of the standard itself.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {IEC_SYMBOLS.map((sym) => (
                    <Card key={sym.id} padding="sm">
                      <div className="text-sm font-semibold text-text mb-1">{sym.label}</div>
                      <p className="text-xs text-text-muted leading-relaxed">{sym.desc}</p>
                    </Card>
                  ))}
                </div>
              </section>

              <section id="faq" className="mt-10 scroll-mt-24">
                <h2 className="font-display text-lg text-amber font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle size={18} /> Frequently Asked Questions
                </h2>
                <div className="space-y-2.5">
                  {FAQ.map((item, i) => (
                    <Card key={i} padding="md">
                      <div className="text-sm font-semibold text-text mb-1.5">{item.q}</div>
                      <p className="text-xs text-text-muted leading-relaxed">{item.a}</p>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function NavGroup({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-2.5 text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">
        <Icon size={11} /> {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavLink({ href, label, active, compact }) {
  return (
    <a
      href={href}
      className={`block truncate rounded-md transition-colors
        ${compact ? 'px-2.5 py-1 text-[0.78rem]' : 'px-2.5 py-1.5 text-xs font-medium'}
        ${active ? 'text-amber bg-amber/5' : 'text-text-dim hover:text-text-muted'}`}
    >
      {label}
    </a>
  )
}
