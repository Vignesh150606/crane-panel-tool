import { motion } from 'framer-motion'
import { fadeSlideUp } from '../../lib/motion'

export default function PageTransition({ children }) {
  return (
    <motion.div {...fadeSlideUp}>
      {children}
    </motion.div>
  )
}
