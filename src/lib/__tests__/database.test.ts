import { DatabaseService } from '@/lib/database'
import { Task, List, Label } from '@/types'

describe('DatabaseService', () => {
  let db: DatabaseService

  beforeEach(() => {
    // Use in-memory database for testing
    db = new DatabaseService(':memory:')
  })

  afterEach(() => {
    db.close()
  })

  describe('Lists', () => {
    it('should create a default inbox list', () => {
      const lists = db.getLists()
      expect(lists).toHaveLength(1)
      expect(lists[0].name).toBe('Inbox')
      expect(lists[0].isDefault).toBe(true)
    })

    it('should create a new list', () => {
      const newList = db.createList({
        name: 'Work',
        color: '#3b82f6',
        icon: '💼',
        isDefault: false
      })

      expect(newList.id).toBeDefined()
      expect(newList.name).toBe('Work')
      expect(newList.color).toBe('#3b82f6')
      expect(newList.icon).toBe('💼')
      expect(newList.isDefault).toBe(false)
    })

    it('should retrieve all lists', () => {
      db.createList({
        name: 'Personal',
        color: '#10b981',
        icon: '🏠',
        isDefault: false
      })

      const lists = db.getLists()
      expect(lists).toHaveLength(2) // Default inbox + new list
    })
  })

  describe('Labels', () => {
    it('should create a new label', () => {
      const newLabel = db.createLabel({
        name: 'Urgent',
        color: '#ef4444',
        icon: '🔥'
      })

      expect(newLabel.id).toBeDefined()
      expect(newLabel.name).toBe('Urgent')
      expect(newLabel.color).toBe('#ef4444')
      expect(newLabel.icon).toBe('🔥')
    })

    it('should retrieve all labels', () => {
      db.createLabel({
        name: 'Work',
        color: '#3b82f6',
        icon: '💼'
      })

      db.createLabel({
        name: 'Personal',
        color: '#10b981',
        icon: '🏠'
      })

      const labels = db.getLabels()
      expect(labels).toHaveLength(2)
    })
  })

  describe('Tasks', () => {
    let testList: List
    let testLabel: Label

    beforeEach(() => {
      testList = db.createList({
        name: 'Test List',
        color: '#3b82f6',
        icon: '📝',
        isDefault: false
      })

      testLabel = db.createLabel({
        name: 'Test Label',
        color: '#10b981',
        icon: '🏷️'
      })
    })

    it('should create a new task', () => {
      const newTask = db.createTask({
        name: 'Test Task',
        description: 'This is a test task',
        priority: 'high',
        labels: [testLabel],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      expect(newTask.id).toBeDefined()
      expect(newTask.name).toBe('Test Task')
      expect(newTask.description).toBe('This is a test task')
      expect(newTask.priority).toBe('high')
      expect(newTask.labels).toHaveLength(1)
      expect(newTask.labels[0].name).toBe('Test Label')
    })

    it('should retrieve all tasks', () => {
      db.createTask({
        name: 'Task 1',
        priority: 'medium',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      db.createTask({
        name: 'Task 2',
        priority: 'low',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      const tasks = db.getTasks()
      expect(tasks).toHaveLength(2)
    })

    it('should update a task', () => {
      const task = db.createTask({
        name: 'Original Task',
        priority: 'low',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      const updatedTask = db.updateTask(task.id, {
        name: 'Updated Task',
        priority: 'high'
      })

      expect(updatedTask.name).toBe('Updated Task')
      expect(updatedTask.priority).toBe('high')
    })

    it('should delete a task', () => {
      const task = db.createTask({
        name: 'Task to Delete',
        priority: 'medium',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      let tasks = db.getTasks()
      expect(tasks).toHaveLength(1)

      db.deleteTask(task.id)

      tasks = db.getTasks()
      expect(tasks).toHaveLength(0)
    })

    it('should record task history', () => {
      const task = db.createTask({
        name: 'Original Task',
        priority: 'low',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })

      db.updateTask(task.id, {
        name: 'Updated Task'
      })

      const updatedTask = db.getTaskById(task.id)
      expect(updatedTask?.history).toHaveLength(1)
      expect(updatedTask?.history[0].field).toBe('name')
      expect(updatedTask?.history[0].oldValue).toBe('Original Task')
      expect(updatedTask?.history[0].newValue).toBe('Updated Task')
    })
  })

  describe('Subtasks', () => {
    let testList: List

    beforeEach(() => {
      testList = db.createList({
        name: 'Test List',
        color: '#3b82f6',
        icon: '📝',
        isDefault: false
      })

      db.createTask({
        name: 'Parent Task',
        priority: 'medium',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false
      })
    })

    it('should create subtasks for a task', () => {
      const taskWithSubtasks = db.createTask({
        name: 'Task with Subtasks',
        priority: 'medium',
        labels: [],
        subtasks: [
          {
            id: crypto.randomUUID(),
            title: 'Subtask 1',
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: crypto.randomUUID(),
            title: 'Subtask 2',
            completed: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        listId: testList.id,
        completed: false
      })

      expect(taskWithSubtasks.subtasks).toHaveLength(2)
      expect(taskWithSubtasks.subtasks[0].title).toBe('Subtask 1')
      expect(taskWithSubtasks.subtasks[1].completed).toBe(true)
    })
  })
})