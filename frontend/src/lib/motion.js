// Motion System — single source of truth for timing, easing, and the
// handful of interaction patterns reused across the shell (panels, sheets,
// dialogs, page transitions). Before this file, individual components each
// hand-picked a duration (12 distinct values were in use for essentially
// four kinds of motion), so the app felt inconsistent even though every
// individual animation was reasonable in isolation. Pull from here instead
// of typing a new number.
//
// Reduced motion is handled globally by wrapping the app in
// <MotionConfig reducedMotion="user"> (see App.jsx) — every animation
// built from these presets automatically collapses to instant when the OS
// preference is set, with no per-component opt-in required.

export const DURATION = {
  instant: 0.12, // press feedback — must feel immediate, not "animated"
  fast: 0.15,    // small chrome: backdrops, launcher buttons, toggles
  base: 0.2,     // default — most enter/exit transitions
  slow: 0.3,     // larger surfaces: sheets, drawers, page content
  slower: 0.4,   // hero / first-paint entrances only
}

// A gentle "decelerate" curve (ease-out-ish, slightly springy at the tail) —
// used everywhere something is entering. Matches the feel already present
// in the sidebar/dialog animations, just named and reused instead of typed
// per-file as 'easeOut'.
export const EASE = {
  standard: [0.16, 1, 0.3, 1],
  decelerate: 'easeOut',
  accelerate: 'easeIn',
}

// ── Reusable variants ──────────────────────────────────────────────────
// Spread these directly onto a motion.* element: <motion.div {...fadeIn}>

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast },
}

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: { duration: DURATION.base, ease: EASE.standard },
}

// Dialogs / command palette: scale + fade, per the design-system motion
// language (dialogs get "scale + fade", drawers get "slide + fade").
export const dialogScale = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: DURATION.fast, ease: EASE.standard },
}

// Mobile nav drawer / any panel that slides in from an edge.
export const drawerSlideX = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { duration: DURATION.base, ease: EASE.standard },
}

// Bottom sheet (Assist Panel on mobile, and anything else that anchors to
// the bottom edge). Drag-to-dismiss lives on the component itself since it
// needs live state; this covers the enter/exit only.
export const sheetSlideY = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
  transition: { duration: DURATION.slow, ease: EASE.standard },
}

// Backdrop behind any overlay (drawer, dialog, sheet).
export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast },
}

// Button press — the "tiny press animation" every clickable control should
// have. Spread onto the wrapping motion.div: whileTap, whileHover come from
// this object directly.
export const pressable = {
  whileTap: { scale: 0.97 },
  whileHover: { y: -1 },
  transition: { duration: DURATION.instant },
}

// Stagger helper for card grids (Home page feature grids, etc.) — returns
// per-item transition delay without needing a parent variants/staggerChildren
// wiring change on already-working pages.
export function staggerDelay(index, step = 0.03) {
  return index * step
}
