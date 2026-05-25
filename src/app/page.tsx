'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TaskList } from '@/components/task-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Task } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandPalette } from '@/components/command-palette'
import { RefreshCw, AlertCircle, X } from 'lucide-react'

const TaskForm = lazy(() => import('@/components/task-form').then(m => ({ default: m.TaskForm })))

function LoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col w-72 border-r p-4 gap-4 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="size-6 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="space-y-1 mt-4">
          <Skeleton className="h-4 w-16 mb-3" />
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <div className="space-y-1 mt-4">
          <Skeleton className="h-4 w-12 mb-3" />
          {[1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [formKey, setFormKey] = useState(0)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const loadData = useAppStore(s => s.loadData)
  const clearError = useAppStore(s => s.clearError)
  const isLoading = useAppStore(s => s.isLoading)
  const error = useAppStore(s => s.error)
  const currentView = useAppStore(s => s.currentView)
  const selectedListId = useAppStore(s => s.selectedListId)

  useEffect(() => {
    loadData()
  }, [loadData])

  useKeyboardShortcuts([
    {
      key: 'n',
      metaKey: true,
      handler: () => {
        setEditingTask(undefined)
        setFormKey(k => k + 1)
        setIsCreatingTask(true)
      },
    },
    {
      key: 'p',
      metaKey: true,
      handler: () => {
        setCommandPaletteOpen(true)
      },
    },
    {
      key: '/',
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]')
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      key: 'Escape',
      handler: () => {
        setCommandPaletteOpen(false)
        if (isCreatingTask || editingTask) {
          setIsCreatingTask(false)
          setEditingTask(undefined)
        }
      },
    },
  ])

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined)
    setFormKey(k => k + 1)
    setIsCreatingTask(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setFormKey(k => k + 1)
    setEditingTask(task)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsCreatingTask(false)
    setEditingTask(undefined)
  }, [])

  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem
    >
      <SidebarProvider>
        <div id="main-content" className="flex h-screen overflow-hidden bg-noise">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              className="flex flex-1 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <AppSidebar onCreateTask={handleCreateTask} />

              <SidebarInset className="flex-1 flex flex-col bg-grid-pattern">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  <ThemeToggle />
                </header>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 px-6 py-3 bg-destructive/5 border-b border-destructive/10 text-destructive text-sm"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span className="flex-1">{error}</span>
                      <Button
                        onClick={() => loadData()}
                        variant="outline"
                        size="sm"
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <RefreshCw className="size-3.5 mr-1.5" />
                        Retry
                      </Button>
                      <button
                        onClick={() => clearError()}
                        className="rounded-md p-1 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <X className="size-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentView}-${selectedListId || 'all'}`}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      <TaskList onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </SidebarInset>

              <Suspense fallback={null}>
                <TaskForm
                  key={formKey}
                  task={editingTask}
                  isOpen={isCreatingTask || !!editingTask}
                  onClose={handleCloseForm}
                />
              </Suspense>

              <CommandPalette
                open={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                onCreateTask={handleCreateTask}
              />
            </motion.div>
          )}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
