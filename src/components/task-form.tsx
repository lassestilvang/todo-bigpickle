'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Task, Priority } from '@/types'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label as FormLabel } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { CalendarIcon, Plus, X, Trash2, Loader2 } from 'lucide-react'
import { format, addDays, addWeeks } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  date: z.date().optional(),
  deadline: z.date().optional(),
  estimate: z.string().regex(/^\d+:[0-5]\d$/, 'Use format HH:MM (e.g. 1:30)').optional().or(z.literal('')),
  priority: z.enum(['high', 'medium', 'low', 'none']),
  recurring: z.enum(['daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']).optional(),
  listId: z.string(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: Task
  isOpen: boolean
  onClose: () => void
}

const priorityOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export function TaskForm({ task, isOpen, onClose }: TaskFormProps) {
  const lists = useAppStore(s => s.lists)
  const labels = useAppStore(s => s.labels)
  const addTask = useAppStore(s => s.addTask)
  const updateTask = useAppStore(s => s.updateTask)
  const deleteTask = useAppStore(s => s.deleteTask)
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels.map(l => l.id) || [])
  const [subtasks, setSubtasks] = useState(
    task?.subtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed })) || []
  )
  const [newSubtask, setNewSubtask] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const subtaskIdCounter = useRef(0)
  const newSubtaskRef = useRef<HTMLInputElement>(null)

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      date: task?.date || undefined,
      deadline: task?.deadline || undefined,
      estimate: task?.estimate ? `${Math.floor(task.estimate / 60)}:${(task.estimate % 60).toString().padStart(2, '0')}` : '',
      priority: task?.priority || 'none',
      recurring: task?.recurring || undefined,
      listId: task?.listId || lists.find(l => l.isDefault)?.id || '',
    },
  })

  const dateValue = useWatch({ control: form.control, name: 'date' })
  const deadlineValue = useWatch({ control: form.control, name: 'deadline' })
  const priorityValue = useWatch({ control: form.control, name: 'priority' })

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => form.setFocus('name'), 100)
    }
  }, [isOpen, form])

  const onSubmit = async (data: TaskFormData) => {
    setSubmitError(null)

    const estimateMinutes = data.estimate ?
      parseInt(data.estimate.split(':')[0]) * 60 + parseInt(data.estimate.split(':')[1]) :
      undefined

    const taskData = {
      ...data,
      estimate: estimateMinutes ?? undefined,
      labels: labels.filter(l => selectedLabels.includes(l.id)),
      subtasks: subtasks.map(st => ({
        title: st.title,
        completed: st.completed,
      })),
      completed: task?.completed || false,
    }

    setIsSubmitting(true)
    try {
      if (task) {
        await updateTask(task.id, taskData as Parameters<typeof updateTask>[1])
      } else {
        await addTask(taskData as Parameters<typeof addTask>[0])
      }
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      subtaskIdCounter.current += 1
      setSubtasks(prev => [...prev, {
        id: `_new_${subtaskIdCounter.current}`,
        title: newSubtask.trim(),
        completed: false,
      }])
      setNewSubtask('')
      setTimeout(() => newSubtaskRef.current?.focus(), 10)
    }
  }

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id))
  }

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(st =>
      st.id === id ? { ...st, completed: !st.completed } : st
    ))
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl">{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {task ? 'Edit the details of your existing task.' : 'Fill in the details to create a new task.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
          {submitError && (
            <div className="p-3 text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <FormLabel htmlFor="name" className="text-sm font-medium">Task Name *</FormLabel>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter task name..."
              className="h-10"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="description" className="text-sm font-medium">Description</FormLabel>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    <span className="truncate">
                      {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex gap-1 p-2 border-b">
                    {[
                      { label: 'Today', getValue: () => new Date() },
                      { label: 'Tomorrow', getValue: () => addDays(new Date(), 1) },
                      { label: 'Next Week', getValue: () => addWeeks(new Date(), 1) },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => form.setValue('date', preset.getValue())}
                        className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(date) => form.setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Deadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    <span className="truncate">
                      {deadlineValue ? format(deadlineValue, 'PPP') : 'Pick a deadline'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadlineValue}
                    onSelect={(date) => form.setValue('deadline', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel htmlFor="estimate" className="text-sm font-medium">Time Estimate</FormLabel>
              <Input
                id="estimate"
                {...form.register('estimate')}
                placeholder="1:30 (HH:MM)"
                className="h-10"
              />
              {form.formState.errors.estimate && (
                <p className="text-xs text-red-500">{form.formState.errors.estimate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="priority" className="text-sm font-medium">Priority</FormLabel>
              <Select value={priorityValue} onValueChange={(value) => form.setValue('priority', value as Priority)}>
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="recurring" className="text-sm font-medium">Repeat</FormLabel>
            <Select
              value={form.watch('recurring') || ''}
              onValueChange={(value) => form.setValue('recurring', value === '' ? undefined : value as Task['recurring'])}
            >
              <SelectTrigger id="recurring" className="h-10">
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="list-select" className="text-sm font-medium">List</FormLabel>
            <Select value={form.watch('listId')} onValueChange={(value) => form.setValue('listId', value)}>
              <SelectTrigger id="list-select" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.icon} {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FormLabel className="text-sm font-medium">Labels</FormLabel>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => {
                const isSelected = selectedLabels.includes(label.id)
                return (
                  <Badge
                    key={label.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: isSelected ? label.color : undefined,
                      borderColor: label.color,
                      color: isSelected ? 'white' : label.color,
                    }}
                    onClick={() => toggleLabel(label.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleLabel(label.id)
                      }
                    }}
                  >
                    {label.icon} {label.name}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <FormLabel className="text-sm font-medium">Subtasks</FormLabel>
            <div className="flex gap-2">
              <Input
                ref={newSubtaskRef}
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubtask()
                  }
                }}
              />
              <Button type="button" onClick={addSubtask} size="sm" variant="secondary" className="shrink-0">
                <Plus className="size-4" />
              </Button>
            </div>
            <AnimatePresence>
              {subtasks.map((subtask) => (
                <motion.div
                  key={subtask.id}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg border border-border/50"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtask(subtask.id)}
                    className="shrink-0"
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                    className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <DialogFooter className="pt-2">
            {task && (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  await deleteTask(task.id)
                  onClose()
                }}
                className="mr-auto"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
