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

const styles: Record<string, { border: string; glow: string; icon: string; bg: string }> = {
  success: {
    border: 'border-green-500/20 dark:border-green-500/25',
    glow: 'shadow-green-500/10 dark:shadow-green-500/20',
    icon: 'text-green-500',
    bg: 'bg-green-500/[0.04] dark:bg-green-500/[0.07]',
  },
  error: {
    border: 'border-red-500/20 dark:border-red-500/25',
    glow: 'shadow-red-500/10 dark:shadow-red-500/20',
    icon: 'text-red-500',
    bg: 'bg-red-500/[0.04] dark:bg-red-500/[0.07]',
  },
  info: {
    border: 'border-blue-500/20 dark:border-blue-500/25',
    glow: 'shadow-blue-500/10 dark:shadow-blue-500/20',
    icon: 'text-blue-500',
    bg: 'bg-blue-500/[0.04] dark:bg-blue-500/[0.07]',
  },
  warning: {
    border: 'border-yellow-500/20 dark:border-yellow-500/25',
    glow: 'shadow-yellow-500/10 dark:shadow-yellow-500/20',
    icon: 'text-yellow-500',
    bg: 'bg-yellow-500/[0.04] dark:bg-yellow-500/[0.07]',
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
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => {
          const Icon = iconMap[t.type] || iconMap.info
          const s = styles[t.type] || styles.info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
              className={`pointer-events-auto relative flex items-start gap-3 rounded-2xl border ${s.border} ${s.bg}
                bg-background/80 backdrop-blur-xl
                px-5 py-3.5 shadow-2xl ${s.glow}
                min-w-[340px] max-w-[440px]
                transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]`}
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${s.icon} bg-current/10`}>
                <Icon className="size-4" />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {t.action && (
                  <button
                    type="button"
                    onClick={() => handleAction(t)}
                    className="text-xs font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-lg hover:bg-accent"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(t.id, e)}
                  className="rounded-lg p-1 text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all duration-150"
                  aria-label="Dismiss"
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
