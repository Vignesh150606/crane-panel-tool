import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  GraduationCap, Send, RotateCcw, ArrowRight, ChevronDown, ChevronUp,
  Share2, Check, Compass, X,
} from 'lucide-react'
import { useTutorStore } from '../tutor/tutorStore'
import { askTutor } from '../tutor/tutorApi'
import { ApiError } from '../api/client'
import { getRelatedTopics, getNextWorkflowStep } from '../data/workspaceIndex'
import { findNavItem } from '../config/navigation'
import TutorMessage from '../components/tutor/TutorMessage'
import SuggestedQuestions from '../components/tutor/SuggestedQuestions'
import RelatedContext from '../components/tutor/RelatedContext'

const MAX_CHARS = 500
const MAX_TEXTAREA_HEIGHT = 200

function AutoTextarea({ value, onChange, onSubmit, disabled, placeholder }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
      }}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className="flex-1 resize-none bg-inset border border-steel rounded-xl px-4 py-3.5 text-[0.95rem] text-text leading-relaxed
                 placeholder:text-text-dim outline-none focus:border-copper/50 disabled:opacity-50 transition-colors"
      style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
    />
  )
}

function ShareButton({ getText }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        const text = getText()
        if (!text) return
        try {
          if (navigator.share) {
            await navigator.share({ title: 'Engineering Tutor conversation', text })
          } else {
            await navigator.clipboard.writeText(text)
            setDone(true)
            setTimeout(() => setDone(false), 1500)
          }
        } catch {
          // AbortError from a cancelled native share sheet, or a clipboard
          // failure — either way, nothing actionable to show the user.
        }
      }}
      title="Share conversation"
      className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
    >
      {done ? <Check size={15} className="text-safe" /> : <Share2 size={15} />}
    </button>
  )
}

