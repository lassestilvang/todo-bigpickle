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
  CheckCircle2, 
  Circle,
  AlertTriangle,
  Trash2,
  GripVertical
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High', bar: 'bg-red-500', border: 'border-l-red-500', text: 'text-red-500' },
  medium: { color: 'bg-yellow-500', label: 'Medium', bar: 'bg-yellow-500', border: 'border-l-yellow-500', text: 'text-yellow-500' },
  low: { color: 'bg-green-500', label: 'Low', bar: 'bg-green-500', border: 'border-l-green-500', text: 'text-green-500' },
  none: { color: 'bg-gray-400', label: 'None', bar: 'bg-gray-400', border: 'border-l-gray-400', text: 'text-gray-400' },
} as const

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
  const priority = priorityConfig[task.priority]
  const completedSubtasks = task.subtasks.filter(st => st.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0

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
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, layout: { duration: 0.3, ease: 'easeOut' } }}
    >
      <Card
        className={`group relative cursor-pointer border-l-4 transition-all duration-200
          hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
          dark:hover:shadow-primary/5
          ${task.completed ? 'opacity-60' : ''}
          ${isOverdue ? 'border-l-red-500 border-t-red-200 dark:border-t-red-800/50' : ''}
          ${!isOverdue ? priority.border : ''}
        `}
        onClick={() => { if (!editingName) onEdit(task) }}
        role="button"
        tabIndex={0}
        aria-label={`Task: ${task.name}. Priority: ${priority.label}. ${task.completed ? 'Completed.' : 'Not completed.'} ${isOverdue ? 'Overdue!' : ''} Click to edit.`}
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
          <div className="flex items-start gap-3 relative">

            <Celebration active={celebrating} />

            <div className="flex flex-col items-center gap-1 pt-0.5">
              <GripVertical
                className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder"
              />
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                className={task.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}
              />
            </div>

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
                    className={`font-medium truncate cursor-text transition-colors
                      hover:text-primary
                      ${task.completed ? 'line-through text-muted-foreground' : ''}
                    `}
                    onClick={startEditing}
                  >
                    {task.name}
                  </h3>
                )}
                {isOverdue && !editingName && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-medium whitespace-nowrap">
                    <AlertTriangle className="size-3" data-testid="alert-triangle" />
                    Overdue
                  </div>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 italic">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {task.date && (
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/50">
                    <Calendar className="size-3" />
                    {formatRelativeDate(task.date)}
                  </div>
                )}

                {task.deadline && (
                  <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${
                    isOverdue ? 'bg-red-500/10 text-red-500 font-medium' : 'bg-muted/50'
                  }`}>
                    <Clock className="size-3" />
                    {isOverdue ? 'Overdue!' : formatRelativeDate(task.deadline)}
                  </div>
                )}

                {task.estimate && (
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/50">
                    <Clock className="size-3" />
                    {task.estimate >= 60
                      ? `${Math.floor(task.estimate / 60)}h ${task.estimate % 60}m`
                      : `${task.estimate}m`}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Flag className={`size-3 ${priority.text}`} />
                  <span className={`text-[10px] font-medium ${priority.text}`}>
                    {priority.label}
                  </span>
                </div>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.icon} {label.name}
                      </Badge>
                    ))}
                    {task.labels.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{task.labels.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {totalSubtasks > 0 && (
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/50">
                    <CheckCircle2 className={`size-3 ${progress >= 1 ? 'text-green-500' : ''}`} />
                    {completedSubtasks}/{totalSubtasks}
                  </div>
                )}
              </div>

              {totalSubtasks > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${progress >= 1 ? 'bg-green-500' : 'bg-primary'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 text-xs">
                        {subtask.completed ? (
                          <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="size-3 text-muted-foreground shrink-0" />
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
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-all duration-200
                p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10
                hover:scale-110 active:scale-95 focus-visible:scale-110 focus-visible:text-destructive focus-visible:bg-destructive/10"
              aria-label={`Delete "${task.name}"`}
              tabIndex={0}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
