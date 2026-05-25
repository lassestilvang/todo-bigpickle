'use client'

import { memo } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'

interface CelebrationProps {
  active: boolean
}

const PARTICLE_COUNT = 60
const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#8b5cf6', '#ef4444', '#10b981']
const SHAPES = ['circle', 'star', 'diamond', 'square'] as const

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + randomBetween(-25, 25)
    const distance = randomBetween(40, 110)
    const rad = (angle * Math.PI) / 180
    const burstType = Math.random()
    return {
      id: i,
      x: Math.cos(rad) * distance * (burstType < 0.3 ? randomBetween(0.5, 0.8) : 1),
      y: Math.sin(rad) * distance * (burstType < 0.3 ? 0.6 : 1),
      rotation: randomBetween(0, 1080),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(3, 9),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: Math.random() * 0.15,
      scale: randomBetween(0.5, 1.5),
      gravity: randomBetween(0.3, 1),
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

  return <polygon points={points} fill="currentColor" />
}

function DiamondShape({ size }: { size: number }) {
  const half = size / 2
  return <polygon points={`0,-${half} ${half},0 0,${half} -${half},0`} fill="currentColor" />
}

function SquareShape({ size }: { size: number }) {
  const half = size / 2
  return (
    <rect
      x={-half}
      y={-half}
      width={size}
      height={size}
      rx={size * 0.15}
      fill="currentColor"
    />
  )
}

export const Celebration = memo(function Celebration({ active }: CelebrationProps) {
  const particles = createParticles()

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {active && (
        <m.div
          key={active ? 'celebrating' : 'idle'}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          {particles.map((p) => (
            <m.div
              key={p.id}
              className="absolute"
              style={{
                width: p.size,
                height: p.size,
                left: '50%',
                top: '50%',
                color: p.color,
              }}
              initial={{ x: 0, y: 0, scale: 0.95, opacity: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y + 20 * p.gravity,
                scale: [p.scale * 0.3, p.scale * 1.4, p.scale * 1.1, 0],
                opacity: [0, 1, 1, 0],
                rotate: p.rotation,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 1 + (1 - p.gravity) * 0.4,
                delay: p.delay,
                ease: [0.17, 0.67, 0.6, 1],
              }}
            >
              {p.shape === 'star' ? (
                <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
                  <StarShape size={p.size} />
                </svg>
              ) : p.shape === 'diamond' ? (
                <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
                  <DiamondShape size={p.size} />
                </svg>
              ) : p.shape === 'square' ? (
                <svg width={p.size} height={p.size} viewBox={`0 0 ${p.size} ${p.size}`}>
                  <SquareShape size={p.size} />
                </svg>
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}40`,
                  }}
                />
              )}
            </m.div>
          ))}
          <m.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: [0, 1.8, 0.9, 1.3, 0],
              opacity: [0, 1, 1, 0.8, 0],
              rotate: [0, -15, 15, -8, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            ✨
          </m.span>
        </m.div>
      )}
    </AnimatePresence>
    </LazyMotion>
  )
})
