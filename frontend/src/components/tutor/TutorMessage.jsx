import { useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react'
import Badge from '../ui/Badge'

export default function TutorMessage({ message }) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-amber/15 border border-amber/30 px-3 py-2 text-sm text-text">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="mt-0.5 w-6 h-6 rounded-md bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
        <GraduationCap size={13} className="text-copper" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`rounded-xl rounded-tl-sm border px-3 py-2 text-sm leading-relaxed ${
          message.refused ? 'bg-caution-dim/40 border-amber/30 text-text-muted' : 'bg-surface border-steel text-text'
        }`}>
          {message.content}
        </div>
        {(message.cached) && (
          <Badge tone="neutral" dot={false} className="normal-case font-normal">
            <Sparkles size={10} /> From the handbook
          </Badge>
        )}
        {message.navigation && (
          <button
            onClick={() => navigate(message.navigation.to)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber hover:text-amber-dim transition-colors"
          >
            {message.navigation.label} <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
