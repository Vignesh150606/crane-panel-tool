import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { BookOpen, Search, HelpCircle, Tag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import HandbookEntry from '../components/ui/HandbookEntry'
import { HANDBOOK_SECTIONS, PROTECTION_GLOSSARY, IEC_SYMBOLS } from '../data/handbookContent'

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

export default function EngineeringHandbook() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const openedFromHash = useRef(false)

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
        // Auto-open the linked entry so a "Learn the theory" link doesn't
        // land on a collapsed card the visitor then has to find and click.
        if (btn && el.querySelector('[aria-expanded="false"]')) btn.click()
      }, 150)
    }
  }, [location.hash])

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Engineering Handbook"
        description="Every formula and control-circuit concept used anywhere in this app, in one place — equation, variables, a worked example, and where it's actually used."
      />

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search formulas, e.g. &quot;contactor&quot;, &quot;voltage drop&quot;…"
          className="w-full pl-9 pr-3 py-2.5 bg-inset border border-steel rounded-lg text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-amber transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {HANDBOOK_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#section-${s.id}`}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-inset border border-steel text-text-muted hover:text-amber hover:border-amber/40 transition-colors"
          >
            {s.title}
          </a>
        ))}
        <a href="#glossary" className="px-3 py-1.5 rounded-full text-xs font-semibold bg-inset border border-steel text-text-muted hover:text-amber hover:border-amber/40 transition-colors">Glossary</a>
        <a href="#iec-symbols" className="px-3 py-1.5 rounded-full text-xs font-semibold bg-inset border border-steel text-text-muted hover:text-amber hover:border-amber/40 transition-colors">IEC Symbols</a>
        <a href="#faq" className="px-3 py-1.5 rounded-full text-xs font-semibold bg-inset border border-steel text-text-muted hover:text-amber hover:border-amber/40 transition-colors">FAQ</a>
      </div>

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
  )
}