export default function TutorPage() {
  const messages = useTutorStore((s) => s.messages)
  const addMessage = useTutorStore((s) => s.addMessage)
  const remaining = useTutorStore((s) => s.remaining)
  const dailyLimit = useTutorStore((s) => s.dailyLimit)
  const loading = useTutorStore((s) => s.loading)
  const setLoading = useTutorStore((s) => s.setLoading)
  const error = useTutorStore((s) => s.error)
  const setError = useTutorStore((s) => s.setError)
  const clearConversation = useTutorStore((s) => s.clearConversation)
  const lastContext = useTutorStore((s) => s.lastContext)

  const [input, setInput] = useState('')
  const [contextOpen, setContextOpen] = useState(false)
  const scrollRef = useRef(null)

  // /tutor's OWN location is meaningless as "what page are you asking
  // about" — lastContext is the real useTutorContext() snapshot from
  // wherever the user actually was, captured by AssistPanel right up
  // until the moment they navigated here (see tutorStore.setLastContext).
  const groundedPath = lastContext?.page_path || null
  const groundedLabel = lastContext?.page_label || findNavItem(groundedPath)?.label || null
  const relatedTopics = groundedPath ? getRelatedTopics(groundedPath) : []
  const nextStep = groundedPath ? getNextWorkflowStep(groundedPath) : null
  const hasRelatedContext = relatedTopics.length > 0 || !!nextStep

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function submit(question) {
    const q = (question ?? input).trim()
    if (!q || loading) return
    if (remaining === 0) {
      setError("You've used today's Engineering Tutor questions. Please continue tomorrow.")
      return
    }

    addMessage({ role: 'user', content: q })
    setInput('')
    setLoading(true)
    setError(null)

    const history = useTutorStore.getState().messages.map((m) => ({ role: m.role, content: m.content }))
    const context = lastContext || { page_path: '/tutor', page_label: 'Engineering Tutor' }

    try {
      const res = await askTutor(q, context, history)
      addMessage({
        role: 'tutor',
        content: res.answer,
        navigation: res.navigation,
        refused: res.refused,
        cached: res.cached,
      })
      useTutorStore.getState().setUsage({ remaining_today: res.remaining_today, daily_limit: res.daily_limit })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong asking the tutor. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function askAbout(topicTitle) {
    submit(`Explain "${topicTitle}" in the context of what I'm doing on this page.`)
  }

  function conversationAsText() {
    if (!messages.length) return ''
    return messages.map((m) => `${m.role === 'user' ? 'Me' : 'Tutor'}: ${m.content}`).join('\n\n')
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-7.5rem)] min-h-[420px] max-w-3xl mx-auto">
      {/* Header — no PageHeader here on purpose; this needs to read as a
          dedicated space, not "another workspace page", and the title/
          controls double as the top bar a real chat surface needs. */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-steel shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-copper/15 border border-copper/40 flex items-center justify-center shrink-0">
            <GraduationCap size={16} className="text-copper" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-text text-base leading-tight truncate">Engineering Tutor</h1>
            {remaining != null && (
              <p className="text-[0.7rem] text-text-dim tabular-nums">{remaining}/{dailyLimit} questions remaining today</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && <ShareButton getText={conversationAsText} />}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              title="Clear conversation"
              className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Grounding chip — collapsed by default so it doesn't compete with
          the conversation; the whole point of capturing lastContext is
          that the tutor already has it even when this stays closed. */}
      {groundedLabel && (
        <div className="shrink-0 border-b border-steel">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 py-2.5 text-left cursor-pointer"
          >
            <span className="text-xs text-text-dim">
              Grounded in <span className="text-text-muted font-medium">{groundedLabel}</span>
            </span>
            {hasRelatedContext && (contextOpen ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />)}
          </button>
          {contextOpen && hasRelatedContext && (
            <div className="pb-3">
              <RelatedContext path={groundedPath} onAskAbout={askAbout} />
            </div>
          )}
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <p className="text-text-muted text-sm leading-relaxed max-w-md mx-auto">
                Ask about {groundedLabel ? <>what you were doing on <span className="text-text font-medium">{groundedLabel}</span></> : 'anything'} —
                a calculation, a component, a formula, or where to start.
                I only cover crane control panel engineering and this application.
              </p>
            </div>
            <SuggestedQuestions pagePath={groundedPath} onPick={submit} />
          </div>
        )}
        {messages.map((m) => <TutorMessage key={m.id} message={m} />)}
        {loading && (
          <div className="flex gap-2 items-start">
            <span className="mt-0.5 w-6 h-6 rounded-full bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
              <GraduationCap size={13} className="text-copper" />
            </span>
            <span className="rounded-2xl rounded-tl-md border border-steel bg-surface px-3.5 py-3 flex items-center gap-1">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-text-dim"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </span>
          </div>
        )}
        {error && (
          <div className="flex items-start justify-between gap-2 text-xs text-danger bg-danger-dim/40 border border-danger/30 rounded-lg px-3 py-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 cursor-pointer"><X size={13} /></button>
          </div>
        )}
      </div>

      {/* Input — larger and more comfortable than the old panel's
          single-line 300-char box: auto-growing, 500 chars, generously
          padded. */}
      <div className="border-t border-steel pt-3 shrink-0">
        <div className="flex items-end gap-2.5">
          <AutoTextarea
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={remaining === 0}
            placeholder={remaining === 0 ? "Today's questions are used up" : 'Ask about your design…'}
          />
          <button
            onClick={() => submit()}
            disabled={!input.trim() || loading || remaining === 0}
            aria-label="Ask the tutor"
            className="shrink-0 w-[52px] h-[52px] rounded-xl bg-amber text-ink flex items-center justify-center
                       hover:bg-amber-dim transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={19} strokeWidth={2.25} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <span className="text-[0.65rem] text-text-dim tabular-nums">{input.length}/{MAX_CHARS}</span>
          {nextStep && messages.length > 0 && (
            <Link to={nextStep.path} className="inline-flex items-center gap-1 text-[0.7rem] text-amber hover:text-amber-dim transition-colors">
              <Compass size={11} /> {nextStep.label} <ArrowRight size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
