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
  GripVertical,
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High', bar: 'bg-red-500', border: 'border-l-red-500', text: 'text-red-500', gradient: 'from-red-500/20 to-transparent' },
  medium: { color: 'bg-amber-500', label: 'Medium', bar: 'bg-amber-500', border: 'border-l-amber-500', text: 'text-amber-500', gradient: 'from-amber-500/20 to-transparent' },
  low: { color: 'bg-emerald-500', label: 'Low', bar: 'bg-emerald-500', border: 'border-l-emerald-500', text: 'text-emerald-500', gradient: 'from-emerald-500/20 to-transparent' },
  none: { color: 'bg-zinc-400', label: 'None', bar: 'bg-zinc-400', border: 'border-l-zinc-400', text: 'text-zinc-400', gradient: 'from-zinc-400/10 to-transparent' },
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
        className={`group/card relative cursor-pointer transition-all duration-300
          hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0
          dark:hover:shadow-primary/10
          bg-background hover:bg-card/80
          ${task.completed ? 'opacity-60' : ''}
          ${isOverdue ? 'border-l-red-500' : priority.border}
          overflow-hidden
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
        <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none ${priority.gradient}`} />

        <CardContent className="p-4 relative">
          <div className="flex items-start gap-3">

            <Celebration active={celebrating} />

            <div className="flex flex-col items-center gap-1.5 pt-0.5">
              <div className="opacity-0 group-hover/card:opacity-40 group-focus-within/card:opacity-40 transition-all duration-200 hover:opacity-100 hover:scale-110">
                <GripVertical
                  className="size-3.5 text-muted-foreground cursor-grab active:cursor-grabbing"
                  aria-label="Drag to reorder"
                />
              </div>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                className={`transition-all duration-200 hover:scale-110
                  ${task.completed
                    ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:shadow-sm data-[state=checked]:shadow-emerald-500/30'
                    : 'hover:border-emerald-400'
                  }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 min-h-6">
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
                    className={`font-semibold truncate cursor-text transition-colors
                      hover:text-primary
                      ${task.completed ? 'line-through text-muted-foreground/70' : ''}
                    `}
                    onClick={startEditing}
                  >
                    {task.name}
                  </h3>
                )}
                {isOverdue && !editingName && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-semibold whitespace-nowrap border border-red-500/20 shrink-0"
                  >
                    <AlertTriangle className="size-3" data-testid="alert-triangle" />
                    Overdue
                  </motion.div>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {task.date && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                    <Calendar className="size-3" />
                    {formatRelativeDate(task.date)}
                  </div>
                )}

                {task.deadline && (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                    isOverdue
                      ? 'bg-red-500/10 text-red-500 font-medium border-red-500/20'
                      : 'bg-muted/60 border-border/40'
                  }`}>
                    <Clock className="size-3" />
                    {isOverdue ? 'Overdue!' : formatRelativeDate(task.deadline)}
                  </div>
                )}

                {task.estimate && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                    <Clock className="size-3" />
                    {task.estimate >= 60
                      ? `${Math.floor(task.estimate / 60)}h ${task.estimate % 60}m`
                      : `${task.estimate}m`}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Flag className={`size-3 ${priority.text}`} />
                  <span className={`text-[10px] font-semibold ${priority.text}`}>
                    {priority.label}
                  </span>
                </div>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5 font-medium"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.icon} {label.name}
                      </Badge>
                    ))}
                    {task.labels.length > 2 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        +{task.labels.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {totalSubtasks > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                    <CheckCircle2 className={`size-3 ${progress >= 1 ? 'text-emerald-500' : ''}`} />
                    <span className={progress >= 1 ? 'text-emerald-500 font-medium' : ''}>
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  </div>
                )}
              </div>

              {totalSubtasks > 0 && (
                <div className="mt-3 pl-0.5">
                  <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors duration-300 ${
                        progress >= 1 ? 'bg-emerald-500' : 'bg-primary/70'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask, i) => (
                      <motion.div
                        key={subtask.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-2 text-xs"
                      >
                        {subtask.completed ? (
                          <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="size-3 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={`truncate ${subtask.completed ? 'line-through text-muted-foreground/60' : ''}`}>
                          {subtask.title}
                        </span>
                      </motion.div>
                    ))}
                    {task.subtasks.length > 3 && (
                      <div className="text-xs text-muted-foreground/70 font-medium">
                        +{task.subtasks.length - 3} more subtasks
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 transition-all duration-200
              p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10
              focus-visible:text-red-500 focus-visible:bg-red-500/10"
            aria-label={`Delete "${task.name}"`}
            tabIndex={0}
          >
            <Trash2 className="size-4" />
          </motion.button>
        </CardContent>
      </Card>
    </motion.div>
  )
})
