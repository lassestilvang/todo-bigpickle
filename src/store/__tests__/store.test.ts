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

describe('Task filtering', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      name: 'Task 1',
      completed: false,
      priority: 'none',
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [],
      labels: [],
      subtasks: [],
    },
    {
      id: '2',
      name: 'Task 2',
      completed: true,
      priority: 'none',
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [],
      labels: [],
      subtasks: [],
    },
  ]

  beforeEach(() => {
    useAppStore.setState({ tasks: mockTasks, currentView: 'all' })
  })

  it('should filter out completed tasks by default', () => {
    const filtered = useAppStore.getState().getFilteredTasks()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })

  it('should show completed tasks when showCompleted is true', () => {
    useAppStore.getState().setShowCompleted(true)
    const filtered = useAppStore.getState().getFilteredTasks()
    expect(filtered).toHaveLength(2)
  })

  it('should filter tasks by search query', () => {
    useAppStore.setState({ 
      tasks: [
        ...mockTasks,
        {
          id: '3',
          name: 'Searchable task',
          description: 'Find me',
          completed: false,
          priority: 'none',
          listId: 'list-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          history: [],
          labels: [],
          subtasks: [],
        }
      ]
    })
    
    useAppStore.getState().setSearchQuery('searchable')
    const filtered = useAppStore.getState().getFilteredTasks()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Searchable task')
  })
})

describe('getTasksByView', () => {
  const today = new Date()

  beforeEach(() => {
    const mockTasks: Task[] = [
        {
          id: '1',
          name: 'Today task',
          date: today,
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
      useAppStore.setState({ tasks: mockTasks })
    })

    it('should return tasks for today view', () => {
      const tasks = useAppStore.getState().getTasksByView('today')
      expect(tasks).toHaveLength(1)
      expect(tasks[0].name).toBe('Today task')
    })
  })

  describe('getOverdueTaskCount', () => {
    it('should count overdue tasks', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      useAppStore.setState({
        tasks: [
          {
            id: '1',
            name: 'Overdue task',
            deadline: pastDate,
            completed: false,
            priority: 'none',
            listId: 'list-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            history: [],
            labels: [],
            subtasks: [],
          },
          {
            id: '2',
            name: 'Completed overdue task',
            deadline: pastDate,
            completed: true,
            priority: 'none',
            listId: 'list-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            history: [],
            labels: [],
            subtasks: [],
          },
        ]
      })

      const count = useAppStore.getState().getOverdueTaskCount()
      expect(count).toBe(1)
    })
  })
})
