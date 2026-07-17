import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { getRelatedTopics } from '../../data/workspaceIndex'

const PAGE_SUGGESTIONS = {
  '/calculator': ['Why was this motor selected?', 'Could I use a smaller contactor?'],
  '/nameplate': ['Explain this calculation.', 'Why this cable size?'],
  '/cable-busbar': ['Why was this cable selected?', 'What is voltage drop?'],
  '/star-delta': ['Why star-delta instead of DOL?', 'What is inrush current?'],
  '/control-circuit': ["Why didn't KM2 energize?", 'Explain this interlock.'],
  '/simulator': ['Explain this interlock.', 'What is a seal-in circuit?'],
  '/challenge-mode': ['Give me a hint.', 'Why is this diagnosis wrong?'],
  '/commissioning': ['What should I check next?', 'Why did this check fail?'],
  '/handbook': ['Explain this topic in simpler terms.', 'Show a practical example.'],
  '/bom': ['Where is this used?', 'Why this quantity?'],
  '/panel-layout': ['Where is this used?', 'Why is this component placed here?'],
  '/fault-diagnosis': ['Give me a hint.', 'Explain this fault.'],
}

const GENERIC_SUGGESTIONS = ['What does this page do?', 'Where should I learn this first?']

export default function SuggestedQuestions({ pagePath, onPick }) {
  const pageSpecific = PAGE_SUGGESTIONS[pagePath] || []
  const topicBased = getRelatedTopics(pagePath).slice(0, 1).map((t) => `Explain "${t.title}".`)
  const suggestions = [...pageSpecific, ...topicBased, ...GENERIC_SUGGESTIONS].slice(0, 4)

  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: i * 0.04 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(q)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-steel bg-inset text-text-muted hover:border-copper/50 hover:text-copper hover:bg-copper/5 transition-colors cursor-pointer"
        >
          <Sparkles size={11} className="shrink-0 opacity-70" />
          {q}
        </motion.button>
      ))}
    </div>
  )
}
