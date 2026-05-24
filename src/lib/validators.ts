import { z } from 'zod'

export const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(200, 'Task name is too long'),
  description: z.string().optional(),
  date: z.string().datetime().transform(s => new Date(s)).optional(),
  deadline: z.string().datetime().transform(s => new Date(s)).optional(),
  estimate: z.number().int().positive().optional(),
  actualTime: z.number().int().positive().optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).default('none'),
  recurring: z.enum(['daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']).optional(),
  recurringConfig: z.record(z.string(), z.unknown()).optional(),
  labels: z.array(z.object({ id: z.string() })).optional(),
  subtasks: z.array(z.object({ title: z.string(), completed: z.boolean().optional() })).optional(),
  listId: z.string().min(1, 'List ID is required'),
  completed: z.boolean().optional(),
  completedAt: z.string().datetime().transform(s => new Date(s)).optional(),
  reminders: z.array(z.string().datetime().transform(s => new Date(s))).optional(),
  attachments: z.array(z.string()).optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default(''),
  isDefault: z.boolean().default(false),
})

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default(''),
})
