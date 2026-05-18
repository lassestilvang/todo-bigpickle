'use client'

import { useState, useMemo, useCallback } from 'react'
import { Task } from '@/types'
import { useAppStore } from '@/store'
import { TaskCard } from '@/components/task-card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ListTodo, SortAsc } from 'lucide-react'
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
        <AnimatePresence>
          {Object.entries(groupedTasks).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-muted-foreground mb-4">
                <ListTodo className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No tasks found</p>
                <p className="text-sm">Create a new task to get started</p>
              </div>
              <Button onClick={onCreateTask}>
<Plus className="size-4 mr-2" />
                Create Your First Task
              </Button>
            </motion.div>
          ) : (
            Object.entries(groupedTasks).map(([groupKey, group]) => (
              <motion.div
                key={groupKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
