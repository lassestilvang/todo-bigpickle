'use client'

import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Task } from '@/types'
import { useAppStore } from '@/store'
import { TaskCard } from '@/components/task-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, SortAsc, SearchX, CheckCircle2, CalendarDays, CalendarRange, List, LayoutList } from 'lucide-react'
import { format } from 'date-fns'

const sortLabels = { date: 'Date', priority: 'Priority', name: 'Name', custom: 'Custom' } as const
const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }

const viewTitles = {
  today: 'Today',
  next7days: 'Next 7 Days',
  upcoming: 'Upcoming',
  all: 'All Tasks'
}

function getCurrentViewTitle(currentView: string, selectedListId: string | undefined, lists: { id: string; icon: string; name: string }[]) {
  if (selectedListId) {
    const list = lists.find(l => l.id === selectedListId)
    return list ? `${list.icon} ${list.name}` : 'Tasks'
  }
  
  return viewTitles[currentView as keyof typeof viewTitles] || 'Tasks'
}

interface TaskListProps {
  onCreateTask: () => void
  onEditTask: (task: Task) => void
}

export const TaskList = memo(function TaskList({ onCreateTask, onEditTask }: TaskListProps) {
  const getFilteredTasks = useAppStore(s => s.getFilteredTasks)
  const toggleTaskComplete = useAppStore(s => s.toggleTaskComplete)
  const deleteTask = useAppStore(s => s.deleteTask)
  const reorderTasks = useAppStore(s => s.reorderTasks)
  const addTask = useAppStore(s => s.addTask)
  const currentView = useAppStore(s => s.currentView)
  const selectedListId = useAppStore(s => s.selectedListId)
  const showCompleted = useAppStore(s => s.showCompleted)
  const searchQuery = useAppStore(s => s.searchQuery)
  const allTasks = useAppStore(s => s.tasks)
  const lists = useAppStore(s => s.lists)
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'name' | 'custom'>('custom')
  const [quickAddText, setQuickAddText] = useState('')
  const quickAddRef = useRef<HTMLInputElement>(null)
  const [customOrder, setCustomOrder] = useState<Record<string, Task[]>>({})
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(-1)

  // Focus quick-add on Ctrl+K or Cmd+K
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

  const tasks = useMemo(
    () => getFilteredTasks(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFilteredTasks, allTasks, currentView, selectedListId, showCompleted, searchQuery]
  )
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

  // Sync custom order from grouped tasks when sort mode changes or tasks change
  // This ensures Reorder has stable references for drag-and-drop animations
  useEffect(() => {
    if (sortBy === 'custom') {
      setCustomOrder(prev => {
        const next: Record<string, Task[]> = {}
        for (const [key, group] of Object.entries(groupedTasks)) {
          const currentIds = new Set(prev[key]?.map(t => t.id) || [])
          const newIds = new Set(group.tasks.map(t => t.id))
          const sameIds = currentIds.size === newIds.size &&
            group.tasks.every(t => currentIds.has(t.id))

          if (sameIds && prev[key]) {
            next[key] = prev[key]
          } else {
            next[key] = group.tasks
          }
        }
        return next
      })
    }
  }, [sortBy, groupedTasks])

  // Keyboard navigation between tasks
  useEffect(() => {
    const allTasks = Object.values(groupedTasks).flatMap(g => g.tasks)
    if (allTasks.length === 0) return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target?.matches?.('input, textarea, select, [contenteditable], [contenteditable] *')
      if (isInput && !e.metaKey && !e.ctrlKey) return

      const tasks = Object.values(groupedTasks).flatMap(g => g.tasks)
      if (tasks.length === 0) return

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedTaskIndex(prev => {
          const next = e.key === 'ArrowDown'
            ? Math.min(prev + 1, tasks.length - 1)
            : Math.max(prev - 1, 0)
          const cards = document.querySelectorAll<HTMLElement>('[data-task-card]')
          cards[next]?.focus()
          cards[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          return next
        })
      } else if (e.key === 'Enter' && focusedTaskIndex >= 0 && tasks[focusedTaskIndex]) {
        const isInCard = target?.closest('[data-task-card]')
        if (isInCard && !isInput) {
          e.preventDefault()
          onEditTask(tasks[focusedTaskIndex])
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [groupedTasks, focusedTaskIndex, onEditTask])

  const cycleSort = useCallback(() => {
    setSortBy(prev => prev === 'date' ? 'priority' : prev === 'priority' ? 'name' : prev === 'name' ? 'custom' : 'date')
  }, [])

  const handleReorder = useCallback((group: typeof sortedTasks) => {
    const updates = group.map((task, idx) => ({
      id: task.id,
      position: idx,
    }))
    reorderTasks(updates)
  }, [reorderTasks])

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">{getCurrentViewTitle(currentView, selectedListId, lists)}</h1>
            <p className="text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {completedCount > 0 && ` (${completedCount} completed)`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cycleSort}
            >
              <SortAsc className="size-4 mr-2" />
              {sortLabels[sortBy]}
            </Button>
            
            <Button onClick={onCreateTask}>
              <Plus className="size-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Quick Add */}
        <div className="relative mb-6">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
            className="pl-9 h-12 text-base bg-muted/50 border-dashed focus:bg-background transition-colors"
          />
        </div>

        {/* Task Groups */}
        <AnimatePresence mode="wait">
          {Object.entries(groupedTasks).length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              {searchQuery ? (
                <div className="text-muted-foreground">
                  <SearchX className="size-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium mb-1">No results found</p>
                  <p className="text-sm">No tasks match &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : allTasks.length === 0 ? (
                <div className="text-muted-foreground">
                  {(() => {
                    const Icon = currentView === 'today' ? CalendarDays
                      : currentView === 'next7days' ? CalendarRange
                      : currentView === 'upcoming' ? List
                      : LayoutList
                    return <Icon className="size-16 mx-auto mb-4 text-muted-foreground/20" />
                  })()}
                  <p className="text-lg font-medium mb-1">
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
                  <p className="text-sm mb-6">
                    {selectedListId
                      ? 'Add a task to get started'
                      : currentView === 'today'
                        ? 'Schedule a task for today'
                        : 'Create your first task and get things done'}
                  </p>
                  <Button onClick={onCreateTask} size="lg">
                    <Plus className="size-4 mr-2" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500/40" />
                  <p className="text-lg font-medium mb-1">
                    {currentView === 'today'
                      ? 'All done for today!'
                      : currentView === 'next7days'
                        ? 'All set for the week!'
                        : currentView === 'upcoming'
                          ? 'Nothing upcoming'
                          : 'All done!'}
                  </p>
                  <p className="text-sm">
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
            </motion.div>
          ) : (
            Object.entries(groupedTasks).map(([groupKey, group], idx) => (
              <motion.div
                key={groupKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="mb-8"
              >
                {group.date && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      {format(group.date, 'EEEE, MMMM d')}
                    </h2>
                  </div>
                )}
                
                <Reorder.Group
                  axis="y"
                  values={customOrder[groupKey] || group.tasks}
                  onReorder={(reordered) => {
                    if (sortBy !== 'custom') return
                    const key = groupKey
                    setCustomOrder(prev => ({ ...prev, [key]: reordered }))
                    handleReorder(reordered)
                  }}
                  className="space-y-3"
                  layoutScroll
                >
                  {(customOrder[groupKey] || group.tasks).map((task) => (
                    <Reorder.Item
                      key={task.id}
                      value={task}
                      dragListener={sortBy === 'custom'}
                      data-reorder-item
                      style={{ listStyle: 'none' }}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onEdit={onEditTask}
                        onDelete={deleteTask}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
