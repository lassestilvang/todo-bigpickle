'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ToastData } from '@/hooks/use-toast'
import { subscribeToasts, dismissToast } from '@/hooks/use-toast'

const iconMap: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<string, { border: string; bg: string; icon: string }> = {
  success: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    icon: 'text-green-500',
  },
  error: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    icon: 'text-red-500',
  },
  info: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    icon: 'text-blue-500',
  },
  warning: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    icon: 'text-yellow-500',
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    return subscribeToasts((newToasts) => {
      setToasts([...newToasts])
    })
  }, [])

  const handleDismiss = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    dismissToast(id)
  }, [])

  const handleAction = useCallback((toast: ToastData) => {
    dismissToast(toast.id)
    toast.action?.onClick()
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => {
          const Icon = iconMap[t.type] || iconMap.info
          const style = styles[t.type] || styles.info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.7 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${style.border} ${style.bg}
                px-4 py-3 shadow-lg backdrop-blur-md min-w-[320px] max-w-[420px]
                transition-shadow hover:shadow-xl hover:-translate-y-0.5`}
            >
              <Icon className={`size-5 mt-0.5 shrink-0 ${style.icon}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.action && (
                  <button
                    onClick={() => handleAction(t)}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap px-1.5 py-0.5 rounded-md hover:bg-primary/5"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={(e) => handleDismiss(t.id, e)}
                  className="rounded-md p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all duration-150"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
