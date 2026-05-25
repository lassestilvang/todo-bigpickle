'use client'

import { memo, useState, useRef, useEffect, useCallback, useReducer } from 'react'
import { Task } from '@/types'
import { useNow } from '@/hooks/use-now'
import { Celebration } from '@/components/celebration'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
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
  high: { color: 'bg-red-500', label: 'High', bar: 'from-red-500 to-red-400', border: 'border-l-red-500', text: 'text-red-500', gradient: 'from-red-500/20 to-transparent', badge: 'bg-red-500/10 text-red-500 border-red-500/20', ring: 'ring-red-500/20' },
  medium: { color: 'bg-amber-500', label: 'Medium', bar: 'from-amber-500 to-amber-400', border: 'border-l-amber-500', text: 'text-amber-500', gradient: 'from-amber-500/20 to-transparent', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', ring: 'ring-amber-500/20' },
  low: { color: 'bg-emerald-500', label: 'Low', bar: 'from-emerald-500 to-emerald-400', border: 'border-l-emerald-500', text: 'text-emerald-500', gradient: 'from-emerald-500/20 to-transparent', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', ring: 'ring-emerald-500/20' },
  none: { color: 'bg-zinc-400', label: 'None', bar: 'from-zinc-400 to-zinc-300', border: 'border-l-zinc-400', text: 'text-zinc-400', gradient: 'from-zinc-400/10 to-transparent', badge: 'bg-muted text-muted-foreground border-border', ring: 'ring-border' },
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
  const [celebrating, dispatchCelebration] = useReducer(
    (state: boolean, action: 'celebrate' | 'stop') => action === 'celebrate',
    false
  )
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
      wasCompleted.current = true
      dispatchCelebration('celebrate')
      const timer = setTimeout(() => dispatchCelebration('stop'), 800)
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
    <div
      data-task-card
    >
      <Card
        className={`group/card relative cursor-pointer transition-all duration-300 ease-out
          hover:shadow-xl hover:-translate-y-[2px] active:translate-y-0
          dark:hover:shadow-primary/5 dark:hover:shadow-2xl
          bg-background hover:bg-accent/30
          border-border/60 hover:border-border/80
          ${task.completed ? 'opacity-60 saturate-50' : 'shadow-sm hover:shadow-primary/5'}
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
        {/* Priority gradient bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${priority.bar} opacity-60 group-hover/card:opacity-100 transition-opacity duration-300`} />

        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none ${priority.gradient}`} />

        <CardContent className="p-4 pt-[14px] relative">
          <div className="flex items-start gap-3">

            <Celebration active={celebrating} />

            <div className="flex flex-col items-center gap-1.5 pt-0.5">
              <div className="opacity-0 group-hover/card:opacity-40 group-focus-within/card:opacity-40 transition-all duration-200 hover:opacity-100">
                <GripVertical
                  className="size-3.5 text-muted-foreground/60 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors"
                  aria-label="Drag to reorder"
                />
              </div>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                className={`transition-all duration-200 hover:scale-110 active:scale-90
                  ${task.completed
                    ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:shadow-md data-[state=checked]:shadow-emerald-500/30'
                    : 'hover:border-emerald-400 hover:shadow-sm hover:shadow-emerald-500/20'
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
                  <button
                    type="button"
                    className={`font-semibold truncate cursor-text transition-all duration-200 text-left w-full
                      hover:text-primary
                      ${task.completed ? 'line-through text-muted-foreground/70' : ''}
                    `}
                    onClick={startEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        startEditing(e as unknown as React.MouseEvent)
                      }
                    }}
                  >
                    {task.name}
                  </button>
                )}
                {isOverdue && !editingName && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-semibold whitespace-nowrap border border-red-500/20 shrink-0 animate-in shadow-sm shadow-red-500/10">
                    <AlertTriangle className="size-3" data-testid="alert-triangle" />
                    Overdue
                  </div>
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

                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${priority.badge}`}>
                  <Flag className={`size-3 ${priority.text}`} />
                  <span className={`text-[10px] font-semibold`}>
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
                  <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden ring-1 ring-inset ring-black/[0.02]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        progress >= 1 ? 'bg-emerald-500' : 'bg-primary/60'
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask) => (
                      <div
                        key={subtask.id}
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
                      </div>
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

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 transition-all duration-200
              p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-90
              focus-visible:text-red-500 focus-visible:bg-red-500/10"
            aria-label={`Delete "${task.name}"`}
            tabIndex={0}
          >
            <Trash2 className="size-4" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
})
