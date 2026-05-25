import { mock, describe, expect, it, beforeEach } from 'bun:test'
import { Task, List, Label } from '@/types'

const mockApi = {
  getTasks: mock(() => {}),
  createTask: mock(() => {}),
  updateTask: mock(() => {}),
  deleteTask: mock(() => {}),
  reorderTasks: mock(() => {}),
  getLists: mock(() => {}),
  createList: mock(() => {}),
  updateList: mock(() => {}),
  deleteList: mock(() => {}),
  getLabels: mock(() => {}),
  createLabel: mock(() => {}),
  updateLabel: mock(() => {}),
  deleteLabel: mock(() => {}),
}

mock.module('@/lib/api', () => ({
  api: mockApi,
}))

const { useAppStore } = await import('@/store')

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  name: 'Test Task',
  completed: false,
  priority: 'none',
  listId: 'list-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  history: [],
  labels: [],
  subtasks: [],
  ...overrides,
})

const makeList = (overrides: Partial<List> = {}): List => ({
  id: 'list-1',
  name: 'Inbox',
  color: '#3b82f6',
  icon: '📥',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const resetStore = () => {
  useAppStore.setState({
    tasks: [],
    lists: [],
    labels: [],
    currentView: 'all',
    selectedListId: undefined,
    showCompleted: false,
    searchQuery: '',
    isLoading: false,
    error: null,
    reorderVersion: 0,
  })
}

const resetMocks = () => {
  for (const key of Object.keys(mockApi) as (keyof typeof mockApi)[]) {
    mockApi[key].mockReset()
  }
}

describe('Store task actions', () => {
  beforeEach(() => {
    resetMocks()
    resetStore()
  })

  describe('addTask', () => {
    it('should optimistically add a task and replace with server response', async () => {
      const serverTask = makeTask({ id: 'server-id', name: 'Server Task' })
      mockApi.createTask.mockResolvedValue(serverTask)

      const addPromise = useAppStore.getState().addTask({
        name: 'Server Task',
        priority: 'high',
        listId: 'list-1',
        completed: false,
        labels: [],
        subtasks: [],
      })

      const stateAfterOptimistic = useAppStore.getState()
      expect(stateAfterOptimistic.tasks).toHaveLength(1)
      expect(stateAfterOptimistic.tasks[0].name).toBe('Server Task')
      expect(stateAfterOptimistic.tasks[0].id).toMatch(/^temp_/)

      await addPromise

      const stateAfterResolve = useAppStore.getState()
      expect(stateAfterResolve.tasks).toHaveLength(1)
      expect(stateAfterResolve.tasks[0].id).toBe('server-id')
    })

    it('should roll back optimistic task on API failure', async () => {
      mockApi.createTask.mockRejectedValue(new Error('Network error'))

      const addPromise = useAppStore.getState().addTask({
        name: 'Fail Task',
        priority: 'low',
        listId: 'list-1',
        completed: false,
        labels: [],
        subtasks: [],
      })

      expect(useAppStore.getState().tasks).toHaveLength(1)

      await addPromise

      expect(useAppStore.getState().tasks).toHaveLength(0)
    })
  })

  describe('updateTask', () => {
    it('should optimistically apply update and revert on API failure', async () => {
      const original = makeTask({ id: 't1', name: 'Original' })
      useAppStore.setState({ tasks: [original] })

      mockApi.updateTask.mockRejectedValue(new Error('Save failed'))

      useAppStore.getState().updateTask('t1', { name: 'Updated' })

      expect(useAppStore.getState().tasks[0].name).toBe('Updated')

      await new Promise(resolve => setTimeout(resolve, 0))
      expect(useAppStore.getState().tasks[0].name).toBe('Original')
    })
  })

  describe('deleteTask', () => {
    it('should optimistically remove a task', async () => {
      const task = makeTask({ id: 't1' })
      useAppStore.setState({ tasks: [task] })
      mockApi.deleteTask.mockResolvedValue(undefined)

      const deletePromise = useAppStore.getState().deleteTask('t1')

      expect(useAppStore.getState().tasks).toHaveLength(0)

      await deletePromise
      expect(useAppStore.getState().tasks).toHaveLength(0)
    })

    it('should restore task on API failure', async () => {
      const task = makeTask({ id: 't1', name: 'Keep me' })
      useAppStore.setState({ tasks: [task] })
      mockApi.deleteTask.mockRejectedValue(new Error('Delete failed'))

      await useAppStore.getState().deleteTask('t1')

      await new Promise(resolve => setTimeout(resolve, 0))
      expect(useAppStore.getState().tasks).toHaveLength(1)
      expect(useAppStore.getState().tasks[0].name).toBe('Keep me')
    })
  })

  describe('toggleTaskComplete', () => {
    it('should toggle a task from incomplete to complete', async () => {
      const task = makeTask({ id: 't1', completed: false })
      useAppStore.setState({ tasks: [task] })
      mockApi.updateTask.mockResolvedValue({ ...task, completed: true })

      await useAppStore.getState().toggleTaskComplete('t1')

      expect(useAppStore.getState().tasks[0].completed).toBe(true)
      expect(useAppStore.getState().tasks[0].completedAt).toBeDefined()
    })

    it('should revert toggle on API failure', async () => {
      const task = makeTask({ id: 't1', completed: false })
      useAppStore.setState({ tasks: [task] })
      mockApi.updateTask.mockRejectedValue(new Error('Fail'))

      await useAppStore.getState().toggleTaskComplete('t1')

      await new Promise(resolve => setTimeout(resolve, 0))
      expect(useAppStore.getState().tasks[0].completed).toBe(false)
    })
  })

  describe('reorderTasks', () => {
    it('should update positions optimistically', async () => {
      const t1 = makeTask({ id: 't1', position: 0 })
      const t2 = makeTask({ id: 't2', position: 1 })
      const t3 = makeTask({ id: 't3', position: 2 })
      useAppStore.setState({ tasks: [t1, t2, t3] })
      mockApi.reorderTasks.mockResolvedValue({ success: true })

      await useAppStore.getState().reorderTasks([
        { id: 't1', position: 2 },
        { id: 't2', position: 0 },
        { id: 't3', position: 1 },
      ])

      const positions = useAppStore.getState().tasks.map(t => [t.id, t.position])
      expect(positions).toEqual([
        ['t2', 0],
        ['t3', 1],
        ['t1', 2],
      ])
    })

    it('should revert positions on API failure', async () => {
      const t1 = makeTask({ id: 't1', position: 0 })
      const t2 = makeTask({ id: 't2', position: 1 })
      useAppStore.setState({ tasks: [t1, t2] })
      mockApi.reorderTasks.mockRejectedValue(new Error('Fail'))

      await useAppStore.getState().reorderTasks([
        { id: 't1', position: 1 },
        { id: 't2', position: 0 },
      ])

      await new Promise(resolve => setTimeout(resolve, 0))
      const positions = useAppStore.getState().tasks.map(t => [t.id, t.position])
      expect(positions).toEqual([
        ['t1', 0],
        ['t2', 1],
      ])
    })
  })
})

describe('Store list actions', () => {
  beforeEach(() => {
    resetMocks()
    useAppStore.setState({ lists: [], tasks: [], labels: [], error: null })
  })

  it('should add a list', async () => {
    const newList = makeList({ id: 'l1', name: 'Work' })
    mockApi.createList.mockResolvedValue(newList)

    await useAppStore.getState().addList({
      name: 'Work',
      color: '#ef4444',
      icon: '💼',
      isDefault: false,
    })

    expect(useAppStore.getState().lists).toHaveLength(1)
    expect(useAppStore.getState().lists[0].name).toBe('Work')
  })

  it('should not delete the default list', async () => {
    const defaultList = makeList({ id: 'default', isDefault: true })
    useAppStore.setState({ lists: [defaultList] })

    await useAppStore.getState().deleteList('default')

    expect(useAppStore.getState().lists).toHaveLength(1)
    expect(useAppStore.getState().error).toBe('Cannot delete the default list')
  })

  it('should update a list', async () => {
    const list = makeList({ id: 'l1', name: 'Old Name', isDefault: false })
    useAppStore.setState({ lists: [list] })
    mockApi.updateList.mockResolvedValue({ ...list, name: 'New Name' })

    await useAppStore.getState().updateList('l1', { name: 'New Name' })

    expect(useAppStore.getState().lists[0].name).toBe('New Name')
  })

  it('should handle updateList API failure', async () => {
    const list = makeList({ id: 'l1', name: 'Old Name', isDefault: false })
    useAppStore.setState({ lists: [list] })
    mockApi.updateList.mockRejectedValue(new Error('Update failed'))

    await expect(
      useAppStore.getState().updateList('l1', { name: 'New Name' })
    ).rejects.toThrow('Update failed')
  })

  it('should handle addList API failure', async () => {
    mockApi.createList.mockRejectedValue(new Error('Create failed'))

    await expect(
      useAppStore.getState().addList({ name: 'Fail', color: '#000', icon: '', isDefault: false })
    ).rejects.toThrow('Create failed')
  })
})

describe('Store label actions', () => {
  const makeLabel = (overrides: Partial<Label> = {}): Label => ({
    id: 'label-1',
    name: 'Urgent',
    color: '#ef4444',
    icon: '🔥',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  beforeEach(() => {
    resetMocks()
    useAppStore.setState({ labels: [], tasks: [], lists: [], error: null })
  })

  it('should add a label', async () => {
    const label = makeLabel()
    mockApi.createLabel.mockResolvedValue(label)

    await useAppStore.getState().addLabel({ name: 'Urgent', color: '#ef4444', icon: '🔥' })

    expect(useAppStore.getState().labels).toHaveLength(1)
    expect(useAppStore.getState().labels[0].name).toBe('Urgent')
  })

  it('should clean up label references on delete', async () => {
    const label = makeLabel()
    const task = makeTask({ labels: [label] })
    useAppStore.setState({ labels: [label], tasks: [task] })
    mockApi.deleteLabel.mockResolvedValue(undefined)

    await useAppStore.getState().deleteLabel('label-1')

    expect(useAppStore.getState().labels).toHaveLength(0)
    expect(useAppStore.getState().tasks[0].labels).toHaveLength(0)
  })

  it('should update a label', async () => {
    const label = makeLabel({ id: 'lb1', name: 'Old' })
    useAppStore.setState({ labels: [label] })
    mockApi.updateLabel.mockResolvedValue({ ...label, name: 'Updated' })

    await useAppStore.getState().updateLabel('lb1', { name: 'Updated' })

    expect(useAppStore.getState().labels[0].name).toBe('Updated')
  })

  it('should handle updateLabel API failure', async () => {
    const label = makeLabel({ id: 'lb1', name: 'Old' })
    useAppStore.setState({ labels: [label] })
    mockApi.updateLabel.mockRejectedValue(new Error('Update failed'))

    await expect(
      useAppStore.getState().updateLabel('lb1', { name: 'New' })
    ).rejects.toThrow('Update failed')
  })

  it('should handle deleteLabel API failure', async () => {
    const label = makeLabel({ id: 'lb1' })
    useAppStore.setState({ labels: [label] })
    mockApi.deleteLabel.mockRejectedValue(new Error('Delete failed'))

    await expect(
      useAppStore.getState().deleteLabel('lb1')
    ).rejects.toThrow('Delete failed')
  })
})
