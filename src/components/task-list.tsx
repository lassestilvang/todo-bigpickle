'use client'

import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Task } from '@/types'
import { useAppStore, useShallow } from '@/store'
import { TaskCard } from '@/components/task-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reorder } from 'framer-motion'
import Fuse from 'fuse.js'
import { Plus, ArrowUpDown, SearchX, CheckCircle2, CalendarDays, CalendarRange, List, LayoutList, Sparkles, ChevronUp } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

const sortLabels = { date: 'Date', priority: 'Priority', name: 'Name', custom: 'Custom' } as const
const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }

const viewTitles = {
  today: 'Today',
  next7days: 'Next 7 Days',
  upcoming: 'Upcoming',
  all: 'All Tasks',
}

const viewIcons = {
  today: CalendarDays,
  next7days: CalendarRange,
  upcoming: List,
  all: LayoutList,
} as const

function getCurrentViewTitle(currentView: string, selectedListId: string | undefined, lists: { id: string; icon: string; name: string }[]) {
  if (selectedListId) {
    const list = lists.find(l => l.id === selectedListId)
    return list ? `${list.icon} ${list.name}` : 'Tasks'
  }
  return viewTitles[currentView as keyof typeof viewTitles] || 'Tasks'
}

function formatGroupDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

interface TaskListProps {
  onCreateTask: () => void
  onEditTask: (task: Task) => void
}

