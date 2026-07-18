import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { findNavItem } from '../../config/navigation'
import { getSectionForPath } from '../../data/workspaceIndex'

export default function Breadcrumb({ path }) {
  const item = findNavItem(path)
  if (!item) return null
  const section = getSectionForPath(path)

  return (
    <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs text-text-dim mb-3">
      <Link to="/" className="hover:text-text-muted transition-colors">Home</Link>
      {section && (
        <>
          <ChevronRight size={12} />
          <span>{section.label}</span>
        </>
      )}
      <ChevronRight size={12} />
      <span className="text-text-muted font-medium">{item.label}</span>
    </nav>
  )
}
