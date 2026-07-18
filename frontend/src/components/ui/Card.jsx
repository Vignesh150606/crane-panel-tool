const BASE = 'rounded-xl border transition-colors'

// Applied on top of BASE when a card is a clickable/hoverable surface
// (e.g. wrapped in a Link). Lift + shadow together read as elevation;
// a translate alone (the old FeatureCard pattern) reads as a nudge.
const INTERACTIVE = 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-amber cursor-pointer'

const VARIANTS = {
  default: 'bg-surface border-steel',
  computed: 'bg-surface border-steel relative pl-5 before:content-[\'\'] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-copper before:to-copper-dim',
  inset: 'bg-inset border-steel shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
  danger: 'bg-surface border-danger/50',
  warning: 'bg-caution-dim/30 border-amber/40',
  highlight: 'bg-surface border-amber',
}

const PAD = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({ variant = 'default', padding = 'md', interactive = false, className = '', children, ...props }) {
  return (
    <div className={`${BASE} ${VARIANTS[variant]} ${PAD[padding]} ${interactive ? INTERACTIVE : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}
