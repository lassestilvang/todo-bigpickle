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
import { AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertCircle, X } from 'lucide-react'

const TaskForm = lazy(() => import('@/components/task-form').then(m => ({ default: m.TaskForm })))
const CommandPalette = lazy(() => import('@/components/command-palette').then(m => ({ default: m.CommandPalette })))

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

export default function HomeClient() {
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [formKey, setFormKey] = useState(0)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const loadData = useAppStore(s => s.loadData)
  const clearError = useAppStore(s => s.clearError)
  const isLoading = useAppStore(s => s.isLoading)
  const error = useAppStore(s => s.error)

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
            <div className="flex flex-1 overflow-hidden animate-fade-in">
              <AppSidebar onCreateTask={handleCreateTask} />

              <SidebarInset className="flex-1 flex flex-col bg-grid-pattern">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/70 backdrop-blur-xl sticky top-0 z-10 supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  <ThemeToggle />
                </header>

                <AnimatePresence>
                  {error && (
                    <div role="alert" className="flex items-center gap-3 px-6 py-3 bg-destructive/5 border-b border-destructive/10 text-destructive text-sm animate-in">
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
                        type="button"
                        onClick={() => clearError()}
                        className="rounded-md p-1 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </AnimatePresence>

                <div data-main-content className="flex-1 overflow-y-auto">
                  <div className="animate-fade-slide-in">
                    <TaskList onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
                  </div>
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

              <Suspense fallback={null}>
                <CommandPalette
                  open={commandPaletteOpen}
                  onClose={() => setCommandPaletteOpen(false)}
                  onCreateTask={handleCreateTask}
                />
              </Suspense>
            </div>
          )}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
