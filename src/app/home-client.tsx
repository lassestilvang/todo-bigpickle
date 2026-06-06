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
import { useNotifications } from '@/hooks/use-notifications'
import { Task } from '@/types'
import { AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertCircle, X, Search, Maximize2, Minimize2 } from 'lucide-react'

const TaskForm = lazy(() => import('@/components/task-form').then(m => ({ default: m.TaskForm })))
const CommandPalette = lazy(() => import('@/components/command-palette').then(m => ({ default: m.CommandPalette })))
const TaskPreview = lazy(() => import('@/components/task-preview').then(m => ({ default: m.TaskPreview })))
const ShortcutCheatSheet = lazy(() => import('@/components/shortcut-cheat-sheet').then(m => ({ default: m.ShortcutCheatSheet })))

function LoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      <div className="flex flex-col w-72 border-r p-4 gap-4 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="size-6 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="space-y-1 mt-4">
          <Skeleton className="h-4 w-16 mb-3" />
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
        <div className="space-y-1 mt-4">
          <Skeleton className="h-4 w-12 mb-3" />
          {[1, 2].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" style={{ animationDelay: `${400 + i * 60}ms` }} />)}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        {[{ w: 'w-40' }, { w: 'w-48' }, { w: 'w-36' }, { w: 'w-44' }].map((item, i) => (
          <div key={i} className="space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
            <Skeleton className={`h-5 ${item.w} rounded-lg`} />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskPreviewSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background/80 backdrop-blur-sm absolute inset-0" />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="size-8 rounded-md shrink-0" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskFormSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background/80 backdrop-blur-sm absolute inset-0" />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="size-8 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CommandPaletteSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="bg-background/80 backdrop-blur-sm absolute inset-0" />
      <div className="relative bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <Search className="size-4 text-muted-foreground/50" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="size-5 rounded" />
          </div>
        </div>
        <div className="border-t p-2 space-y-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Skeleton className="size-4 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomeClient() {
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [previewTask, setPreviewTask] = useState<Task | undefined>()
  const [formKey, setFormKey] = useState(0)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutCheatSheetOpen, setShortcutCheatSheetOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const loadData = useAppStore(s => s.loadData)
  const clearError = useAppStore(s => s.clearError)
  const isLoading = useAppStore(s => s.isLoading)
  const error = useAppStore(s => s.error)
  const deleteTask = useAppStore(s => s.deleteTask)
  const toggleTaskComplete = useAppStore(s => s.toggleTaskComplete)
  const toggleSubtask = useAppStore(s => s.toggleSubtask)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const showCompleted = useAppStore(s => s.showCompleted)
  useNotifications()

  const searchQuery = useAppStore(s => s.searchQuery)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const setFocusMode = useAppStore(s => s.setFocusMode)
  const focusMode = useAppStore(s => s.focusMode)
  const addTask = useAppStore(s => s.addTask)
  const lists = useAppStore(s => s.lists)

  // Handle custom events from Command Palette
  useEffect(() => {
    const handlePreview = (e: any) => setPreviewTask(e.detail)
    const handleQuickAdd = async (e: any) => {
      const defaultList = lists.find(l => l.isDefault)
      await addTask({
        name: e.detail,
        priority: 'none',
        listId: defaultList?.id || '',
        completed: false,
        labels: [],
        subtasks: [],
      })
    }
    window.addEventListener('preview-task', handlePreview)
    window.addEventListener('quick-add-task', handleQuickAdd)
    return () => {
      window.removeEventListener('preview-task', handlePreview)
      window.removeEventListener('quick-add-task', handleQuickAdd)
    }
  }, [addTask, lists])

  // Exit focus mode when sidebar is opened manually
  useEffect(() => {
    if (sidebarOpen && focusMode) {
      setFocusMode(false)
    }
  }, [sidebarOpen, focusMode, setFocusMode])

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
      key: ',',
      metaKey: true,
      handler: () => {
        setCommandPaletteOpen(true)
      },
    },
    {
      key: '.',
      metaKey: true,
      handler: () => {
        setFocusMode(!focusMode)
      },
    },
    {
      key: '/',
      shiftKey: true,
      metaKey: true,
      handler: () => {
        setShortcutCheatSheetOpen(true)
      },
    },
    {
      key: 'n',
      handler: () => {
        const quickAdd = document.querySelector<HTMLInputElement>('[data-quick-add]')
        if (quickAdd) quickAdd.focus()
      },
    },
    {
      key: '/',
      shiftKey: true,
      handler: () => {
        setShortcutCheatSheetOpen(true)
      },
    },
    {
      key: '/',
      shiftKey: false,
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]')
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      key: 'f',
      metaKey: true,
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search tasks"]')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      },
    },
    {
      key: 'b',
      metaKey: true,
      handler: () => setSidebarOpen(prev => !prev),
    },
    {
      key: 'h',
      metaKey: true,
      shiftKey: true,
      handler: () => setShowCompleted(!showCompleted),
    },
    // View switching: ⌥1-4 (Alt+1-4)
    { key: '1', altKey: true, handler: () => { useAppStore.getState().setCurrentView('today'); useAppStore.getState().setSelectedListId(undefined) } },
    { key: '2', altKey: true, handler: () => { useAppStore.getState().setCurrentView('next7days'); useAppStore.getState().setSelectedListId(undefined) } },
    { key: '3', altKey: true, handler: () => { useAppStore.getState().setCurrentView('upcoming'); useAppStore.getState().setSelectedListId(undefined) } },
    { key: '4', altKey: true, handler: () => { useAppStore.getState().setCurrentView('all'); useAppStore.getState().setSelectedListId(undefined) } },
    {
      key: 'Escape',
      handler: () => {
        setCommandPaletteOpen(false)
        setShortcutCheatSheetOpen(false)
        if (previewTask) {
          setPreviewTask(undefined)
        } else if (isCreatingTask || editingTask) {
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

  const handlePreviewTask = useCallback((task: Task) => {
    setPreviewTask(task)
  }, [])

  const handleEditFromPreview = useCallback((task: Task) => {
    setPreviewTask(undefined)
    setFormKey(k => k + 1)
    setEditingTask(task)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsCreatingTask(false)
    setEditingTask(undefined)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewTask(undefined)
  }, [])

  const handleNavigatePreview = useCallback((direction: 'prev' | 'next') => {
    setPreviewTask(prev => {
      if (!prev) return prev
      const { tasks } = useAppStore.getState()
      const visibleTasks = tasks.filter(t => !t.completed)
      const idx = visibleTasks.findIndex(t => t.id === prev.id)
      if (direction === 'prev' && idx > 0) return visibleTasks[idx - 1]
      if (direction === 'next' && idx < visibleTasks.length - 1) return visibleTasks[idx + 1]
      return prev
    })
  }, [])

  return (
    <ThemeProvider
      defaultTheme="system"
      enableSystem
    >
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div id="main-content" className="flex h-screen overflow-hidden bg-noise">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="flex flex-1 overflow-hidden animate-fade-in">
              <AppSidebar onCreateTask={handleCreateTask} />

                  <SidebarInset className={`flex-1 flex flex-col bg-grid-pattern transition-all duration-700 ease-in-out ${focusMode ? 'scale-[0.98] rounded-2xl shadow-2xl ring-1 ring-border/50' : ''}`}>
                    {focusMode && (
                      <div className="absolute inset-0 pointer-events-none z-50 rounded-2xl ring-inset ring-[40px] ring-background/20 blur-2xl opacity-50" />
                    )}
                    <header className={`flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/70 backdrop-blur-xl sticky top-0 z-20 transition-all duration-500 supports-[backdrop-filter]:bg-background/60 ${focusMode ? 'rounded-t-2xl' : ''}`}>
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1 flex items-center justify-center max-w-md mx-auto">
                    <div className="relative w-full max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
                      <input
                        type="search"
                        placeholder="Search tasks..."
                        aria-label="Search tasks"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-8 pr-8 text-sm rounded-md bg-muted/50 border border-muted-foreground/20 focus:bg-background focus:border-primary/40 transition-all duration-200 outline-none [&::-webkit-search-cancel-button]:hidden placeholder:text-muted-foreground/50"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = !focusMode
                      setFocusMode(next)
                      if (next) setSidebarOpen(false)
                      else setSidebarOpen(true)
                    }}
                    className={`text-muted-foreground/60 hover:text-foreground transition-all duration-200 ${
                      focusMode ? 'text-primary bg-primary/5' : ''
                    }`}
                    aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
                  >
                    {focusMode ? <Minimize2 className="size-3.5 mr-1.5" /> : <Maximize2 className="size-3.5 mr-1.5" />}
                    {focusMode ? 'Exit Focus' : 'Focus'}
                    <kbd className="ml-1.5 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground/60">
                      ⌘.
                    </kbd>
                  </Button>
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
                    <TaskList onCreateTask={handleCreateTask} onEditTask={handlePreviewTask} />
                  </div>
                </div>
              </SidebarInset>

              <Suspense fallback={<TaskPreviewSkeleton />}>
                <TaskPreview
                  task={previewTask}
                  isOpen={!!previewTask}
                  onClose={handleClosePreview}
                  onEdit={handleEditFromPreview}
                  onDelete={(id) => {
                    deleteTask(id)
                    setPreviewTask(undefined)
                  }}
                  onToggleComplete={toggleTaskComplete}
                  onToggleSubtask={toggleSubtask}
                  onNavigate={handleNavigatePreview}
                />
              </Suspense>

              <Suspense fallback={<TaskFormSkeleton />}>
                <TaskForm
                  key={formKey}
                  task={editingTask}
                  isOpen={isCreatingTask || !!editingTask}
                  onClose={handleCloseForm}
                />
              </Suspense>

              <Suspense fallback={<CommandPaletteSkeleton />}>
                <CommandPalette
                  open={commandPaletteOpen}
                  onClose={() => setCommandPaletteOpen(false)}
                  onCreateTask={handleCreateTask}
                />
              </Suspense>

              <Suspense fallback={null}>
                <ShortcutCheatSheet
                  open={shortcutCheatSheetOpen}
                  onClose={() => setShortcutCheatSheetOpen(false)}
                />
              </Suspense>
            </div>
          )}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
