const BASE = 'rounded-xl border transition-all duration-200'

const INTERACTIVE = 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 hover:border-amber/80 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2'

const VARIANTS = {
  default: 'bg-surface border-steel',
  raised: 'bg-surface-raised border-steel shadow-sm',
  computed: 'bg-surface border-steel relative pl-5 before:content-[\'\'] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-copper before:to-copper-dim',
  inset: 'bg-inset border-steel shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
  danger: 'bg-surface border-danger/50',
  warning: 'bg-caution-dim/30 border-amber/40',
  highlight: 'bg-surface border-amber shadow-sm',
}

const PAD = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
}

export default function Card({ variant = 'default', padding = 'md', interactive = false, className = '', children, ...props }) {
  return (
    <div className={`${BASE} ${VARIANTS[variant] || VARIANTS.default} ${PAD[padding] ?? PAD.md} ${interactive ? INTERACTIVE : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

