import { useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DURATION } from '../../lib/motion'

const SHOW_DELAY = 350 // ms — long enough that it doesn't flash on every mouse pass-through

const PLACEMENT = {
  top: {
    wrapper: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    initial: { opacity: 0, y: 4, scale: 0.96 },
  },
  bottom: {
    wrapper: 'top-full left-1/2 -translate-x-1/2 mt-2',
    initial: { opacity: 0, y: -4, scale: 0.96 },
  },
  right: {
    wrapper: 'left-full top-1/2 -translate-y-1/2 ml-2',
    initial: { opacity: 0, x: -4, scale: 0.96 },
  },
  left: {
    wrapper: 'right-full top-1/2 -translate-y-1/2 mr-2',
    initial: { opacity: 0, x: 4, scale: 0.96 },
  },
}

// Hover/focus-triggered label for icon-only controls. Keyboard-accessible
// (shows on focus, not just hover) and screen-reader-accessible (the label
// is also wired as aria-describedby, on top of whatever aria-label the
// trigger already carries — this is a visual aid, not a replacement for
// the trigger's own accessible name).
export default function Tooltip({ label, placement = 'top', children, disabled, className = 'inline-flex' }) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)
  const id = useId()

  if (disabled || !label) return children

  function show() {
    timeoutRef.current = setTimeout(() => setVisible(true), SHOW_DELAY)
  }
  function hide() {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const p = PLACEMENT[placement] || PLACEMENT.top

  return (
    <span
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {typeof children === 'function' ? children(id) : children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            id={id}
            initial={p.initial}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={p.initial}
            transition={{ duration: DURATION.fast }}
            className={`pointer-events-none absolute z-[70] whitespace-nowrap rounded-md border border-steel
              bg-ink px-2 py-1 text-[0.7rem] font-medium text-text shadow-lg ${p.wrapper}`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
