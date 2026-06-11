'use client'

import { memo, useState, useRef, useEffect, useCallback, startTransition, type ReactNode } from 'react'
import { Task, Priority } from '@/types'
import { useNow } from '@/hooks/use-now'
import { Celebration } from '@/components/celebration'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store'
import { toast } from '@/hooks/use-toast'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Reorder } from 'framer-motion'
import { ProgressRing } from '@/components/ui/progress-ring'
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trash2,
  GripVertical,
  Copy,
  Share2,
  ListTodo,
  Bell,
  X,
} from 'lucide-react'
import { Markdown } from '@/components/ui/markdown'
import { playCompletionSound } from '@/lib/sounds'

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="rounded-sm bg-primary/20 text-foreground ring-1 ring-primary/30 font-medium px-0.5">{part}</mark>
      : part
  )
}

interface TaskCardProps {
  task: Task
  selected?: boolean
  searchQuery?: string
  onToggleComplete: (id: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onReorderSubtasks: (taskId: string, subtaskIds: string[]) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onSelectToggle?: (id: string, shiftKey?: boolean) => void
}

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High', bar: 'from-red-500 to-red-400', border: 'border-l-red-500', text: 'text-red-500', gradient: 'from-red-500/15 to-transparent', badge: 'bg-red-500/10 text-red-500 border-red-500/20', ring: 'ring-red-500/20', glow: 'shadow-red-500/5' },
  medium: { color: 'bg-amber-500', label: 'Medium', bar: 'from-amber-500 to-amber-400', border: 'border-l-amber-500', text: 'text-amber-500', gradient: 'from-amber-500/15 to-transparent', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', ring: 'ring-amber-500/20', glow: 'shadow-amber-500/5' },
  low: { color: 'bg-emerald-500', label: 'Low', bar: 'from-emerald-500 to-emerald-400', border: 'border-l-emerald-500', text: 'text-emerald-500', gradient: 'from-emerald-500/15 to-transparent', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', ring: 'ring-emerald-500/20', glow: 'shadow-emerald-500/5' },
  none: { color: 'bg-zinc-400', label: 'None', bar: 'from-zinc-400 to-zinc-300', border: 'border-l-zinc-400', text: 'text-zinc-400', gradient: 'from-zinc-400/10 to-transparent', badge: 'bg-muted text-muted-foreground border-border', ring: 'ring-border', glow: 'shadow-transparent' },
} as const

function formatRelativeDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export const TaskCard = memo(function TaskCard({ task, selected, searchQuery, onToggleComplete, onToggleSubtask, onReorderSubtasks, onEdit, onDelete, onSelectToggle }: TaskCardProps) {
  const now = useNow()
  const isOverdue = task.deadline && task.deadline < now && !task.completed
  const overdueDays = isOverdue && task.deadline
    ? Math.floor((now.getTime() - task.deadline.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const [celebrating, setCelebrating] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const prevCompleted = useRef(task.completed)

  const [editingName, setEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const updateTask = useAppStore(s => s.updateTask)
  const updateTaskRef = useRef(updateTask)
  useEffect(() => { updateTaskRef.current = updateTask }, [updateTask])
  const duplicateTask = useAppStore(s => s.duplicateTask)

  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  const handleAddSubtask = useCallback(() => {
    const title = newSubtaskTitle.trim()
    if (!title) {
      setIsAddingSubtask(false)
      return
    }
    const newSubtask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      position: task.subtasks.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    updateTask(task.id, { subtasks: [...task.subtasks, newSubtask] })
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }, [newSubtaskTitle, task.id, task.subtasks, updateTask])

  useEffect(() => {
    if (isAddingSubtask) {
      subtaskInputRef.current?.focus()
    }
  }, [isAddingSubtask])

  const copyAsMarkdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const priorityEmoji = task.priority === 'high' ? '🔴 ' : task.priority === 'medium' ? '🟡 ' : task.priority === 'low' ? '🟢 ' : ''
    const markdown = `${priorityEmoji}**${task.name}**\n${task.description ? `\n${task.description}\n` : ''}${task.deadline ? `\nDue: ${format(task.deadline, 'PPP')}` : ''}`
    navigator.clipboard.writeText(markdown)
    toast({
      type: 'success',
      title: 'Copied to clipboard',
      description: 'Task details copied as Markdown',
    })
  }, [task])

  const cyclePriority = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const cycle: Priority[] = ['none', 'low', 'medium', 'high']
    const idx = cycle.indexOf(task.priority)
    const next = cycle[(idx + 1) % cycle.length]
    updateTaskRef.current(task.id, { priority: next })
  }, [task.priority, task.id])
  const priority = priorityConfig[task.priority]
  const completedSubtasks = task.subtasks.filter(st => st.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0
  const taskAgeDays = Math.floor((now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))

  useEffect(() => {
    if (task.completed && !prevCompleted.current) {
      startTransition(() => setCelebrating(true))
      startTransition(() => setJustCompleted(true))
      playCompletionSound()
      const celebrationTimer = setTimeout(() => startTransition(() => setCelebrating(false)), 800)
      const glowTimer = setTimeout(() => startTransition(() => setJustCompleted(false)), 2000)
      return () => {
        clearTimeout(celebrationTimer)
        clearTimeout(glowTimer)
      }
    }
    prevCompleted.current = task.completed
  }, [task.completed])

  useEffect(() => {
    if (editingName) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingName])

  // Quick date keyboard shortcuts when card is focused and not editing
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = cardRef.current
    if (!el || editingName) return
    const handler = (e: KeyboardEvent) => {
      if (e.target !== el && !el.contains(e.target as Node)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const dates: Record<string, Date> = {
        '1': today,
        '2': new Date(today.getTime() + 24 * 60 * 60 * 1000),
        '3': nextWeek,
      }
      const d = dates[e.key]
      if (d) {
        e.preventDefault()
        updateTaskRef.current(task.id, { date: d })
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [editingName, task.id])

  const startEditing = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setEditValue(task.name)
    setEditingName(true)
  }, [task.name])

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.name) {
      updateTaskRef.current(task.id, { name: trimmed })
    }
    setEditingName(false)
  }, [editValue, task.id, task.name])