interface TaskGroupProps {
  groupKey: string
  tasks: Task[]
  hasDate: boolean
  date: Date | null
  customOrderTasks: Task[] | undefined
  sortBy: string
  onReorder: (groupKey: string, tasks: Task[]) => void
  onToggleComplete: (id: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
}

const TaskGroup = memo(function TaskGroup({
  tasks, hasDate, date, customOrderTasks, groupKey,
  sortBy, onReorder, onToggleComplete, onEditTask, onDeleteTask,
}: TaskGroupProps & { groupKey: string }) {
  return (
    <div data-task-group className="mb-8">
      {hasDate && date && (
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border/50" />
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            {formatGroupDate(date)}
          </h2>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      )}

      <Reorder.Group
        axis="y"
        values={customOrderTasks || tasks}
        onReorder={(reordered) => onReorder(groupKey, reordered)}
        className="space-y-2"
        layoutScroll
      >
        {(customOrderTasks || tasks).map((task) => (
          <Reorder.Item
            key={task.id}
            value={task}
            dragListener={sortBy === 'custom'}
            data-reorder-item
            style={{ listStyle: 'none' }}
          >
            <TaskCard
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}, (prev, next) => {
  if (prev.groupKey !== next.groupKey) return false
  if (prev.sortBy !== next.sortBy) return false
  if (prev.tasks.length !== next.tasks.length) return false
  return prev.tasks.length === next.tasks.length && prev.tasks.every((t, i) => t.id === next.tasks[i].id && t.completed === next.tasks[i].completed && t.position === next.tasks[i].position)
})

export const TaskList = memo(function TaskList({ onCreateTask, onEditTask }: TaskListProps) {
  const toggleTaskComplete = useAppStore(s => s.toggleTaskComplete)
  const deleteTask = useAppStore(s => s.deleteTask)
  const reorderTasks = useAppStore(s => s.reorderTasks)
  const addTask = useAppStore(s => s.addTask)
  const currentView = useAppStore(s => s.currentView)
  const selectedListId = useAppStore(s => s.selectedListId)
  const showCompleted = useAppStore(s => s.showCompleted)
  const searchQuery = useAppStore(s => s.searchQuery)
  const allTasks = useAppStore(useShallow(s => s.tasks))
  const lists = useAppStore(useShallow(s => s.lists))
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'name' | 'custom'>('custom')
  const [quickAddText, setQuickAddText] = useState('')
  const quickAddRef = useRef<HTMLInputElement>(null)
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1)
  const focusedTaskIndexRef = useRef(focusedTaskIndex)
  focusedTaskIndexRef.current = focusedTaskIndex
  const flatTasksRef = useRef<Task[]>([])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        quickAddRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleQuickAdd = useCallback(async () => {
    const name = quickAddText.trim()
    if (!name) return
    try {
      const defaultList = lists.find(l => l.isDefault)
      await addTask({
        name,
        description: undefined,
        priority: 'none',
        listId: selectedListId || defaultList?.id || '',
        completed: false,
        labels: [],
        subtasks: [],
      })
      setQuickAddText('')
    } catch {
      // Error handled by store
    }
  }, [quickAddText, addTask, lists, selectedListId])

  // Step 1: filter by view/status/completed (no search)
  const baseTasks = useMemo(() => {
    let filtered = allTasks

    if (selectedListId) {
      filtered = filtered.filter(task => task.listId === selectedListId)
    } else {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      switch (currentView) {
        case 'today':
          filtered = filtered.filter(task => {
            if (!task.date) return false
            const d = new Date(task.date)
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            return dateOnly.getTime() === today.getTime()
          })
          break
        case 'next7days':
          filtered = filtered.filter(task => {
            if (!task.date) return false
            const d = new Date(task.date)
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            return dateOnly >= today && dateOnly <= nextWeek
          })
          break
        case 'upcoming':
          filtered = filtered.filter(task => {
            if (!task.date) return false
            const d = new Date(task.date)
            const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            return dateOnly >= today
          })
          break
      }
    }

    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed)
    }

    return filtered
  }, [allTasks, currentView, selectedListId, showCompleted])

  // Step 2: apply Fuse.js search on top of baseTasks
  const hasQuery = !!searchQuery
  const fuse = useMemo(() =>
    hasQuery ? new Fuse(baseTasks, {
      keys: ['name', 'description'],
      threshold: 0.3,
    }) : null,
  [baseTasks, hasQuery])
  const tasks = useMemo(() => {
    if (!searchQuery || !fuse) return baseTasks
    return fuse.search(searchQuery).map(r => r.item)
  }, [baseTasks, searchQuery, fuse])
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks])

  const sortedTasks = useMemo(() => {
    if (sortBy === 'custom') return tasks
    return tasks.toSorted((a, b) => {
      switch (sortBy) {
        case 'date':
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return a.date.getTime() - b.date.getTime()
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [tasks, sortBy])

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { date: Date | null; tasks: Task[] }> = {}
    for (const task of sortedTasks) {
      if (currentView === 'today' || currentView === 'next7days' || currentView === 'upcoming') {
        const dateKey = task.date ? format(task.date, 'yyyy-MM-dd') : 'no-date'
        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: task.date || null,
            tasks: []
          }
        }
        groups[dateKey].tasks.push(task)
      } else {
        if (!groups['all']) {
          groups['all'] = { date: null, tasks: [] }
        }
        groups['all'].tasks.push(task)
      }
    }
    return groups
  }, [sortedTasks, currentView])

  // Stable content-based key to prevent unnecessary effect re-runs
  // Keep ref updated
  useEffect(() => {
    flatTasksRef.current = Object.values(groupedTasks).flatMap(g => g.tasks)
  })

  const customOrder = useMemo(() => {
    if (sortBy !== 'custom') return {}
    const next: Record<string, Task[]> = {}
    for (const [key, group] of Object.entries(groupedTasks)) {
      next[key] = group.tasks
    }
    return next
  }, [sortBy, groupedTasks])

  const onEditRef = useRef(onEditTask)
  onEditRef.current = onEditTask

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target?.matches?.('input, textarea, select, [contenteditable], [contenteditable] *')
      if (isInput && !e.metaKey && !e.ctrlKey) return

      const currentTasks = flatTasksRef.current
      if (currentTasks.length === 0) return

      const currentIndex = focusedTaskIndexRef.current

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedTaskIndex(prev => {
          const next = e.key === 'ArrowDown'
            ? Math.min(prev + 1, currentTasks.length - 1)
            : Math.max(prev - 1, 0)
          const cards = document.querySelectorAll<HTMLElement>('[data-task-card]')
          cards[next]?.focus()
          cards[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          return next
        })
      } else if (e.key === 'Enter' && currentIndex >= 0 && currentTasks[currentIndex]) {
        const isInCard = target?.closest('[data-task-card]')
        if (isInCard && !isInput) {
          e.preventDefault()
          onEditRef.current(currentTasks[currentIndex])
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const cycleSort = useCallback(() => {
    setSortBy(prev => prev === 'date' ? 'priority' : prev === 'priority' ? 'name' : prev === 'name' ? 'custom' : 'date')
  }, [])

  const handleReorder = useCallback((group: Task[]) => {
    const updates = group.map((task, idx) => ({
      id: task.id,
      position: idx,
    }))
    reorderTasks(updates)
  }, [reorderTasks])

  const handleGroupReorder = useCallback((_groupKey: string, reordered: Task[]) => {
    handleReorder(reordered)
  }, [handleReorder])

  const handleToggleComplete = useCallback((id: string) => {
    toggleTaskComplete(id)
  }, [toggleTaskComplete])

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id)
  }, [deleteTask])

