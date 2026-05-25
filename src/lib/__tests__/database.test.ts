import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { DatabaseService } from '@/lib/database'
import { List, Label } from '@/types'

describe('DatabaseService', () => {
  let db: DatabaseService

  beforeEach(() => {
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
        isDefault: false,
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
        isDefault: false,
      })

      const lists = db.getLists()
      expect(lists).toHaveLength(2)
    })
  })

  describe('Labels', () => {
    it('should create a new label', () => {
      const newLabel = db.createLabel({
        name: 'Urgent',
        color: '#ef4444',
        icon: '🔥',
      })

      expect(newLabel.id).toBeDefined()
      expect(newLabel.name).toBe('Urgent')
      expect(newLabel.color).toBe('#ef4444')
      expect(newLabel.icon).toBe('🔥')
    })

    it('should retrieve a label by id', () => {
      const newLabel = db.createLabel({
        name: 'Urgent',
        color: '#ef4444',
        icon: '🔥',
      })

      const found = db.getLabelById(newLabel.id)
      expect(found).toBeDefined()
      expect(found?.name).toBe('Urgent')

      const notFound = db.getLabelById('nonexistent')
      expect(notFound).toBeUndefined()
    })

    it('should retrieve all labels', () => {
      db.createLabel({
        name: 'Work',
        color: '#3b82f6',
        icon: '💼',
      })

      db.createLabel({
        name: 'Personal',
        color: '#10b981',
        icon: '🏠',
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
        isDefault: false,
      })

      testLabel = db.createLabel({
        name: 'Test Label',
        color: '#10b981',
        icon: '🏷️',
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
        completed: false,
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
        completed: false,
      })

      db.createTask({
        name: 'Task 2',
        priority: 'low',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false,
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
        completed: false,
      })

      const updatedTask = db.updateTask(task.id, {
        name: 'Updated Task',
        priority: 'high',
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
        completed: false,
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
        completed: false,
      })

      db.updateTask(task.id, {
        name: 'Updated Task',
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
        isDefault: false,
      })

      db.createTask({
        name: 'Parent Task',
        priority: 'medium',
        labels: [],
        subtasks: [],
        listId: testList.id,
        completed: false,
      })
    })

    it('should create subtasks for a task', () => {
      const taskWithSubtasks = db.createTask({
        name: 'Task with Subtasks',
        priority: 'medium',
        labels: [],
        subtasks: [
          { title: 'Subtask 1', completed: false },
          { title: 'Subtask 2', completed: true },
        ],
        listId: testList.id,
        completed: false,
      })

      expect(taskWithSubtasks.subtasks).toHaveLength(2)
      expect(taskWithSubtasks.subtasks[0].title).toBe('Subtask 1')
      expect(taskWithSubtasks.subtasks[1].completed).toBe(true)
    })
  })

  describe('List edge cases', () => {
    it('should return undefined for getListById with non-existent id', () => {
      const result = db.getListById('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should update a list name and color', () => {
      const list = db.createList({ name: 'Old Name', color: '#000', icon: '📝', isDefault: false })
      const updated = db.updateList(list.id, { name: 'New Name', color: '#fff' })
      expect(updated.name).toBe('New Name')
      expect(updated.color).toBe('#fff')
    })

    it('should throw when updating a non-existent list', () => {
      expect(() => db.updateList('nonexistent', { name: 'Nope' })).toThrow('List not found')
    })

    it('should throw when deleting a non-existent list', () => {
      expect(() => db.deleteList('nonexistent')).toThrow('List not found')
    })

    it('should throw when deleting the default list', () => {
      const defaultList = db.getLists().find(l => l.isDefault)
      expect(defaultList).toBeDefined()
      expect(() => db.deleteList(defaultList!.id)).toThrow('Cannot delete default list')
    })
  })

  describe('Label write operations', () => {
    it('should update a label', () => {
      const label = db.createLabel({ name: 'Old', color: '#000', icon: '' })
      const updated = db.updateLabel(label.id, { name: 'Updated', color: '#fff' })
      expect(updated.name).toBe('Updated')
      expect(updated.color).toBe('#fff')
    })

    it('should throw when updating a non-existent label', () => {
      expect(() => db.updateLabel('nonexistent', { name: 'Nope' })).toThrow('Label not found')
    })

    it('should delete a label', () => {
      const label = db.createLabel({ name: 'Temp', color: '#000', icon: '' })
      db.deleteLabel(label.id)
      const found = db.getLabelById(label.id)
      expect(found).toBeUndefined()
    })

    it('should not throw when deleting a non-existent label', () => {
      expect(() => db.deleteLabel('nonexistent')).not.toThrow()
    })
  })

  describe('Task edge cases', () => {
    let testList: List

    beforeEach(() => {
      testList = db.createList({ name: 'Edge', color: '#000', icon: '', isDefault: false })
    })

    it('should return undefined for getTaskById with non-existent id', () => {
      const result = db.getTaskById('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should return empty array for getTasks when no tasks exist', () => {
      const tasks = db.getTasks()
      expect(tasks).toEqual([])
    })

    it('should create a task with default list fallback using empty string listId', () => {
      const task = db.createTask({ name: 'Fallback Task', priority: 'low', labels: [], subtasks: [], listId: '' })
      expect(task.id).toBeDefined()
      expect(task.name).toBe('Fallback Task')
      const defaultList = db.getLists().find(l => l.isDefault)
      expect(task.listId).toBe(defaultList!.id)
    })

    it('should update task position', () => {
      const t1 = db.createTask({ name: 'First', priority: 'low', labels: [], subtasks: [], listId: testList.id })
      const t2 = db.createTask({ name: 'Second', priority: 'low', labels: [], subtasks: [], listId: testList.id })
      db.updateTaskPositions([
        { id: t1.id, position: 1 },
        { id: t2.id, position: 0 },
      ])
      const tasks = db.getTasks()
      expect(tasks.find(t => t.id === t1.id)!.position).toBe(1)
      expect(tasks.find(t => t.id === t2.id)!.position).toBe(0)
    })

    it('should delete list and all its tasks', () => {
      db.createTask({ name: 'About to be deleted', priority: 'low', labels: [], subtasks: [], listId: testList.id })
      db.deleteList(testList.id)
      const tasks = db.getTasks()
      expect(tasks.filter(t => t.listId === testList.id)).toHaveLength(0)
    })
  })
})
