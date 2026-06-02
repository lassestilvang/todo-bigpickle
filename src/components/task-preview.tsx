'use client'

import { memo } from 'react'
import { Task } from '@/types'
import { useNow } from '@/hooks/use-now'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react'

function formatRelativeDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

const priorityConfig = {
  high: { label: 'High', class: 'text-red-500 bg-red-500/10 border-red-500/20' },
  medium: { label: 'Medium', class: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  low: { label: 'Low', class: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  none: { label: 'None', class: 'text-muted-foreground bg-muted border-border' },
} as const

interface TaskPreviewProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleComplete: (id: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
}

export const TaskPreview = memo(function TaskPreview({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleSubtask,
}: TaskPreviewProps) {
  const now = useNow()
  if (!task) return null

  const isOverdue = task.deadline && task.deadline < now && !task.completed
  const priority = priorityConfig[task.priority]
  const completedSubtasks = task.subtasks.filter(st => st.completed).length
  const totalSubtasks = task.subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
        <div className="p-6 pb-4">
          <DialogHeader className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  className={`mt-1 transition-all duration-200 hover:scale-110 ${
                    task.completed
                      ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                      : ''
                  }`}
                  aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                />
                <div>
                  <DialogTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground/70' : ''}`}>
                    {task.name}
                  </DialogTitle>
                  {task.description && (
                    <DialogDescription className="text-sm mt-1.5 leading-relaxed">
                      {task.description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium ${priority.class}`}>
                <Flag className="size-3" />
                {priority.label}
              </div>

              {task.date && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/40 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {formatRelativeDate(task.date)}
                </div>
              )}

              {task.deadline && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${
                  isOverdue
                    ? 'bg-red-500/10 text-red-500 font-medium border-red-500/20'
                    : 'bg-muted/60 text-muted-foreground border-border/40'
                }`}>
                  <Clock className="size-3" />
                  {isOverdue ? 'Overdue! ' : ''}{formatRelativeDate(task.deadline)}
                </div>
              )}

              {task.estimate && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/40 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {task.estimate >= 60
                    ? `${Math.floor(task.estimate / 60)}h ${task.estimate % 60}m`
                    : `${task.estimate}m`}
                </div>
              )}
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                      style={{ borderColor: label.color, color: label.color }}
                    >
                      {label.icon} {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
                  <span className={`text-xs font-semibold tabular-nums ${progress >= 100 ? 'text-emerald-500' : 'text-muted-foreground/70'}`}>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
                <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden mb-2">
                  {progress > 0 && (
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        progress >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-primary/70 to-primary/40'
                      }`}
                      style={{ width: `${Math.max(progress, 8)}%` }}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  {task.subtasks.map((subtask) => (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSubtask(task.id, subtask.id)
                      }}
                      className="flex items-center gap-2 text-sm w-full text-left py-1 px-1 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`truncate ${subtask.completed ? 'line-through text-muted-foreground/60' : ''}`}>
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring info */}
            {task.recurring && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border/40">
                Repeats: <span className="font-medium capitalize">{task.recurring}</span>
              </div>
            )}

            {/* List info */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border/40">
              List ID: <span className="font-mono">{task.listId}</span>
            </div>

            {/* Activity history */}
            {task.history.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Activity</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {task.history.slice(0, 5).map((h) => (
                    <div key={h.id} className="text-xs text-muted-foreground/70 flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-muted-foreground/20 shrink-0" />
                      <span className="capitalize">{h.field}</span>
                      <span className="text-muted-foreground/40">changed</span>
                      <span className="text-[10px] text-muted-foreground/40 ml-auto">
                        {format(new Date(h.changedAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  ))}
                  {task.history.length > 5 && (
                    <p className="text-xs text-muted-foreground/50 pt-1">+{task.history.length - 5} more changes</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={() => { onEdit(task); onClose() }}>
              <Pencil className="size-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
