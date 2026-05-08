'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TaskList } from '@/components/task-list'
import { TaskForm } from '@/components/task-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { useAppStore } from '@/store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Task } from '@/types'

export default function Home() {
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [formKey, setFormKey] = useState(0)
  const { loadData, isLoading, error } = useAppStore()

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

  if (isLoading) {
    return (
      <ThemeProvider
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </SidebarProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <div id="main-content" className="flex h-screen overflow-hidden">
          <AppSidebar onCreateTask={handleCreateTask} />
          
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1" />
              <ThemeToggle />
            </header>
            
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm">
                {error}
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
      </SidebarProvider>
    </ThemeProvider>
  )
}
