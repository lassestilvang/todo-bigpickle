import Database from 'better-sqlite3'
import { Task, List, Label, Subtask, TaskHistory, Priority, RecurringType } from '@/types'
import { randomUUID } from 'crypto'

// Database row types
interface ListRow {
  id: string
  name: string
  color: string
  icon: string
  is_default: number
  created_at: string
  updated_at: string
}

interface TaskRow {
  id: string
  name: string
  description: string | null
  date: string | null
  deadline: string | null
  estimate: number | null
  actual_time: number | null
  priority: string
  recurring: string | null
  recurring_config: string | null
  list_id: string
  completed: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface SubtaskRow {
  id: string
  task_id: string
  title: string
  completed: number
  created_at: string
  updated_at: string
}

interface TaskHistoryRow {
  id: string
  task_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

interface LabelRow {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export class DatabaseService {
  private db: Database.Database

  constructor(dbPath: string = './todo.db') {
    this.db = new Database(dbPath)
    this.initializeTables()
  }

  private initializeTables() {
    // Lists table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Labels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS labels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        date DATETIME,
        deadline DATETIME,
        estimate INTEGER,
        actual_time INTEGER,
        priority TEXT NOT NULL DEFAULT 'none',
        recurring TEXT,
        recurring_config TEXT,
        list_id TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES lists (id)
      )
    `)

    // Subtasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Task history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Task labels junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id TEXT NOT NULL,
        label_id TEXT NOT NULL,
        PRIMARY KEY (task_id, label_id),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES labels (id) ON DELETE CASCADE
      )
    `)

    // Reminders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        reminder_time DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Attachments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Create default inbox list if it doesn't exist
    this.createDefaultInbox()
  }

  private createDefaultInbox() {
    const existingInbox = this.db.prepare('SELECT id FROM lists WHERE is_default = TRUE').get()
    if (!existingInbox) {
      const inboxId = randomUUID()
      this.db.prepare(`
        INSERT INTO lists (id, name, color, icon, is_default)
        VALUES (?, ?, ?, ?, ?)
      `).run(inboxId, 'Inbox', '#3b82f6', '📥', 1)
    }
  }

