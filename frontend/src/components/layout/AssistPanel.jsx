import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { GraduationCap, BookOpen, X, Send, RotateCcw, AlertTriangle, Lightbulb, ArrowRight, Compass, MessageCircle } from 'lucide-react'
import { DURATION, sheetSlideY } from '../../lib/motion'
import { useAssistPanelStore } from '../../store/assistPanelStore'
import { useTutorStore } from '../../tutor/tutorStore'
import { useTutorContext } from '../../tutor/contextBuilder'
import { askTutor, fetchTutorUsage } from '../../tutor/tutorApi'
import { ApiError } from '../../api/client'
import { getRelatedTopics, getNextWorkflowStep } from '../../data/workspaceIndex'
import TutorMessage from '../tutor/TutorMessage'
import SuggestedQuestions from '../tutor/SuggestedQuestions'
import Button from '../ui/Button'

const MAX_CHARS = 300
const MAX_TOPICS = 2

function TabButton({ active, onClick, icon: Icon, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? 'bg-amber/10 text-amber' : 'text-text-dim hover:text-text hover:bg-surface-hover'}`}
    >
      <Icon size={13} /> {label}
    </button>
  )
}

function ContextTab({ path, onAskAbout }) {
  const allTopics = getRelatedTopics(path)
  const topics = allTopics.slice(0, MAX_TOPICS)
  const overflow = allTopics.length - topics.length
  const nextStep = getNextWorkflowStep(path)

  if (topics.length === 0 && !nextStep) {
    return <p className="text-sm text-text-muted leading-relaxed px-4 py-6 text-center">Nothing page-specific to show here yet — try the Tutor tab instead.</p>
  }

  return (
    <div className="space-y-3 px-4 py-3">
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

          <div className="flex items-center justify-between gap-2">
            <Link to={`/handbook#${topic.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:text-info/80 transition-colors">
              Open in Handbook <ArrowRight size={11} />
            </Link>
            <button
              onClick={() => onAskAbout(topic.title)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-copper hover:text-copper/80 transition-colors cursor-pointer"
            >
              <MessageCircle size={11} /> Ask Tutor
            </button>
          </div>
        </div>
      ))}

      {overflow > 0 && (
        <Link
          to="/handbook"
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
    </div>
  )
}

