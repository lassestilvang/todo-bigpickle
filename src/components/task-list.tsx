'use client'

import { useState, useMemo, useCallback } from 'react'
import { Task } from '@/types'
import { useAppStore } from '@/store'
import { TaskCard } from '@/components/task-card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ListTodo, SortAsc, SearchX, CheckCircle2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

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

export function TaskList({ onCreateTask, onEditTask }: TaskListProps) {
  const getFilteredTasks = useAppStore(s => s.getFilteredTasks)
  const toggleTaskComplete = useAppStore(s => s.toggleTaskComplete)
  const deleteTask = useAppStore(s => s.deleteTask)
  const currentView = useAppStore(s => s.currentView)
  const selectedListId = useAppStore(s => s.selectedListId)
  const showCompleted = useAppStore(s => s.showCompleted)
  const searchQuery = useAppStore(s => s.searchQuery)
  const allTasks = useAppStore(s => s.tasks)
  const lists = useAppStore(s => s.lists)
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'name'>('date')

  const tasks = useMemo(
    () => getFilteredTasks(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFilteredTasks, allTasks, currentView, selectedListId, showCompleted, searchQuery]
  )
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  
  const sortedTasks = useMemo(() => {
    const sorted = tasks.toSorted((a, b) => {
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
    return sorted
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

  const cycleSort = useCallback(() => {
    setSortBy(prev => prev === 'date' ? 'priority' : prev === 'priority' ? 'name' : 'date')
  }, [])

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
              Sort: {sortBy === 'date' ? 'Date' : sortBy === 'priority' ? 'Priority' : 'Name'}
            </Button>
            
            <Button onClick={onCreateTask}>
              <Plus className="size-4 mr-2" />
              Add Task
            </Button>
          </div>
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
                  <div className="relative mx-auto mb-6 size-24">
                    <ListTodo className="size-24 text-muted-foreground/20" />
                    <Sparkles className="size-6 text-primary absolute top-1 right-1" />
                  </div>
                  <p className="text-xl font-medium mb-1">Your task list is empty</p>
                  <p className="text-sm mb-6">Create your first task and get things done</p>
                  <Button onClick={onCreateTask} size="lg">
                    <Plus className="size-4 mr-2" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500/40" />
                  <p className="text-lg font-medium mb-1">All done!</p>
                  <p className="text-sm">No uncompleted tasks match this view</p>
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
                
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleTaskComplete}
                      onEdit={onEditTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
