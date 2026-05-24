import { mock, describe, expect, it, beforeEach } from 'bun:test'
import { Task } from '@/types'

const mockApi = {
  getTasks: mock(() => {}),
  createTask: mock(() => {}),
  updateTask: mock(() => {}),
  deleteTask: mock(() => {}),
  getLists: mock(() => {}),
  createList: mock(() => {}),
  updateList: mock(() => {}),
  deleteList: mock(() => {}),
  getLabels: mock(() => {}),
  createLabel: mock(() => {}),
  reorderTasks: mock(() => {}),
}

mock.module('@/lib/api', () => ({
  api: mockApi,
}))

const { useAppStore } = await import('@/store')

describe('AppStore', () => {
  beforeEach(() => {
    useAppStore.getState().setCurrentView('today')
    useAppStore.getState().setSelectedListId(undefined)
    useAppStore.getState().setShowCompleted(false)
    useAppStore.getState().setSearchQuery('')
    useAppStore.setState({ tasks: [], lists: [], labels: [] })
  })

  describe('View actions', () => {
    it('should set current view', () => {
      useAppStore.getState().setCurrentView('upcoming')
      expect(useAppStore.getState().currentView).toBe('upcoming')
    })

    it('should set selected list id', () => {
      useAppStore.getState().setSelectedListId('list-1')
      expect(useAppStore.getState().selectedListId).toBe('list-1')
    })

    it('should toggle show completed', () => {
      useAppStore.getState().setShowCompleted(true)
      expect(useAppStore.getState().showCompleted).toBe(true)
    })

    it('should set search query', () => {
      useAppStore.getState().setSearchQuery('test')
      expect(useAppStore.getState().searchQuery).toBe('test')
    })
  })
})

describe('Store state', () => {
  it('should allow setting tasks directly', () => {
    const tasks: Task[] = [
      {
        id: '1',
        name: 'Test task',
        completed: false,
        priority: 'none',
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [],
        labels: [],
        subtasks: [],
      },
    ]
    useAppStore.setState({ tasks })
    expect(useAppStore.getState().tasks).toHaveLength(1)
    expect(useAppStore.getState().tasks[0].name).toBe('Test task')
  })
})
