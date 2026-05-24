import { useAppStore } from '@/store'
import { Task } from '@/types'

// Mock the API module
jest.mock('@/lib/api', () => ({
  api: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getLists: jest.fn(),
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    getLabels: jest.fn(),
    createLabel: jest.fn(),
  }
}))

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().setCurrentView('today')
    useAppStore.getState().setSelectedListId(undefined)
    useAppStore.getState().setShowCompleted(false)
    useAppStore.getState().setSearchQuery('')
    // Clear tasks, lists, labels
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
