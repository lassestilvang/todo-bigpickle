'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'

interface ProgressRingProps {
  progress: number // 0 to 1
  size?: number
  strokeWidth?: number
  className?: string
  active?: boolean
}

export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 18,
  strokeWidth = 2.5,
  className = "",
  active = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/10"
        />
        {/* Progress track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={active ? "currentColor" : "var(--primary)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          strokeLinecap="round"
          className={active ? "text-primary-foreground" : "text-primary"}
        />
      </svg>
      {progress === 1 && (
         <motion.div
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
         >
           ✓
         </motion.div>
      )}
    </div>
  )
})
