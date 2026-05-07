import { z } from 'zod'

export const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  date: z.string().datetime().transform(s => new Date(s)).optional(),
  deadline: z.string().datetime().transform(s => new Date(s)).optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).default('none'),
  labels: z.array(z.object({ id: z.string() })).optional(),
  subtasks: z.array(z.object({ title: z.string(), completed: z.boolean() })).optional(),
  listId: z.string().min(1, 'List ID is required'),
  completed: z.boolean().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().omit({ listId: true })

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default(''),
  isDefault: z.boolean().default(false),
})

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default(''),
})