  const ViewIcon = viewIcons[currentView as keyof typeof viewIcons] || LayoutList
  const isEmpty = Object.entries(groupedTasks).length === 0

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/5">
                <ViewIcon className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{getCurrentViewTitle(currentView, selectedListId, lists)}</h1>
                <p className="text-sm text-muted-foreground">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  {completedCount > 0 && ` (${completedCount} completed)`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cycleSort}
              className="transition-all duration-200"
            >
              <ArrowUpDown className="size-3.5 mr-1.5" />
              {sortLabels[sortBy]}
            </Button>

            <Button onClick={onCreateTask} size="sm" className="transition-all duration-200 hover:scale-105 active:scale-95">
              <Plus className="size-4 mr-1.5" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Quick Add */}
        <div className="relative mb-8 group">
          <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors duration-200" />
          <Input
            ref={quickAddRef}
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleQuickAdd()
              }
            }}
            placeholder={`Add a task to "${getCurrentViewTitle(currentView, selectedListId, lists)}"…`}
            className="pl-10 h-12 text-base bg-muted/30 border-dashed border-muted-foreground/25
              focus:bg-background focus:border-primary/50 focus:shadow-sm focus:shadow-primary/10
              transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
            ⌘K
          </kbd>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        {/* Task Groups */}
        {isEmpty ? (
          <div className="text-center py-20 animate-fade-in">
            {searchQuery ? (
              <div className="text-muted-foreground animate-fade-in">
                <div className="relative mx-auto mb-6 size-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted-foreground/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SearchX className="size-10 text-muted-foreground/30" />
                  </div>
                </div>
                <p className="text-lg font-medium mb-1">No results found</p>
                <p className="text-sm text-muted-foreground/70">
                  No tasks match &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : allTasks.length === 0 ? (
              <div className="text-muted-foreground animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="relative mx-auto mb-8 size-36">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-primary/8 to-transparent animate-pulse" style={{ animationDuration: '0.8s' }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/8 to-transparent animate-pulse" style={{ animationDuration: '0.8s', animationDelay: '0.5s', transform: 'scale(0.8)' }} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/[0.03] to-transparent" style={{ transform: 'scale(0.6)' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="size-14 text-primary/30" />
                  </div>
                </div>
                <p className="text-xl font-medium mb-2">
                  {selectedListId
                    ? 'This list is empty'
                    : currentView === 'today'
                      ? 'No tasks for today'
                      : currentView === 'next7days'
                        ? 'Nothing this week'
                        : currentView === 'upcoming'
                          ? 'No upcoming tasks'
                          : 'Your task list is empty'}
                </p>
                <p className="text-sm text-muted-foreground/70 mb-8">
                  {selectedListId
                    ? 'Add a task to get started'
                    : currentView === 'today'
                      ? 'Schedule a task for today'
                      : 'Create your first task and get things done'}
                </p>
                <Button onClick={onCreateTask} size="lg" className="transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                  <Plus className="size-4 mr-2" />
                  Create Your First Task
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="relative mx-auto mb-6 size-24">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="size-12 text-emerald-500/40" />
                  </div>
                  <div className="absolute -top-1 -right-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                    <span className="text-lg">✨</span>
                  </div>
                </div>
                <p className="text-lg font-medium mb-1">
                  {currentView === 'today'
                    ? 'All done for today!'
                    : currentView === 'next7days'
                      ? 'All set for the week!'
                      : currentView === 'upcoming'
                        ? 'Nothing upcoming'
                        : 'All done!'}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {currentView === 'today'
                    ? 'Enjoy your free time'
                    : currentView === 'next7days'
                      ? 'Enjoy your week'
                      : currentView === 'upcoming'
                        ? 'No tasks on the horizon'
                        : showCompleted ? 'No tasks match your filters' : 'No uncompleted tasks'}
                </p>
              </div>
            )}
          </div>
        ) : (
          Object.entries(groupedTasks).map(([groupKey, group]) => (
              <TaskGroup
                key={groupKey}
                groupKey={groupKey}
                tasks={group.tasks}
                hasDate={!!group.date}
                date={group.date}
                customOrderTasks={customOrder[groupKey]}
                sortBy={sortBy}
                onReorder={handleGroupReorder}
                onToggleComplete={handleToggleComplete}
                onEditTask={onEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))
          )}

        {/* Scroll to top */}
        {tasks.length > 5 && (
          <button
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 animate-fade-slide-in
              flex items-center gap-1.5 px-5 py-2.5 rounded-full
              bg-background/80 backdrop-blur-lg border shadow-lg text-xs text-muted-foreground
              hover:text-foreground hover:shadow-xl hover:-translate-y-1
              transition-all duration-200"
            onClick={() => {
              const container = document.querySelector('[data-main-content]')
              container?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="Scroll to top"
          >
            <ChevronUp className="size-3.5" />
            Back to top
          </button>
        )}
      </div>
    </div>
  )
})
