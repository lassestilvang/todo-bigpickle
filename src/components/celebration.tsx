'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationProps {
  active: boolean
}

const PARTICLES = 12
const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#14b8a6']

const particles = Array.from({ length: PARTICLES }, (_, i) => {
  const angle = (i / PARTICLES) * 360
  const distance = 30 + Math.random() * 20
  const rad = (angle * Math.PI) / 180
  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    color: COLORS[i % COLORS.length],
    size: 3 + Math.random() * 3,
    delay: Math.random() * 0.1,
  }
})

export const Celebration = memo(function Celebration({ active }: CelebrationProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none z-10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: 0,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: p.delay,
                ease: [0.17, 0.67, 0.83, 0.67],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
