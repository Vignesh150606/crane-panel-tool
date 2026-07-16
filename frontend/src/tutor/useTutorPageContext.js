import { useEffect } from 'react'
import { usePageContextStore } from './pageContextStore'

/**
 * Call from a page with a short, current, plain-English description of
 * whatever local state the tutor can't see from projectStore/trainingStore
 * alone — e.g. `usePublishTutorContext('simulation', "FWD pressed, LT
 * limit not tripped, KM1 energized")`. Re-publishes whenever `summary`
 * changes, and clears on unmount so a stale summary never leaks onto the
 * next page the student visits.
 */
export function usePublishTutorContext(kind, summary, focused) {
  const setPageContext = usePageContextStore((s) => s.setPageContext)
  const clearPageContext = usePageContextStore((s) => s.clearPageContext)

  useEffect(() => {
    setPageContext(kind, summary, focused)
    return () => clearPageContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, summary, focused?.id])
}