export default function AssistPanel() {
  const location = useLocation()
  const mode = useAssistPanelStore((s) => s.mode)
  const setMode = useAssistPanelStore((s) => s.setMode)
  const close = useAssistPanelStore((s) => s.close)

  const messages = useTutorStore((s) => s.messages)
  const addMessage = useTutorStore((s) => s.addMessage)
  const remaining = useTutorStore((s) => s.remaining)
  const dailyLimit = useTutorStore((s) => s.dailyLimit)
  const loading = useTutorStore((s) => s.loading)
  const setLoading = useTutorStore((s) => s.setLoading)
  const error = useTutorStore((s) => s.error)
  const setError = useTutorStore((s) => s.setError)
  const clearConversation = useTutorStore((s) => s.clearConversation)

  const [input, setInput] = useState('')
  const context = useTutorContext()
  const scrollRef = useRef(null)
  const dragControls = useDragControls()

  const hasContext = getRelatedTopics(location.pathname).length > 0 || !!getNextWorkflowStep(location.pathname)

  useEffect(() => {
    fetchTutorUsage().then((data) => useTutorStore.getState().setUsage(data)).catch(() => {
      // Usage is a nice-to-have display — a failed fetch (e.g. backend asleep)
      // shouldn't block the panel from opening or asking a question.
    })
  }, [])

  useEffect(() => {
    if (mode === 'tutor') scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, mode])

  // Reset to whichever tab makes sense for the new page: if this page has
  // no theory/context to show, don't land on a dead "context" tab.
  useEffect(() => {
    if (mode === 'context' && !hasContext) setMode('tutor')
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // The Project Report page is print-focused (see .no-print in index.css) —
  // hide the panel there rather than have it show up in a printed PDF.
  if (location.pathname === '/report') return null

  async function submit(question) {
    const q = (question ?? input).trim()
    if (!q || loading) return
    if (remaining === 0) {
      setError("You've used today's Engineering Tutor questions. Please continue tomorrow.")
      return
    }

    setMode('tutor')
    addMessage({ role: 'user', content: q })
    setInput('')
    setLoading(true)
    setError(null)

    const history = useTutorStore.getState().messages.map((m) => ({ role: m.role, content: m.content }))

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

  return (
    <>
      <AnimatePresence>
        {!mode && (
          <motion.button
            key="assist-launcher"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ duration: DURATION.fast }}
            onClick={() => setMode(hasContext ? 'context' : 'tutor')}
            aria-label="Open engineering assist"
            className="no-print fixed z-40 cursor-pointer transition-colors
                       bottom-20 right-4 w-16 h-16 rounded-full bg-copper shadow-2xl active:bg-copper/80
                       flex items-center justify-center
                       lg:bottom-6 lg:right-6 lg:w-auto lg:h-auto lg:rounded-full lg:bg-surface/95 lg:backdrop-blur-md
                       lg:border lg:border-steel lg:hover:border-copper/50 lg:flex lg:items-center lg:gap-2 lg:pl-2.5 lg:pr-3.5 lg:py-2.5"
          >
            {/* Mobile: icon fills the FAB, remaining-count shows as a corner badge */}
            <span className="lg:hidden relative flex items-center justify-center">
              <GraduationCap size={26} className="text-ink" strokeWidth={2.2} />
              {remaining != null && (
                <span className="absolute -top-3.5 -right-3.5 bg-ink border border-steel rounded-full text-[0.6rem] font-mono px-1.5 py-0.5 text-text-dim">
                  {remaining}
                </span>
              )}
            </span>
            {/* Desktop: original compact pill */}
            <span className="hidden lg:flex lg:items-center lg:gap-2">
              <span className="w-6 h-6 rounded-full bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
                <GraduationCap size={13} className="text-copper" />
              </span>
              <span className="text-sm font-medium text-text">Assist</span>
              {remaining != null && (
                <span className="text-[0.7rem] text-text-dim tabular-nums">{remaining}/{dailyLimit}</span>
              )}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode && (
          <motion.div
            key="assist-panel"
            {...sheetSlideY}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) close()
            }}
            className="no-print fixed inset-x-0 bottom-0 z-50 lg:inset-auto lg:bottom-6 lg:right-6 lg:w-[400px]
                       h-[82vh] lg:h-[min(75vh,640px)] bg-surface/95 backdrop-blur-md border border-steel rounded-t-2xl lg:rounded-2xl
                       shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drag handle — mobile only; the desktop floating panel isn't draggable */}
            <div
              className="lg:hidden flex items-center justify-center py-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-9 h-1 rounded-full bg-steel-light" />
            </div>
            <div className="h-0.5 shrink-0 bg-gradient-to-r from-copper via-amber to-copper" />
            <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-steel shrink-0">
              <div className="flex items-center gap-1 min-w-0">
                <TabButton active={mode === 'context'} onClick={() => setMode('context')} icon={BookOpen} label="Theory" disabled={!hasContext} />
                <TabButton active={mode === 'tutor'} onClick={() => setMode('tutor')} icon={GraduationCap} label="Tutor" />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {mode === 'tutor' && messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    title="Clear conversation"
                    className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={close}
                  className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {mode === 'context' && (
              <div className="flex-1 overflow-y-auto">
                <ContextTab path={location.pathname} onAskAbout={askAbout} />
              </div>
            )}

            {mode === 'tutor' && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-text-muted leading-relaxed">
                        Ask about anything on this page — the current calculation, a component, a formula, or where to start.
                        I only cover crane control panel engineering and this application.
                      </p>
                      <SuggestedQuestions pagePath={location.pathname} onPick={submit} />
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
                    <div className="text-xs text-danger bg-danger-dim/40 border border-danger/30 rounded-lg px-3 py-2">{error}</div>
                  )}
                </div>

                <div className="border-t border-steel px-3 py-2.5 shrink-0">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
                      }}
                      placeholder={remaining === 0 ? "Today's questions are used up" : 'Ask about this page…'}
                      disabled={remaining === 0}
                      rows={1}
                      className="flex-1 resize-none bg-inset border border-steel rounded-lg px-3 py-2 text-sm text-text
                                 placeholder:text-text-dim outline-none focus:border-copper/50 disabled:opacity-50"
                    />
                    <Button
                      size="sm"
                      icon={Send}
                      disabled={!input.trim() || loading || remaining === 0}
                      onClick={() => submit()}
                      aria-label="Ask the tutor"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 px-0.5">
                    <span className="text-[0.65rem] text-text-dim tabular-nums">{input.length}/{MAX_CHARS}</span>
                    {remaining != null && (
                      <span className="text-[0.65rem] text-text-dim tabular-nums">{remaining}/{dailyLimit} questions remaining today</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
