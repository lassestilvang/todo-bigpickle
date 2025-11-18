'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { useAppStore } from '@/store'
import { TaskCard } from '@/components/task-card'
import { TaskForm } from '@/components/task-form'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, SortAsc } from 'lucide-react'
import { format } from 'date-fns'

export function TaskList() {
  const { getFilteredTasks, toggleTaskComplete, currentView, selectedListId, lists } = useAppStore()
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'name'>('date')

  const tasks = getFilteredTasks()
  
  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const getCurrentViewTitle = () => {
    if (selectedListId) {
      const list = lists.find(l => l.id === selectedListId)
      return list ? `${list.icon} ${list.name}` : 'Tasks'
    }
    
    const viewTitles = {
      today: 'Today',
      next7days: 'Next 7 Days',
      upcoming: 'Upcoming',
      all: 'All Tasks'
    }
    return viewTitles[currentView]
  }

  const groupedTasks = sortedTasks.reduce((groups, task) => {
    if (currentView === 'today' || currentView === 'next7days' || currentView === 'upcoming') {
      const dateKey = task.date ? format(new Date(task.date), 'yyyy-MM-dd') : 'no-date'
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: task.date || null,
          tasks: []
        }
      }
      groups[dateKey].tasks.push(task)
    } else {
      groups['all'] = { date: null, tasks: [...(groups['all']?.tasks || []), task] }
    }
    return groups
  }, {} as Record<string, { date: Date | null; tasks: Task[] }>)

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{getCurrentViewTitle()}</h1>
            <p className="text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {tasks.filter(t => t.completed).length > 0 && 
                ` (${tasks.filter(t => t.completed).length} completed)`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'date' ? 'priority' : sortBy === 'priority' ? 'name' : 'date')}
            >
              <SortAsc className="h-4 w-4 mr-2" />
              Sort: {sortBy === 'date' ? 'Date' : sortBy === 'priority' ? 'Priority' : 'Name'}
            </Button>
            
            <Button onClick={() => setIsCreatingTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
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
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No tasks found</p>
                <p className="text-sm">Create a new task to get started</p>
              </div>
              <Button onClick={() => setIsCreatingTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
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
                      {format(new Date(group.date), 'EEEE, MMMM d')}
                    </h2>
                  </div>
                )}
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onEdit={setEditingTask}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        task={editingTask}
        isOpen={isCreatingTask || !!editingTask}
        onClose={() => {
          setIsCreatingTask(false)
          setEditingTask(undefined)
        }}
      />
    </div>
  )
}