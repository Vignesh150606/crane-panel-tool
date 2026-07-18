import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X, Search } from 'lucide-react'
import SidebarContent from './SidebarContent'
import { backdropFade, drawerSlideX } from '../../lib/motion'

export default function MobileHeader({ onOpenSearch }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the drawer automatically on route change (covers back/forward nav
  // too, not just link clicks inside the drawer).
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setOpen(false)
  }

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-3 px-4 border-b border-steel bg-ink/95 backdrop-blur">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber to-copper flex items-center justify-center">
            <Zap size={16} className="text-ink" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display font-semibold text-sm text-text">Crane Panel</div>
            <div className="text-[0.65rem] text-text-dim tracking-wide">DESIGN TOOL</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            className="p-2 text-text-muted hover:text-text cursor-pointer"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="p-2 -mr-2 text-text-muted hover:text-text cursor-pointer"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              {...backdropFade}
              className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              {...drawerSlideX}
              className="fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[300px] bg-ink border-r border-steel flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-steel shrink-0">
                <span className="font-display font-semibold text-sm text-text">Navigate</span>
                <button onClick={() => setOpen(false)} className="p-1.5 text-text-muted hover:text-text cursor-pointer" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
