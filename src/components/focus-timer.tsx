'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FocusTimer = memo(function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      // Play a sound or show notification
      if (typeof window !== 'undefined') {
        const audio = new Audio('/sounds/celebration.mp3') // Fallback sound
        audio.play().catch(() => {})
      }
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const toggle = useCallback(() => setIsActive(!isActive), [isActive])
  
  const reset = useCallback(() => {
    setIsActive(false)
    setTimeLeft(25 * 60)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-1 bg-primary/5 rounded-full px-3 py-1 border border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <TimerIcon className="size-3.5 text-primary mr-1" />
      <span className="text-sm font-bold tabular-nums text-primary min-w-[40px]">
        {formatTime(timeLeft)}
      </span>
      <div className="flex items-center ml-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-primary hover:bg-primary/10"
          onClick={toggle}
        >
          {isActive ? <Pause className="size-3" /> : <Play className="size-3" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-primary hover:bg-primary/10"
          onClick={reset}
        >
          <RotateCcw className="size-3" />
        </Button>
      </div>
    </div>
  )
})
