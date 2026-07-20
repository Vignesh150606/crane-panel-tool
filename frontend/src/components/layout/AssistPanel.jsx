import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { DURATION } from '../../lib/motion'
import { useTutorStore } from '../../tutor/tutorStore'
import { useTutorContext } from '../../tutor/contextBuilder'
import { fetchTutorUsage } from '../../tutor/tutorApi'

/**
 * Just the launcher now — the actual conversation lives at /tutor
 * (TutorPage.jsx) as a first-class page, not a floating panel. This
 * component's other job is quietly keeping tutorStore.lastContext synced
 * to "whatever page the user was just working on", so that by the time
 * they land on /tutor, there's a real snapshot to ground the conversation
 * in instead of /tutor's own meaningless location context.
 */
export default function AssistPanel() {
  const location = useLocation()
  const navigate = useNavigate()
  const remaining = useTutorStore((s) => s.remaining)
  const dailyLimit = useTutorStore((s) => s.dailyLimit)
  const context = useTutorContext()

  useEffect(() => {
    fetchTutorUsage().then((data) => useTutorStore.getState().setUsage(data)).catch(() => {
      // Usage is a nice-to-have display — a failed fetch (e.g. backend asleep)
      // shouldn't block anything.
    })
  }, [])

  useEffect(() => {
    if (location.pathname !== '/tutor') useTutorStore.getState().setLastContext(context)
  }, [context, location.pathname])

  // Project Report is print-focused (see .no-print in index.css), and
  // there's obviously no point launching the tutor from its own page.
  if (location.pathname === '/report' || location.pathname === '/tutor') return null

  return (
    <AnimatePresence>
      <motion.button
        key="assist-launcher"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        transition={{ duration: DURATION.fast }}
        onClick={() => navigate('/tutor')}
        aria-label="Open Engineering Tutor"
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
          <span className="text-sm font-medium text-text">Ask Tutor</span>
          {remaining != null && (
            <span className="text-[0.7rem] text-text-dim tabular-nums">{remaining}/{dailyLimit}</span>
          )}
        </span>
      </motion.button>
    </AnimatePresence>
  )
}
