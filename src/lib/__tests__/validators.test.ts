import { describe, expect, it } from 'bun:test'
import {
  createTaskSchema,
  updateTaskSchema,
  createListSchema,
  createLabelSchema,
} from '@/lib/validators'

describe('createTaskSchema', () => {
  it('should accept valid task data', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
      priority: 'high',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createTaskSchema.safeParse({
      name: '',
      listId: 'list-1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task name is required')
    }
  })

  it('should reject name over 200 characters', () => {
    const result = createTaskSchema.safeParse({
      name: 'x'.repeat(201),
      listId: 'list-1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task name is too long')
    }
  })

  it('should reject missing listId', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
    })
    expect(result.success).toBe(false)
  })

  it('should use default priority of none', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('none')
    }
  })

  it('should accept valid optional fields', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
      description: 'A description',
      estimate: 60,
      actualTime: 45,
      labels: [{ id: 'label-1' }],
      subtasks: [{ title: 'Subtask', completed: true }],
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid priority', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
      priority: 'urgent',
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative estimate', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
      estimate: -10,
    })
    expect(result.success).toBe(false)
  })

  it('should transform datetime strings to Date objects', () => {
    const result = createTaskSchema.safeParse({
      name: 'Test Task',
      listId: 'list-1',
      date: '2026-05-25T12:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date)
    }
  })
})

describe('updateTaskSchema', () => {
  it('should accept partial updates', () => {
    const result = updateTaskSchema.safeParse({
      name: 'Updated Name',
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty object', () => {
    const result = updateTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept partial with only priority', () => {
    const result = updateTaskSchema.safeParse({ priority: 'high' })
    expect(result.success).toBe(true)
  })
})

describe('createTaskSchema - edge cases', () => {
  it('should accept valid deadline datetime', () => {
    const result = createTaskSchema.safeParse({
      name: 'With Deadline',
      listId: 'list-1',
      deadline: '2026-06-01T12:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deadline).toBeInstanceOf(Date)
    }
  })

  it('should accept valid recurring type', () => {
    const result = createTaskSchema.safeParse({
      name: 'Recurring Task',
      listId: 'list-1',
      recurring: 'daily',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.recurring).toBe('daily')
    }
  })

  it('should accept all recurring types', () => {
    const types = ['daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom'] as const
    for (const t of types) {
      const result = createTaskSchema.safeParse({ name: 'Task', listId: 'l1', recurring: t })
      expect(result.success).toBe(true)
    }
  })

  it('should reject invalid recurring type', () => {
    const result = createTaskSchema.safeParse({
      name: 'Task',
      listId: 'list-1',
      recurring: 'biweekly',
    })
    expect(result.success).toBe(false)
  })

  it('should accept reminders array', () => {
    const result = createTaskSchema.safeParse({
      name: 'With Reminders',
      listId: 'list-1',
      reminders: ['2026-05-30T09:00:00.000Z', '2026-05-30T10:00:00.000Z'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reminders).toHaveLength(2)
      expect(result.data.reminders![0]).toBeInstanceOf(Date)
    }
  })

  it('should accept attachments array', () => {
    const result = createTaskSchema.safeParse({
      name: 'With Attachments',
      listId: 'list-1',
      attachments: ['/path/to/file.pdf'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toHaveLength(1)
    }
  })

  it('should reject invalid priority string', () => {
    const result = createTaskSchema.safeParse({
      name: 'Task',
      listId: 'list-1',
      priority: 'super-high',
    })
    expect(result.success).toBe(false)
  })

  it('should allow completed and completedAt together', () => {
    const result = createTaskSchema.safeParse({
      name: 'Completed Task',
      listId: 'list-1',
      completed: true,
      completedAt: '2026-05-25T10:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})

describe('createListSchema', () => {
  it('should accept valid list data', () => {
    const result = createListSchema.safeParse({
      name: 'Work',
      color: '#3b82f6',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createListSchema.safeParse({
      name: '',
      color: '#3b82f6',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name over 100 characters', () => {
    const result = createListSchema.safeParse({
      name: 'x'.repeat(101),
      color: '#3b82f6',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing color', () => {
    const result = createListSchema.safeParse({
      name: 'Work',
    })
    expect(result.success).toBe(false)
  })

  it('should use default values', () => {
    const result = createListSchema.safeParse({
      name: 'Work',
      color: '#3b82f6',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.icon).toBe('')
      expect(result.data.isDefault).toBe(false)
    }
  })
})

describe('createLabelSchema', () => {
  it('should accept valid label data', () => {
    const result = createLabelSchema.safeParse({
      name: 'Urgent',
      color: '#ef4444',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createLabelSchema.safeParse({
      name: '',
      color: '#ef4444',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name over 50 characters', () => {
    const result = createLabelSchema.safeParse({
      name: 'x'.repeat(51),
      color: '#ef4444',
    })
    expect(result.success).toBe(false)
  })

  it('should use default icon', () => {
    const result = createLabelSchema.safeParse({
      name: 'Urgent',
      color: '#ef4444',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.icon).toBe('')
    }
  })
})
