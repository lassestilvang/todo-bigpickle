'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ClipboardCheck, CloudRain, Target, PartyPopper } from 'lucide-react'

interface EmptyStateProps {
  type: 'inbox' | 'completed' | 'search' | 'list'
  title: string
  description: string
  action?: React.ReactNode
}

const config = {
  inbox: {
    icon: ClipboardCheck,
    color: 'text-primary',
    bg: 'bg-primary/5',
    emoji: '✨',
  },
  completed: {
    icon: PartyPopper,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5',
    emoji: '🎉',
  },
  search: {
    icon: CloudRain,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    emoji: '🔍',
  },
  list: {
    icon: Target,
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    emoji: '📌',
  },
}

export const EmptyState = memo(function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const { icon: Icon, color, bg, emoji } = config[type]

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative mb-6"
      >
        <div className={`size-20 rounded-3xl ${bg} flex items-center justify-center relative z-10 overflow-hidden group`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Icon className={`size-10 ${color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`} />
        </div>
        
        <motion.div
          animate={{ 
            y: [0, -4, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2 text-2xl z-20 pointer-events-none"
        >
          {emoji}
        </motion.div>
        
        <div className="absolute inset-0 blur-3xl opacity-20 bg-primary/30 -z-10 animate-pulse" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-bold tracking-tight mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-sm max-w-[260px] leading-relaxed mb-8"
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  )
})
