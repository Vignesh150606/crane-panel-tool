export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="border border-dashed border-steel rounded-xl px-6 py-14 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-inset border border-steel flex items-center justify-center mx-auto mb-4">
          <Icon size={22} className="text-text-dim" strokeWidth={1.75} />
        </div>
      )}
      {title && <p className="text-text-muted font-medium mb-1">{title}</p>}
      {description && <p className="text-text-dim text-sm max-w-sm mx-auto">{description}</p>}
    </div>
  )
}
