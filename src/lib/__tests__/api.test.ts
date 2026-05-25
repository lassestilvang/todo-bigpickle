import { describe, expect, it, mock, beforeEach } from 'bun:test'

const mockJson = mock(() => ({}))
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: mockJson,
  })
)

globalThis.fetch = mockFetch

const { api } = await import('@/lib/api')

beforeEach(() => {
  mockFetch.mockClear()
  mockJson.mockClear()
  globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
})

describe('api.getTasks', () => {
  it('should fetch tasks from /api/tasks', async () => {
    const tasks = [{ id: '1', name: 'Test' }]
    mockJson.mockResolvedValue(tasks)
    const result = await api.getTasks()
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object))
    expect(result).toEqual(tasks)
  })
})

describe('api.createTask', () => {
  it('should POST task data to /api/tasks', async () => {
    const taskData = { name: 'New Task', priority: 'high' as const, listId: '1', completed: false, labels: [], subtasks: [] }
    const created = { id: 'new-id', ...taskData }
    mockJson.mockResolvedValue(created)
    const result = await api.createTask(taskData)
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(result).toEqual(created)
  })
})

describe('api.updateTask', () => {
  it('should PUT updates to /api/tasks/:id', async () => {
    mockJson.mockResolvedValue({ id: '1', name: 'Updated' })
    const result = await api.updateTask('1', { name: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({ method: 'PUT' }))
    expect(result).toEqual({ id: '1', name: 'Updated' })
  })
})

describe('api.deleteTask', () => {
  it('should DELETE /api/tasks/:id', async () => {
    mockJson.mockResolvedValue(undefined)
    await api.deleteTask('1')
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('api.reorderTasks', () => {
  it('should PATCH reorder data to /api/tasks', async () => {
    mockJson.mockResolvedValue({ success: true })
    const reorder = [{ id: '1', position: 2 }, { id: '2', position: 0 }]
    const result = await api.reorderTasks(reorder)
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ method: 'PATCH' }))
    expect(result).toEqual({ success: true })
  })
})

describe('api.getLists', () => {
  it('should fetch lists from /api/lists', async () => {
    mockJson.mockResolvedValue([{ id: '1', name: 'Inbox' }])
    const result = await api.getLists()
    expect(mockFetch).toHaveBeenCalledWith('/api/lists', expect.any(Object))
    expect(result).toHaveLength(1)
  })
})

describe('api.createList', () => {
  it('should POST list data to /api/lists', async () => {
    mockJson.mockResolvedValue({ id: 'l1', name: 'Work', color: '#3b82f6', icon: '💼', isDefault: false })
    const result = await api.createList({ name: 'Work', color: '#3b82f6', icon: '💼', isDefault: false })
    expect(mockFetch).toHaveBeenCalledWith('/api/lists', expect.objectContaining({ method: 'POST' }))
    expect(result.name).toBe('Work')
  })
})

describe('api.updateList', () => {
  it('should PUT updates to /api/lists/:id', async () => {
    mockJson.mockResolvedValue({ id: '1', name: 'Updated List' })
    const result = await api.updateList('1', { name: 'Updated List' })
    expect(mockFetch).toHaveBeenCalledWith('/api/lists/1', expect.objectContaining({ method: 'PUT' }))
    expect(result.name).toBe('Updated List')
  })
})

describe('api.deleteList', () => {
  it('should DELETE /api/lists/:id', async () => {
    mockJson.mockResolvedValue(undefined)
    await api.deleteList('1')
    expect(mockFetch).toHaveBeenCalledWith('/api/lists/1', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('api.getLabels', () => {
  it('should fetch labels from /api/labels', async () => {
    mockJson.mockResolvedValue([{ id: '1', name: 'Urgent' }])
    const result = await api.getLabels()
    expect(mockFetch).toHaveBeenCalledWith('/api/labels', expect.any(Object))
    expect(result).toHaveLength(1)
  })
})

describe('api.createLabel', () => {
  it('should POST label data to /api/labels', async () => {
    mockJson.mockResolvedValue({ id: 'lb1', name: 'Urgent', color: '#ef4444', icon: '🔥' })
    const result = await api.createLabel({ name: 'Urgent', color: '#ef4444', icon: '🔥' })
    expect(mockFetch).toHaveBeenCalledWith('/api/labels', expect.objectContaining({ method: 'POST' }))
    expect(result.name).toBe('Urgent')
  })
})

describe('api.updateLabel', () => {
  it('should PUT updates to /api/labels/:id', async () => {
    mockJson.mockResolvedValue({ id: '1', name: 'Updated Label' })
    const result = await api.updateLabel('1', { name: 'Updated Label' })
    expect(mockFetch).toHaveBeenCalledWith('/api/labels/1', expect.objectContaining({ method: 'PUT' }))
    expect(result.name).toBe('Updated Label')
  })
})

describe('api.deleteLabel', () => {
  it('should DELETE /api/labels/:id', async () => {
    mockJson.mockResolvedValue(undefined)
    await api.deleteLabel('1')
    expect(mockFetch).toHaveBeenCalledWith('/api/labels/1', expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('API error handling', () => {
  it('should throw with error message from response body', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response))
    expect(api.getTasks()).rejects.toThrow('Not found')
  })

  it('should throw with generic message when no error body', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: false,
      json: async () => ({}),
    } as Response))
    expect(api.getTasks()).rejects.toThrow('Request failed')
  })

  it('should throw with message field from response body', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: false,
      json: async () => ({ message: 'Bad request' }),
    } as Response))
    expect(api.getTasks()).rejects.toThrow('Bad request')
  })

  it('should handle JSON parse error in error response gracefully', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: false,
      json: async () => { throw new Error('Invalid JSON') },
    } as Response))
    expect(api.getTasks()).rejects.toThrow('Request failed')
  })
})

describe('API abort handling', () => {
  it('should pass abort signal to fetch', async () => {
    const controller = new AbortController()
    mockJson.mockResolvedValue([])
    await api.getTasks(controller.signal)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })
})

describe('API reorder edge cases', () => {
  it('should send reorder payload correctly', async () => {
    mockJson.mockResolvedValue({ success: true })
    const reorder = [{ id: 't1', position: 2 }, { id: 't2', position: 0 }]
    await api.reorderTasks(reorder)
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ reorder }),
    }))
  })
})
