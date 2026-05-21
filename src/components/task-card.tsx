'use client'

import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { Task } from '@/types'
import { useNow } from '@/hooks/use-now'
import { Celebration } from '@/components/celebration'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Flag, 
  Tag, 
  CheckCircle2, 
  Circle,
  AlertTriangle,
  Trash2
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  none: 'bg-gray-500'
}

const priorityLabels = {
  high: 'High',
  medium: 'Medium', 
  low: 'Low',
  none: 'None'
}

function formatRelativeDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export const TaskCard = memo(function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const now = useNow()
  const isOverdue = task.deadline && task.deadline < now && !task.completed
  const [celebrating, setCelebrating] = useState(false)
  const wasCompleted = useRef(task.completed)

  const [editingName, setEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const updateTask = useAppStore(s => s.updateTask)

  useEffect(() => {
    if (task.completed && !wasCompleted.current) {
      const timer = setTimeout(() => {
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 800)
      }, 0)
      wasCompleted.current = true
      return () => clearTimeout(timer)
    }
    wasCompleted.current = task.completed
  }, [task.completed])

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(task.name)
    setEditingName(true)
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 10)
  }, [task.name])

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.name) {
      updateTask(task.id, { name: trimmed })
    }
    setEditingName(false)
  }, [editValue, task.id, task.name, updateTask])

  const cancelEdit = useCallback(() => {
    setEditingName(false)
  }, [])

  return (
    <motion.div
      data-task-card
      className="task-card-motion"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, layout: { duration: 0.3, ease: 'easeOut' } }}
    >
      <Card 
        className={`group relative cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
          task.completed ? 'opacity-60' : ''
        } ${isOverdue ? 'border-red-200 dark:border-red-800' : ''}`}
        onClick={() => { if (!editingName) onEdit(task) }}
        role="button"
        tabIndex={0}
        aria-label={`Task: ${task.name}. Priority: ${priorityLabels[task.priority]}. ${task.completed ? 'Completed.' : 'Not completed.'} ${isOverdue ? 'Overdue!' : ''} Click to edit.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!editingName) {
              e.preventDefault()
              onEdit(task)
            }
          }
        }}
      >
        <CardContent className="p-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={`Delete "${task.name}"`}
          >
            <Trash2 className="size-4" />
          </button>
          <div className="flex items-start gap-3 relative">
            <Celebration active={celebrating} />
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 min-h-6">
                {editingName ? (
                  <Input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') saveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    onBlur={saveEdit}
                    className="h-7 py-0 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    className={`font-medium truncate cursor-text hover:text-primary transition-colors ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                    onClick={startEditing}
                  >
                    {task.name}
                  </h3>
                )}
                {isOverdue && !editingName && (
                  <AlertTriangle className="size-4 text-red-500 flex-shrink-0" data-testid="alert-triangle" />
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {task.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatRelativeDate(task.date)}
                  </div>
                )}

                {task.deadline && (
                  <div className={`flex items-center gap-1 ${
                    isOverdue ? 'text-red-500' : ''
                  }`}>
                    <Clock className="size-3" />
                    {isOverdue ? 'Overdue!' : formatRelativeDate(task.deadline)}
                  </div>
                )}

                {task.estimate && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {Math.floor(task.estimate / 60)}h {task.estimate % 60}m
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Flag className="size-3" />
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-1 py-0 ${priorityColors[task.priority]} text-white`}
                  >
                    {priorityLabels[task.priority]}
                  </Badge>
                </div>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="size-3" />
                    {task.labels.map((label) => (
                      <Badge 
                        key={label.id} 
                        variant="outline"
                        className="text-xs px-1 py-0"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.icon} {label.name}
                      </Badge>
                    ))}
                  </div>
                )}

                  {task.subtasks.length > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                  </div>
                )}
              </div>

              {task.subtasks.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                    </span>
                  </div>
                </div>
              )}

              {task.subtasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {task.subtasks.slice(0, 3).map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-xs">
                      {subtask.completed ? (
                        <CheckCircle2 className="size-3 text-green-500" />
                      ) : (
                        <Circle className="size-3 text-muted-foreground" />
                      )}
                      <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                  {task.subtasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{task.subtasks.length - 3} more subtasks
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})