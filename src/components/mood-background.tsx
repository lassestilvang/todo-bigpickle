'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'

export const MoodBackground = memo(function MoodBackground() {
  const focusMode = useAppStore(s => s.focusMode)
  const tasks = useAppStore(s => s.tasks)
  
  const mood = useMemo(() => {
    const now = new Date()
    const overdue = tasks.filter(t => !t.completed && t.deadline && t.deadline < now).length
    const completedToday = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === now.toDateString()).length
    
    if (focusMode) return 'focus'
    if (overdue > 3) return 'stressed'
    if (completedToday > 5) return 'productive'
    return 'neutral'
  }, [focusMode, tasks])

  const colors = {
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
          className={`absolute inset-0 bg-gradient-to-br ${colors[mood as keyof typeof colors]} transition-colors duration-1000`}
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
