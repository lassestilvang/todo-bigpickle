'use client'

import { Task } from '@/types'
import { format } from 'date-fns'
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
  AlertTriangle
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
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

export function TaskCard({ task, onToggleComplete, onEdit }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          task.completed ? 'opacity-60' : ''
        } ${isOverdue ? 'border-red-200 dark:border-red-800' : ''}`}
        onClick={() => onEdit(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEdit(task)
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`font-medium truncate ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {task.name}
                </h3>
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" data-testid="alert-triangle" />
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
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.date), 'MMM d')}
                  </div>
                )}

                {task.deadline && (
                  <div className={`flex items-center gap-1 ${
                    isOverdue ? 'text-red-500' : ''
                  }`}>
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.deadline), 'MMM d')}
                  </div>
                )}

                {task.estimate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(task.estimate / 60)}h {task.estimate % 60}m
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-1 py-0 ${priorityColors[task.priority]} text-white`}
                  >
                    {priorityLabels[task.priority]}
                  </Badge>
                </div>

                {task.labels.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
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
                    <CheckCircle2 className="h-3 w-3" />
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                  </div>
                )}
              </div>

              {task.subtasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {task.subtasks.slice(0, 3).map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-xs">
                      {subtask.completed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
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
}