import { motion } from 'framer-motion'
import { pressable } from '../../lib/motion'

const VARIANTS = {
  primary: 'bg-amber text-ink font-semibold hover:bg-amber-dim border border-transparent',
  secondary: 'bg-transparent text-text border border-steel hover:border-steel-light hover:bg-surface-hover',
  danger: 'bg-danger text-white font-bold border border-transparent hover:brightness-110',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-hover border border-transparent',
  outline: 'bg-transparent text-amber border border-amber hover:bg-amber/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <motion.div
      whileTap={disabled ? {} : pressable.whileTap}
      whileHover={disabled ? {} : pressable.whileHover}
      transition={pressable.transition}
      className="inline-block"
    >
      <Component
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
        {children}
        {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
      </Component>
    </motion.div>
  )
}
