'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'

type Mood = 'focus' | 'stressed' | 'productive' | 'neutral'

function computeMood(focusMode: boolean, tasks: { completed: boolean; deadline?: Date | null; completedAt?: Date | null }[]): Mood {
  if (focusMode) return 'focus'
  const now = new Date()
  let overdue = 0
  let completedToday = 0
  const todayStr = now.toDateString()
  for (const t of tasks) {
    if (!t.completed && t.deadline && t.deadline < now) {
      overdue++
    } else if (t.completed && t.completedAt && new Date(t.completedAt).toDateString() === todayStr) {
      completedToday++
    }
  }
  if (overdue > 3) return 'stressed'
  if (completedToday > 5) return 'productive'
  return 'neutral'
}

export const MoodBackground = memo(function MoodBackground() {
  const mood = useAppStore(s => computeMood(s.focusMode, s.tasks))

  const colors: Record<Mood, string> = {
    focus: 'from-blue-500/5 via-indigo-500/5 to-purple-500/5',
    stressed: 'from-orange-500/5 via-red-500/5 to-transparent',
    productive: 'from-emerald-500/5 via-teal-500/5 to-transparent',
    neutral: 'from-primary/5 via-transparent to-transparent',
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={`absolute inset-0 bg-gradient-to-br ${colors[mood]} transition-colors duration-1000`}
        />
      </AnimatePresence>
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 opacity-30 mix-blend-soft-light">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/4 -left-1/4 size-[100%] rounded-full bg-primary/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -right-1/4 size-[100%] rounded-full bg-blue-500/10 blur-[120px]"
        />
      </div>
    </div>
  )
})