  const cancelEdit = useCallback(() => {
    setEditingName(false)
  }, [])

  return (
    <div
      ref={cardRef}
      data-task-card
      className="relative"
    >
      <Card
        className={`group/card cursor-pointer transition-all duration-300 ease-out
          hover:shadow-xl hover:-translate-y-[2px] active:translate-y-0
          dark:hover:shadow-primary/5 dark:hover:shadow-2xl
          bg-background hover:bg-accent/30
          border-border/60 hover:border-border/80
          ${task.completed
            ? 'opacity-60 saturate-50 scale-[0.995]'
            : 'shadow-sm hover:shadow-primary/5'
          }
          ${justCompleted ? 'ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : ''}
          ${selected ? 'ring-2 ring-primary/40 shadow-lg shadow-primary/10 bg-primary/[0.02]' : ''}
          ${celebrating ? 'overflow-visible' : 'overflow-hidden'}
          before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300
          hover:before:opacity-100 before:bg-gradient-to-br before:from-primary/[0.02] before:to-transparent
        `}
        onClick={(e) => {
          if (onSelectToggle && (e.shiftKey || e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSelectToggle(task.id, e.shiftKey ? true : undefined)
          } else if (!editingName) {
            onEdit(task)
          }
        }}
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
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priority.bar} opacity-70 group-hover/card:opacity-100 transition-all duration-300`} />

        {/* Priority left border accent */}
        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b ${priority.bar} opacity-40 group-hover/card:opacity-80 transition-opacity duration-300`} />

