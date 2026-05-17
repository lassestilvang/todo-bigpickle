'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TaskList } from '@/components/task-list'
import { TaskForm } from '@/components/task-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Task } from '@/types'

export default function Home() {
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [formKey, setFormKey] = useState(0)
  const loadData = useAppStore(s => s.loadData)
  const isLoading = useAppStore(s => s.isLoading)
  const error = useAppStore(s => s.error)

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

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setFormKey(k => k + 1)
    setIsCreatingTask(true)
  }

  const handleEditTask = (task: Task) => {
    setFormKey(k => k + 1)
    setEditingTask(task)
  }

  const handleCloseForm = () => {
    setIsCreatingTask(false)
    setEditingTask(undefined)
  }

  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        {isLoading ? (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div id="main-content" className="flex h-screen overflow-hidden">
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
            </div>

            <TaskForm
              key={formKey}
              task={editingTask}
              isOpen={isCreatingTask || !!editingTask}
              onClose={handleCloseForm}
            />
          </>
        )}
      </SidebarProvider>
    </ThemeProvider>
  )
}
