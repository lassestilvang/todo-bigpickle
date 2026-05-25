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
