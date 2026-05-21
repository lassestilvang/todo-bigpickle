'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors = {
  success: 'border-green-500/50 bg-green-500/10',
  error: 'border-red-500/50 bg-red-500/10',
  info: 'border-blue-500/50 bg-blue-500/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
let listeners: Set<Listener> = new Set()
let counter = 0

function notify() {
  for (const listener of listeners) {
    listener(toasts)
  }
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = String(++counter)
  toasts = [...toasts, { ...toast, id }]
  notify()

  const duration = toast.duration ?? 4000
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }
  return id
}

function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  notify()
}

export function toast(toast: Omit<Toast, 'id'>) {
  return addToast(toast)
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts)

  useEffect(() => {
    const listener: Listener = (newToasts) => {
      setState([...newToasts])
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return state
}

export function ToastContainer() {
  const toasts = useToasts()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-2 fade-in-0 ${colors[t.type]}`}
            style={{
              animation: 'toast-in 0.3s ease-out',
            }}
          >
            <Icon className={`size-5 mt-0.5 shrink-0 ${iconColors[t.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export { dismissToast }
