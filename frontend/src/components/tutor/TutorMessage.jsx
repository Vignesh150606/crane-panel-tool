import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, GraduationCap, BookOpen, User, Copy, Check } from 'lucide-react'
import TutorMarkdown from './TutorMarkdown'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard API can be unavailable (older browsers, insecure
          // context) — failing quietly here is fine, copy is a convenience,
          // not the core action.
        }
      }}
      className="inline-flex items-center gap-1 text-[0.7rem] text-text-dim hover:text-text transition-colors cursor-pointer"
    >
      {copied ? <Check size={11} className="text-safe" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function TutorMessage({ message }) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex justify-end gap-2 items-start"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-amber/15 border border-amber/30 px-3.5 py-2.5 text-sm text-text leading-relaxed">
          {message.content}
        </div>
        <div className="mt-0.5 w-6 h-6 rounded-full bg-steel/60 border border-steel flex items-center justify-center shrink-0">
          <User size={12} className="text-text-dim" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex gap-2 items-start"
    >
      <div className="mt-0.5 w-6 h-6 rounded-full bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
        <GraduationCap size={13} className="text-copper" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className={`rounded-2xl rounded-tl-md border px-3.5 py-2.5 ${
          message.refused ? 'bg-caution-dim/40 border-amber/30 text-text-muted' : 'bg-surface border-steel text-text'
        }`}>
          <TutorMarkdown content={message.content} />
        </div>

        {message.cached && (
          <div className="flex items-center gap-1.5 rounded-lg border border-steel bg-inset px-2.5 py-1.5 text-[0.7rem] text-text-dim">
            <BookOpen size={11} className="text-copper shrink-0" />
            Answered directly from the Engineering Handbook
          </div>
        )}

        {message.navigation && (
          <button
            onClick={() => navigate(message.navigation.to)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/5 pl-2.5 pr-3 py-1.5 text-xs font-semibold text-amber hover:bg-amber/10 hover:border-amber/50 transition-colors cursor-pointer"
          >
            <BookOpen size={12} />
            {message.navigation.label}
            <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {!message.refused && <CopyButton text={message.content} />}
      </div>
    </motion.div>
  )
}
