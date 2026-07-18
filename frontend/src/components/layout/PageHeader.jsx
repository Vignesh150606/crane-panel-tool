import { findNavItem } from '../../config/navigation'

// Every workspace page was relying on the 12px Breadcrumb as its only
// "what page is this" signal — no page had an <h1> at all. navigation.js
// already has a good one-line description per page (used for tooltips and
// the sidebar); this just surfaces it as an actual page-opening title +
// instruction, so a first-time user knows what to do here within 5 seconds
// without reading the sidebar or guessing from card contents.
export default function PageHeader({ path }) {
  const item = findNavItem(path)
  if (!item) return null

  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text leading-tight">{item.label}</h1>
      {item.description && (
        <p className="text-text-muted text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">{item.description}</p>
      )}
    </div>
  )
}
