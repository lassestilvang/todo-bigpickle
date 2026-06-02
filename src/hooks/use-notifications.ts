'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store'
import { differenceInMinutes } from 'date-fns'

const CHECK_INTERVAL = 60000 // Check every minute
const NOTIFY_BEFORE = 30 // Notify 30 minutes before deadline
const STORAGE_KEY = 'todo-app-notified-tasks'

function getNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markNotified(id: string) {
  try {
    const notified = getNotified()
    notified.add(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...notified]))
  } catch {
    // Storage unavailable
  }
}

export function useNotifications() {
  const tasks = useAppStore(s => s.tasks)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const now = new Date()
      const notified = getNotified()

      for (const task of tasks) {
        if (task.completed) continue

        // Check deadlines
        if (task.deadline) {
          const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline)
          const minsUntil = differenceInMinutes(deadline, now)

          if (minsUntil > 0 && minsUntil <= NOTIFY_BEFORE && !notified.has(`deadline:${task.id}`)) {
            new Notification('Upcoming Deadline', {
              body: `"${task.name}" is due in ${minsUntil} ${minsUntil === 1 ? 'minute' : 'minutes'}`,
              icon: '/icon.svg',
              tag: `deadline:${task.id}`,
            })
            markNotified(`deadline:${task.id}`)
          }
        }

        // Check due dates (notify day-of for tasks due today)
        if (task.date) {
          const taskDate = task.date instanceof Date ? task.date : new Date(task.date)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
          const isDueToday = taskDateOnly.getTime() === today.getTime()
          const isOverdue = taskDateOnly < today

          if ((isDueToday || isOverdue) && !notified.has(`date:${task.id}`)) {
            new Notification(isOverdue ? 'Overdue Task' : 'Task Due Today', {
              body: `"${task.name}"${isOverdue ? ' is overdue' : ' is due today'}`,
              icon: '/icon.svg',
              tag: `date:${task.id}`,
            })
            markNotified(`date:${task.id}`)
          }
        }
      }
    }, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [tasks])

  return { requestPermission }
}
