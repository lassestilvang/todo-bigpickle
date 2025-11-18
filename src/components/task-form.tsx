'use client'

import { useState } from 'react'
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
import { CalendarIcon, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  date: z.date().optional(),
  deadline: z.date().optional(),
  estimate: z.string().optional(),
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

export function TaskForm({ task, isOpen, onClose }: TaskFormProps) {
  const { lists, labels, addTask, updateTask } = useAppStore()
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels.map(l => l.id) || [])
  const [subtasks, setSubtasks] = useState(
    task?.subtasks.map(st => ({ id: st.id, title: st.title, completed: st.completed })) || []
  )
  const [newSubtask, setNewSubtask] = useState('')

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

  const onSubmit = (data: TaskFormData) => {
    const estimateMinutes = data.estimate ? 
      parseInt(data.estimate.split(':')[0]) * 60 + parseInt(data.estimate.split(':')[1]) : 
      undefined

    const taskData = {
      ...data,
      estimate: estimateMinutes,
      labels: labels.filter(l => selectedLabels.includes(l.id)),
      subtasks: subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      completed: task?.completed || false,
    }

    if (task) {
      updateTask(task.id, taskData)
    } else {
      addTask(taskData)
    }

    onClose()
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, {
        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: newSubtask.trim(),
        completed: false,
      }])
      setNewSubtask('')
    }
  }

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id))
  }

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => 
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Edit the details of your existing task.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <FormLabel htmlFor="name">Task Name *</FormLabel>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Enter task name..."
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => form.setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <FormLabel>Deadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('deadline') ? (
                      format(form.watch('deadline')!, 'PPP')
                    ) : (
                      <span>Pick a deadline</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('deadline')}
                    onSelect={(date) => form.setValue('deadline', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel htmlFor="estimate">Time Estimate (HH:MM)</FormLabel>
              <Input
                id="estimate"
                {...form.register('estimate')}
                placeholder="1:30"
                pattern="^[0-9]+:[0-5][0-9]$"
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="priority">Priority</FormLabel>
              <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="listId">List</FormLabel>
            <Select value={form.watch('listId')} onValueChange={(value) => form.setValue('listId', value)}>
              <SelectTrigger>
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
            <FormLabel>Labels</FormLabel>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <Badge
                  key={label.id}
                  variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={{ 
                    backgroundColor: selectedLabels.includes(label.id) ? label.color : undefined,
                    borderColor: label.color,
                    color: selectedLabels.includes(label.id) ? 'white' : label.color
                  }}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.icon} {label.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel>Subtasks</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <Button type="button" onClick={addSubtask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <AnimatePresence>
              {subtasks.map((subtask) => (
                <motion.div
                  key={subtask.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-2 bg-muted rounded"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtask(subtask.id)}
                  />
                  <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                    {subtask.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}