import { useState, useEffect, useRef } from 'react'

/**
 * Tracks whether a scrollable container's content actually overflows its
 * box (scrollWidth > clientWidth), so a "scroll for more" hint can be shown
 * only when there's genuinely something to scroll to — not a fixed
 * breakpoint guess. Re-checks on resize via ResizeObserver.
 *
 * const [scrollRef, canScroll] = useScrollOverflow()
 * <div ref={scrollRef} className="overflow-x-auto">...</div>
 * {canScroll && <p>scroll for more →</p>}
 */
export function useScrollOverflow() {
  const ref = useRef(null)
  const [canScroll, setCanScroll] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 2)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, canScroll]
}
