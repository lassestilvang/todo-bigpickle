'use client'

import { useEffect, useState } from 'react'

const listeners = new Set<(now: Date) => void>()
let intervalId: ReturnType<typeof setInterval> | null = null
let sharedNow = new Date()

function startSharedInterval() {
  if (intervalId) return
  intervalId = setInterval(() => {
    sharedNow = new Date()
    for (const listener of listeners) {
      listener(sharedNow)
    }
  }, 60000)
}

function stopSharedInterval() {
  if (intervalId && listeners.size === 0) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function useNow(): Date {
  const [now, setNow] = useState(() => sharedNow)

  useEffect(() => {
    listeners.add(setNow)
    startSharedInterval()
    return () => {
      listeners.delete(setNow)
      stopSharedInterval()
    }
  }, [])

  return now
}