  // Lists
  getLists(): List[] {
    const rows = this.db.prepare('SELECT * FROM lists ORDER BY created_at').all() as ListRow[]
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      isDefault: Boolean(row.is_default),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  createList(list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): List {
    const id = randomUUID()
    const now = new Date().toISOString()
    
    this.db.prepare(`
      INSERT INTO lists (id, name, color, icon, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, list.name, list.color, list.icon, list.isDefault ? 1 : 0, now, now)

    return {
      id,
      ...list,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }
  }

  // Labels
  getLabels(): Label[] {
    const rows = this.db.prepare('SELECT * FROM labels ORDER BY created_at').all() as LabelRow[]
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  createLabel(label: Omit<Label, 'id' | 'createdAt' | 'updatedAt'>): Label {
    const id = randomUUID()
    const now = new Date().toISOString()
    
    this.db.prepare(`
      INSERT INTO labels (id, name, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, label.name, label.color, label.icon, now, now)

    return {
      id,
      ...label,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }
  }

  // Tasks
  getTasks(): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as TaskRow[]
    
    return rows.map(row => {
      const subtasks = this.getSubtasksForTask(row.id)
      const history = this.getTaskHistory(row.id)
      const labels = this.getLabelsForTask(row.id)
      const reminders = this.getRemindersForTask(row.id)
      const attachments = this.getAttachmentsForTask(row.id)

      return {
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        date: row.date ? new Date(row.date) : undefined,
        deadline: row.deadline ? new Date(row.deadline) : undefined,
        reminders,
        estimate: row.estimate || undefined,
        actualTime: row.actual_time || undefined,
        labels,
        priority: row.priority as Priority,
        subtasks,
        recurring: row.recurring as RecurringType || undefined,
        recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
        listId: row.list_id,
        completed: row.completed === 1,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        history,
        attachments
      }
    })
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Task {
    const id = randomUUID()
    const now = new Date().toISOString()
    
    // Get default inbox list if no listId provided
    let listId = task.listId
    if (!listId) {
      const defaultList = this.db.prepare('SELECT id FROM lists WHERE is_default = TRUE').get() as { id: string } | undefined
      listId = defaultList?.id || ''
      if (!listId) {
        throw new Error('No default list found and no listId provided')
      }
    }
    
    this.db.prepare(`
      INSERT INTO tasks (
        id, name, description, date, deadline, estimate, actual_time,
        priority, recurring, recurring_config, list_id, completed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      task.name,
      task.description,
      task.date ? (typeof task.date === 'string' ? task.date : task.date.toISOString()) : null,
      task.deadline ? (typeof task.deadline === 'string' ? task.deadline : task.deadline.toISOString()) : null,
      task.estimate,
      task.actualTime,
      task.priority,
      task.recurring,
      task.recurringConfig ? JSON.stringify(task.recurringConfig) : null,
      listId,
      task.completed ? 1 : 0,
      now,
      now
    )

    // Add labels
    for (const label of task.labels) {
      this.db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(id, label.id)
    }

    // Add subtasks
    for (const subtask of task.subtasks) {
      this.createSubtask(id, subtask)
    }

    // Add reminders
    if (task.reminders) {
      for (const reminder of task.reminders) {
        this.addReminder(id, reminder)
      }
    }

    // Add attachments
    if (task.attachments) {
      for (const attachment of task.attachments) {
        this.addAttachment(id, attachment)
      }
    }

    return this.getTaskById(id)!
  }

  updateTask(id: string, updates: Partial<Task>): Task {
    const existingTask = this.getTaskById(id)
    if (!existingTask) throw new Error('Task not found')

    // Track changes
    for (const [field, newValue] of Object.entries(updates)) {
      if (field === 'id' || field === 'createdAt' || field === 'updatedAt' || field === 'history') continue
      
      const oldValue = (existingTask as unknown as Record<string, unknown>)[field]
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this.recordTaskHistory(id, field, oldValue, newValue)
      }
    }

    // Update main task fields
    const updateFields: string[] = []
    const updateValues: (string | number | null)[] = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(updates.name)
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(updates.description)
    }
    if (updates.date !== undefined) {
      updateFields.push('date = ?')
      updateValues.push(updates.date?.toISOString())
    }
    if (updates.deadline !== undefined) {
      updateFields.push('deadline = ?')
      updateValues.push(updates.deadline?.toISOString())
    }
    if (updates.estimate !== undefined) {
      updateFields.push('estimate = ?')
      updateValues.push(updates.estimate)
    }
    if (updates.actualTime !== undefined) {
      updateFields.push('actual_time = ?')
      updateValues.push(updates.actualTime)
    }
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?')
      updateValues.push(updates.priority)
    }
    if (updates.recurring !== undefined) {
      updateFields.push('recurring = ?')
      updateValues.push(updates.recurring)
    }
    if (updates.recurringConfig !== undefined) {
      updateFields.push('recurring_config = ?')
      updateValues.push(updates.recurringConfig ? JSON.stringify(updates.recurringConfig) : null)
    }
    if (updates.listId !== undefined) {
      updateFields.push('list_id = ?')
      updateValues.push(updates.listId)
    }
    if (updates.completed !== undefined) {
      updateFields.push('completed = ?')
      updateValues.push(updates.completed ? 1 : 0)
      updateFields.push('completed_at = ?')
      updateValues.push(updates.completed ? new Date().toISOString() : null)
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?')
      updateValues.push(new Date().toISOString())
      updateValues.push(id)

      this.db.prepare(`
        UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?
      `).run(...updateValues)
    }

    // Update labels
    if (updates.labels !== undefined) {
      this.db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(id)
      for (const label of updates.labels) {
        this.db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)')
          .run(id, label.id)
      }
    }

    // Update subtasks
    if (updates.subtasks !== undefined) {
      this.db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(id)
      for (const subtask of updates.subtasks) {
        this.createSubtask(id, subtask)
      }
    }

    return this.getTaskById(id)!
  }

  deleteTask(id: string): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  }

  getTaskById(id: string): Task | undefined {
    const tasks = this.getTasks()
    return tasks.find(task => task.id === id)
  }

  private getSubtasksForTask(taskId: string): Subtask[] {
    const rows = this.db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at')
      .all(taskId) as SubtaskRow[]
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      completed: row.completed === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  private createSubtask(taskId: string, subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): void {
    const id = randomUUID()
    const now = new Date().toISOString()
    
      this.db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, taskId, subtask.title, subtask.completed ? 1 : 0, now, now)
  }

  private getTaskHistory(taskId: string): TaskHistory[] {
    const rows = this.db.prepare('SELECT * FROM task_history WHERE task_id = ? ORDER BY changed_at DESC')
      .all(taskId) as TaskHistoryRow[]
    
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      field: row.field,
      oldValue: row.old_value ? JSON.parse(row.old_value) : null,
      newValue: row.new_value ? JSON.parse(row.new_value) : null,
      changedAt: new Date(row.changed_at)
    }))
  }

  private recordTaskHistory(taskId: string, field: string, oldValue: unknown, newValue: unknown): void {
    const id = randomUUID()
    
    this.db.prepare(`
      INSERT INTO task_history (id, task_id, field, old_value, new_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      taskId,
      field,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    )
  }

  private getLabelsForTask(taskId: string): Label[] {
    const rows = this.db.prepare(`
      SELECT l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = ?
    `).all(taskId) as LabelRow[]

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  private getRemindersForTask(taskId: string): Date[] {
    const rows = this.db.prepare('SELECT reminder_time FROM reminders WHERE task_id = ? ORDER BY reminder_time')
      .all(taskId) as { reminder_time: string }[]
    
    return rows.map(row => new Date(row.reminder_time))
  }

  private addReminder(taskId: string, reminderTime: Date): void {
    const id = randomUUID()
    
    this.db.prepare(`
      INSERT INTO reminders (id, task_id, reminder_time)
      VALUES (?, ?, ?)
    `).run(id, taskId, reminderTime.toISOString())
  }

  private getAttachmentsForTask(taskId: string): string[] {
    const rows = this.db.prepare('SELECT file_path FROM attachments WHERE task_id = ? ORDER BY created_at')
      .all(taskId) as { file_path: string }[]
    
    return rows.map(row => row.file_path)
  }

  private addAttachment(taskId: string, filePath: string): void {
    const id = randomUUID()
    const fileName = filePath.split('/').pop() || ''
    
    this.db.prepare(`
      INSERT INTO attachments (id, task_id, file_path, file_name)
      VALUES (?, ?, ?, ?)
    `).run(id, taskId, filePath, fileName)
  }

  close(): void {
    this.db.close()
  }
}