        {/* Ambient priority glow on hover */}
        <div className={`absolute -top-4 -right-4 size-20 rounded-full bg-gradient-to-br ${priority.bar} opacity-0 group-hover/card:opacity-[0.06] blur-3xl transition-opacity duration-500 pointer-events-none`} />

        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none ${priority.gradient}`} />

        {/* Completion sweep animation */}
        {justCompleted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent
              animate-shimmer" style={{ animationDuration: '0.8s' }} />
          </div>
        )}

        <CardContent className="p-3 sm:p-4 pt-[13px] sm:pt-[15px] relative">
          <div className="flex items-start gap-2 sm:gap-3">
            {onSelectToggle && (
              <div className="pt-0.5">
                <Checkbox
                  checked={!!selected}
                  onCheckedChange={() => onSelectToggle(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className={`transition-all duration-200 ${
                    selected
                      ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                      : 'opacity-0 group-hover/card:opacity-40 group-focus-within/card:opacity-40'
                  }`}
                  aria-label={`Select "${task.name}"`}
                />
              </div>
            )}

            <Celebration active={celebrating} />

            <div className="flex flex-col items-center gap-1.5 pt-0.5">
              <div className="opacity-0 group-hover/card:opacity-40 group-focus-within/card:opacity-40 transition-all duration-200 hover:opacity-100">
                <GripVertical
                  className="size-3.5 text-muted-foreground/60 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors"
                  aria-label="Drag to reorder"
                />
              </div>
              <div className="relative group/check">
                {totalSubtasks > 0 && (
                  <div className="absolute inset-0 -m-1 pointer-events-none scale-125 opacity-40 group-hover/check:opacity-100 transition-opacity">
                    <ProgressRing progress={progress} size={24} strokeWidth={2} />
                  </div>
                )}
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className={`transition-all duration-200 hover:scale-110 active:scale-95 relative z-10
                    ${task.completed
                      ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:shadow-lg data-[state=checked]:shadow-emerald-500/40'
                      : 'hover:border-emerald-400 hover:shadow-sm hover:shadow-emerald-500/20'
                    }`}
                />
              </div>
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
                        startEditing(e)
                      }
                    }}
                  >
                    {highlightText(task.name, searchQuery || '')}
                  </button>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {taskAgeDays > 3 && !task.completed && (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/50 border border-border/50 text-[10px] text-muted-foreground/60 font-medium">
                      {taskAgeDays}d old
                    </div>
                  )}
                  {isOverdue && !editingName && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap border shrink-0 animate-in shadow-sm ${
                    overdueDays >= 7
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 shadow-red-500/10'
                      : overdueDays >= 3
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 shadow-orange-500/10'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/10'
                  }`}>
                    <AlertTriangle className="size-3" data-testid="alert-triangle" />
                    {overdueDays === 0 ? 'Due today' : overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`}
                  </div>
                )}
              </div>

              {task.description && (
                <div className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                  <Markdown content={task.description} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {task.date && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 transition-colors duration-200 hover:bg-muted/80">
                    <Calendar className="size-3" />
                    <span>{formatRelativeDate(task.date)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateTask(task.id, { date: undefined })
                      }}
                      className="ml-0.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors rounded-sm hover:bg-muted/80 p-0.5"
                      aria-label="Clear date"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                )}

                {task.deadline && (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-200 ${
                    isOverdue
                      ? overdueDays >= 7
                        ? 'bg-red-500/10 text-red-500 font-medium border-red-500/20 hover:bg-red-500/[0.12]'
                        : overdueDays >= 3
                          ? 'bg-orange-500/10 text-orange-500 font-medium border-orange-500/20 hover:bg-orange-500/[0.12]'
                          : 'bg-amber-500/10 text-amber-500 font-medium border-amber-500/20 hover:bg-amber-500/[0.12]'
                      : 'bg-muted/60 border-border/40 hover:bg-muted/80'
                  }`}>
                    <Clock className="size-3" />
                    {isOverdue
                      ? overdueDays === 0 ? 'Due today' : `${overdueDays}d overdue`
                      : formatRelativeDate(task.deadline)}
                  </div>
                )}

                {task.estimate && (
                  <div className="flex flex-col gap-1 min-w-[60px]">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 transition-colors duration-200 hover:bg-muted/80">
                      <Clock className="size-3" />
                      {task.estimate >= 60
                        ? `${Math.floor(task.estimate / 60)}h ${task.estimate % 60}m`
                        : `${task.estimate}m`}
                    </div>
                    {task.actualTime && (
                      <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            task.actualTime > task.estimate ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((task.actualTime / task.estimate) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {task.reminders && task.reminders.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors duration-200">
                    <Bell className="size-3" />
                    <span className="text-[10px] font-medium">{task.reminders.length}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={cyclePriority}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${priority.badge}`}
                  aria-label={`Priority: ${priority.label}. Click to cycle.`}
                >
                  <Flag className={`size-3 ${priority.text}`} />
                  <span className={`text-[10px] font-semibold`}>
                    {priority.label}
                  </span>
                </button>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5 font-medium transition-all duration-200 hover:scale-105"
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

              </div>

              {(totalSubtasks > 0 || isAddingSubtask) && (
                <div className="mt-3">
                  {totalSubtasks > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground/70">Subtasks</span>
                        <span className={`text-[10px] font-semibold tabular-nums ${progress >= 1 ? 'text-emerald-500' : 'text-muted-foreground/70'}`}>
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      </div>
                      <div className="h-2 bg-muted/70 rounded-full overflow-hidden ring-1 ring-inset ring-black/[0.02] relative">
                        {progress > 0 && (
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                              progress >= 1
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-primary/70 to-primary/40'
                            }`}
                            style={{ width: `${Math.max(progress * 100, 8)}%` }}
                          >
                            {progress > 0 && progress < 1 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <div className="mt-2 space-y-1">
                    {totalSubtasks > 0 && (
                      <Reorder.Group
                        axis="y"
                        values={task.subtasks.slice(0, 3)}
                        onReorder={(reordered) => onReorderSubtasks(task.id, reordered.map(st => st.id))}
                        className="space-y-1"
                        layoutScroll
                      >
                        {task.subtasks.slice(0, 3).map((subtask) => (
                          <Reorder.Item
                            key={subtask.id}
                            value={subtask}
                            className="flex items-center gap-2 text-xs w-full text-left cursor-grab active:cursor-grabbing group/subtask"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleSubtask(task.id, subtask.id)
                            }}
                          >
                            <GripVertical className="size-2.5 text-muted-foreground/20 shrink-0 opacity-0 group-hover/subtask:opacity-100 transition-opacity" />
                            {subtask.completed ? (
                              <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="size-3 text-muted-foreground/40 shrink-0" />
                            )}
                            <span className={`flex-1 truncate ${subtask.completed ? 'line-through text-muted-foreground/60' : ''}`}>
                              {subtask.title}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const updated = task.subtasks.filter(st => st.id !== subtask.id)
                                updateTask(task.id, { subtasks: updated })
                              }}
                              className="size-5 flex items-center justify-center rounded-md text-muted-foreground/0 group-hover/subtask:text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              aria-label={`Delete subtask "${subtask.title}"`}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    )}
                    {task.subtasks.length > 3 && (
                      <div className="text-xs text-muted-foreground/70 font-medium">
                        +{task.subtasks.length - 3} more subtasks
                      </div>
                    )}
                    {isAddingSubtask ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                        <Plus className="size-3 text-primary shrink-0" />
                        <Input
                          ref={subtaskInputRef}
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubtask()
                            if (e.key === 'Escape') setIsAddingSubtask(false)
                          }}
                          onBlur={handleAddSubtask}
                          placeholder="Subtask name..."
                          className="h-6 py-0 text-[10px] bg-background/50 border-primary/20"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsAddingSubtask(true)
                        }}
                        className="flex items-center gap-2 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors py-1 group/add-st"
                      >
                        <Plus className="size-3 transition-transform group-hover/add-st:rotate-90" />
                        <span>Add subtask</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 transition-all duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsAddingSubtask(true)
              }}
              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all duration-200"
              aria-label={`Add subtask to "${task.name}"`}
              title="Add Subtask"
              tabIndex={0}
            >
              <ListTodo className="size-4" />
            </button>
            <button
              type="button"
              onClick={copyAsMarkdown}
              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent hover:scale-110 active:scale-90 transition-all duration-200"
              aria-label={`Copy "${task.name}" as Markdown`}
              title="Copy as Markdown"
              tabIndex={0}
            >
              <Share2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                duplicateTask(task)
              }}
              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent hover:scale-110 active:scale-90 transition-all duration-200"
              aria-label={`Duplicate "${task.name}"`}
              tabIndex={0}
            >
              <Copy className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-90
                focus-visible:text-red-500 focus-visible:bg-red-500/10 transition-all duration-200"
              aria-label={`Delete "${task.name}"`}
              tabIndex={0}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
