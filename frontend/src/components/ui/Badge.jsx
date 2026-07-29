const TONES = {
  safe: 'bg-safe-dim/60 text-safe border-safe/40',
  danger: 'bg-danger-dim/60 text-danger border-danger/40',
  caution: 'bg-caution-dim/60 text-amber border-amber/40',
  info: 'bg-info-dim/60 text-info border-info/40',
  neutral: 'bg-steel/40 text-text-muted border-steel',
}

const DOT_TONES = {
  safe: 'bg-safe shadow-[0_0_6px_var(--color-safe)]',
  danger: 'bg-danger shadow-[0_0_6px_var(--color-danger)]',
  caution: 'bg-amber shadow-[0_0_6px_var(--color-amber)]',
  info: 'bg-info shadow-[0_0_6px_var(--color-info)]',
  neutral: 'bg-text-dim',
}

export default function Badge({ tone = 'neutral', dot = true, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${TONES[tone] || TONES.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_TONES[tone] || DOT_TONES.neutral}`} />}
      {children}
    </span>
  )
}

