'use client'

export type { Toast as ToastData }
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  duration?: number
}

type Listener = (toasts: Toast[]) => void

const MAX_TOASTS = 5

let toasts: Toast[] = []
const listeners: Set<Listener> = new Set()
let counter = 0
const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

function notify() {
  for (const listener of listeners) {
    listener(toasts)
  }
}

function addToast(t: Omit<Toast, 'id'>) {
  const id = String(++counter)
  toasts = [...toasts, { ...t, id }]

  if (toasts.length > MAX_TOASTS) {
    const removed = toasts.shift()
    if (removed) timeouts.delete(removed.id)
  }

  notify()

  const duration = Number.isFinite(t.duration) ? (t.duration ?? 4000) : 4000
  if (duration > 0) {
    const timer = setTimeout(() => {
      dismissToast(id)
    }, duration)
    timeouts.set(id, timer)
  }
  return id
}

export function dismissToast(id: string) {
  const timer = timeouts.get(id)
  if (timer) {
    clearTimeout(timer)
    timeouts.delete(id)
  }
  toasts = toasts.filter(t => t.id !== id)
  notify()
}

export function toast(t: Omit<Toast, 'id'>) {
  return addToast(t)
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener)
  listener(toasts)
  return () => { listeners.delete(listener) }
}

/** @internal — reset state between tests */
export function resetToasts() {
  for (const timer of timeouts.values()) {
    clearTimeout(timer)
  }
  timeouts.clear()
  toasts = []
  listeners.clear()
  counter = 0
}
