import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { pressable } from '../../lib/motion'

const VARIANTS = {
  primary: 'bg-amber text-ink font-semibold hover:bg-amber-dim border border-transparent shadow-sm',
  secondary: 'bg-transparent text-text font-medium border border-steel hover:border-steel-light hover:bg-surface-hover',
  danger: 'bg-danger text-white font-semibold border border-transparent hover:brightness-110 shadow-sm',
  ghost: 'bg-transparent text-text-muted font-medium hover:text-text hover:bg-surface-hover border border-transparent',
  outline: 'bg-transparent text-amber font-semibold border border-amber/80 hover:bg-amber/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

const ICON_SIZES = {
  sm: 14,
  md: 16,
  lg: 18,
}

const MotionLink = motion.create(Link)

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
  const MotionTag = Component === Link ? MotionLink : (typeof Component === 'string' && motion[Component]) ? motion[Component] : motion.button

  return (
    <MotionTag
      disabled={disabled}
      whileTap={disabled ? undefined : pressable.whileTap}
      whileHover={disabled ? undefined : pressable.whileHover}
      transition={pressable.transition}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={ICON_SIZES[size] || 16} strokeWidth={2.25} className="shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={ICON_SIZES[size] || 16} strokeWidth={2.25} className="shrink-0" />}
    </MotionTag>
  )
}


