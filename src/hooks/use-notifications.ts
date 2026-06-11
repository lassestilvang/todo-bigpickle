'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { differenceInMinutes } from 'date-fns'

const CHECK_INTERVAL = 60000
const NOTIFY_BEFORE = 30
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

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

export function useNotifications() {
  const tasksRef = useRef(useAppStore.getState().tasks)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state) => state.tasks,
      (tasks) => { tasksRef.current = tasks }
    )
    return unsubscribe
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
      const tasks = tasksRef.current

      for (const task of tasks) {
        if (task.completed) continue

        // Deadline-based notification (30 min before)
        if (task.deadline) {
          const deadline = toDate(task.deadline)
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

        // Date-based notification (due today or overdue)
        if (task.date) {
          const taskDate = toDate(task.date)
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

        // Reminder-based notification (arbitrary reminder times)
        if (task.reminders && task.reminders.length > 0) {
          for (const reminder of task.reminders) {
            const reminderTime = toDate(reminder)
            const key = `reminder:${task.id}:${reminderTime.getTime()}`

            if (reminderTime <= now && !notified.has(key)) {
              const minsAgo = differenceInMinutes(now, reminderTime)
              new Notification('Task Reminder', {
                body: minsAgo <= 1
                  ? `"${task.name}" — reminder`
                  : `"${task.name}" — reminder was ${minsAgo} ${minsAgo === 1 ? 'minute' : 'minutes'} ago`,
                icon: '/icon.svg',
                tag: key,
              })
              markNotified(key)
            }
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
  }, [])
}
