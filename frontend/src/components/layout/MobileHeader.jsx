import { Link } from 'react-router-dom'
import { Zap, Search } from 'lucide-react'

// Minimal top bar only — brand + search. Navigation itself now lives in
// BottomNav; this used to also own a hamburger button that opened the full
// 18-item desktop sidebar in a drawer ("no 20-item navigation list" was a
// direct, valid complaint about that pattern), which is now redundant.
export default function MobileHeader({ onOpenSearch }) {
  return (
    <header className="lg:hidden no-print sticky top-0 z-40 h-14 flex items-center justify-between gap-3 px-4 border-b border-steel bg-ink/95 backdrop-blur">
      <Link to="/" className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber to-copper flex items-center justify-center shrink-0">
          <Zap size={14} className="text-ink" strokeWidth={2.5} />
        </div>
        <div className="leading-none truncate">
          <div className="font-display font-semibold text-sm text-text truncate">Crane Panel</div>
        </div>
      </Link>
      <button
        onClick={onOpenSearch}
        className="p-3 -mr-3 text-text-muted hover:text-text cursor-pointer"
        aria-label="Search"
      >
        <Search size={20} />
      </button>
    </header>
  )
}
