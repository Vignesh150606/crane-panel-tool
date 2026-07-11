import { ArrowRight } from 'lucide-react'

export function PrefillBanner({ message, onDismiss }) {
  return (
    <div className="flex items-center gap-2 bg-copper/10 border border-copper/30 rounded-lg px-3.5 py-2 mb-5 text-xs text-copper">
      <ArrowRight size={13} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-copper/70 hover:text-copper cursor-pointer text-[0.7rem] underline underline-offset-2">
          Use my own values
        </button>
      )}
    </div>
  )
}

export default function PageHeader({ icon: Icon, title, description, actions }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-inset border border-steel flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={19} className="text-amber" strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
          {description && <p className="text-text-muted text-sm mt-1 max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
