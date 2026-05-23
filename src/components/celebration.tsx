'use client'

import { memo, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationProps {
  active: boolean
}

const PARTICLE_COUNT = 30
const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']
const SHAPES = ['circle', 'star'] as const

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + randomBetween(-15, 15)
    const distance = randomBetween(25, 55)
    const rad = (angle * Math.PI) / 180
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      rotation: randomBetween(0, 360),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(3, 7),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: Math.random() * 0.15,
    }
  })
}

function StarShape({ size }: { size: number }) {
  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const outer = size / 2
    const inner = outer * 0.4
    const x = Math.cos(angle) * outer
    const y = Math.sin(angle) * outer
    const x2 = Math.cos(angle + Math.PI / 2.5) * inner
    const y2 = Math.sin(angle + Math.PI / 2.5) * inner
    return `${x},${y} ${x2},${y2}`
  }).join(' ')

  return (
    <polygon
      points={points}
      fill="currentColor"
    />
  )
}

export const Celebration = memo(function Celebration({ active }: CelebrationProps) {
  const generation = useRef(0)

  const particles = useMemo(() => {
    generation.current += 1
    return createParticles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={generation.current}
          className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none z-10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                width: p.size,
                height: p.shape === 'star' ? p.size : p.size,
                left: '50%',
                top: '50%',
                color: p.color,
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [1, 1.2, 0],
                opacity: [1, 1, 0],
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.7,
                delay: p.delay,
                ease: [0.17, 0.67, 0.83, 0.67],
              }}
            >
              {p.shape === 'star' ? (
                <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
                  <StarShape size={p.size} />
                </svg>
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                  }}
                />
              )}
            </motion.div>
          ))}
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            ✨
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
