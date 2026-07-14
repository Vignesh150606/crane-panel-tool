import { Link } from 'react-router-dom'
import { AlertTriangle, Lightbulb, BookOpen, ArrowRight, Compass } from 'lucide-react'
import { getRelatedTopics, getNextWorkflowStep } from '../../data/workspaceIndex'

const MAX_TOPICS = 2

export default function ContextPanel({ path }) {
  const allTopics = getRelatedTopics(path)
  const topics = allTopics.slice(0, MAX_TOPICS)
  const overflow = allTopics.length - topics.length
  const nextStep = getNextWorkflowStep(path)

  if (topics.length === 0 && !nextStep) return null

  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      {topics.map((topic) => (
        <div key={topic.id} className="rounded-xl border border-steel bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wide text-text-dim mb-2">
            <BookOpen size={12} /> Related Formula
          </div>
          <div className="text-text font-semibold text-sm mb-1">{topic.title}</div>
          {topic.equation && (
            <div className="font-mono text-xs text-amber bg-inset border border-steel rounded-md px-2.5 py-1.5 mb-2 overflow-x-auto">
              {topic.equation}
            </div>
          )}
          <p className="text-text-muted text-xs leading-relaxed mb-2.5 line-clamp-3">{topic.meaning}</p>

          {topic.commonMistakes?.[0] && (
            <div className="flex items-start gap-1.5 bg-caution-dim/40 border border-amber/25 rounded-md px-2.5 py-2 mb-2">
              <AlertTriangle size={12} className="text-amber shrink-0 mt-0.5" />
              <p className="text-[0.7rem] text-text-muted leading-relaxed">{topic.commonMistakes[0]}</p>
            </div>
          )}

          {topic.interviewTip && (
            <div className="flex items-start gap-1.5 bg-amber/5 border border-amber/20 rounded-md px-2.5 py-2 mb-2.5">
              <Lightbulb size={12} className="text-amber shrink-0 mt-0.5" />
              <p className="text-[0.7rem] text-text-muted leading-relaxed">{topic.interviewTip}</p>
            </div>
          )}

          <Link to={`/handbook#${topic.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:text-info/80 transition-colors">
            Open in Handbook <ArrowRight size={11} />
          </Link>
        </div>
      ))}

      {overflow > 0 && (
        <Link
          to={`/handbook`}
          className="block text-center text-xs text-text-dim hover:text-amber border border-dashed border-steel rounded-lg py-2 transition-colors"
        >
          +{overflow} more related topic{overflow > 1 ? 's' : ''} in the Handbook
        </Link>
      )}

      {nextStep && (
        <div className="rounded-xl border border-amber/40 bg-amber/5 p-4">
          <div className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wide text-amber mb-2">
            <Compass size={12} /> Next Recommended Step
          </div>
          <div className="text-text font-semibold text-sm mb-1">{nextStep.label}</div>
          <p className="text-text-muted text-xs leading-relaxed mb-3">{nextStep.description}</p>
          <Link
            to={nextStep.path}
            className="inline-flex items-center gap-1.5 bg-amber text-ink text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-amber-dim transition-colors"
          >
            Continue <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </aside>
  )
}
