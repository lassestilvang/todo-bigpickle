'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TaskList } from '@/components/task-list'
import { TaskForm } from '@/components/task-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { useAppStore, shallow } from '@/store'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Task } from '@/types'
import { motion } from 'framer-motion'

function LoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col w-72 border-r p-4 gap-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="size-6 rounded" />
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
  const loadData = useAppStore(s => s.loadData)
  const { isLoading, error } = useAppStore(s => ({
    isLoading: s.isLoading,
    error: s.error,
  }), shallow)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Keyboard shortcuts
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
      key: '/',
      handler: () => {
        const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      key: 'Escape',
      handler: () => {
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
          <div id="main-content" className="flex h-screen overflow-hidden">
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
                
                <SidebarInset className="flex-1">
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1" />
                    <ThemeToggle />
                  </header>
                  
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive text-sm">
                      <span className="flex-1">{error}</span>
                      <Button
                        onClick={() => loadData()}
                        variant="destructive"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  
                  <TaskList onCreateTask={handleCreateTask} onEditTask={handleEditTask} />
                </SidebarInset>

                <TaskForm
                  key={formKey}
                  task={editingTask}
                  isOpen={isCreatingTask || !!editingTask}
                  onClose={handleCloseForm}
                />
              </motion.div>
            )}
          </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
