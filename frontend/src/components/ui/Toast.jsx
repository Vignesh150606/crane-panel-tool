import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { ToastContext } from './toastContext'

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }
const TONES = {
  success: 'border-safe/40 text-safe',
  error: 'border-danger/40 text-danger',
  info: 'border-info/40 text-info',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((message, tone = 'info', duration = 3200) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, tone }])
    if (duration) setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  const api = {
    success: (msg, d) => push(msg, 'success', d),
    error: (msg, d) => push(msg, 'error', d),
    info: (msg, d) => push(msg, 'info', d),
    dismiss: remove,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:w-auto">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`pointer-events-auto flex items-center gap-2.5 bg-surface border rounded-lg px-3.5 py-2.5 shadow-lg ${TONES[t.tone]}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="text-sm text-text flex-1">{t.message}</span>
                <button onClick={() => remove(t.id)} className="text-text-dim hover:text-text cursor-pointer">
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
