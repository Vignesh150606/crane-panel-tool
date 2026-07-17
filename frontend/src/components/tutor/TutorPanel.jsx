import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, X, Send, RotateCcw } from 'lucide-react'
import { useTutorStore } from '../../tutor/tutorStore'
import { useTutorContext } from '../../tutor/contextBuilder'
import { askTutor, fetchTutorUsage } from '../../tutor/tutorApi'
import { ApiError } from '../../api/client'
import TutorMessage from './TutorMessage'
import SuggestedQuestions from './SuggestedQuestions'
import Button from '../ui/Button'

const MAX_CHARS = 300

export default function TutorPanel() {
  const location = useLocation()
  const open = useTutorStore((s) => s.open)
  const setOpen = useTutorStore((s) => s.setOpen)
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

  useEffect(() => {
    fetchTutorUsage().then((data) => useTutorStore.getState().setUsage(data)).catch(() => {
      // Usage is a nice-to-have display — a failed fetch (e.g. backend asleep)
      // shouldn't block the panel from opening or asking a question.
    })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // The Project Report page is print-focused (see .no-print in index.css) —
  // hide the tutor there rather than have it show up in a printed PDF.
  if (location.pathname === '/report') return null

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

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="tutor-launcher"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(true)}
            className="no-print fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2 pl-2.5 pr-3.5 py-2.5
                       rounded-full bg-surface/95 backdrop-blur-md border border-steel shadow-2xl hover:border-copper/50 transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
              <GraduationCap size={13} className="text-copper" />
            </span>
            <span className="text-sm font-medium text-text hidden sm:inline">Engineering Tutor</span>
            {remaining != null && (
              <span className="text-[0.7rem] text-text-dim tabular-nums">{remaining}/{dailyLimit}</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="tutor-panel"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            className="no-print fixed inset-x-0 bottom-0 z-50 lg:inset-auto lg:bottom-6 lg:right-6 lg:w-[400px]
                       h-[82vh] lg:h-[min(75vh,640px)] bg-surface/95 backdrop-blur-md border border-steel rounded-t-2xl lg:rounded-2xl
                       shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="h-0.5 shrink-0 bg-gradient-to-r from-copper via-amber to-copper" />
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-steel shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-md bg-copper/20 border border-copper/40 flex items-center justify-center shrink-0">
                  <GraduationCap size={15} className="text-copper" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text leading-tight">Engineering Tutor</div>
                  <div className="text-[0.7rem] text-text-dim truncate">{context.page_label || 'This application'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    title="Clear conversation"
                    className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
