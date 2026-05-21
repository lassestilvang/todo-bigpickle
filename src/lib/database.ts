import Database from 'better-sqlite3'
import { Task, List, Label, Subtask, TaskHistory, Priority, RecurringType } from '@/types'
import { randomUUID } from 'crypto'

type LabelRef = { id: string }
type SubtaskInput = { title: string; completed?: boolean }
interface TaskInput {
  name: string
  description?: string
  date?: Date | string
  deadline?: Date | string
  estimate?: number
  actualTime?: number
  labels?: LabelRef[]
  priority?: Priority
  subtasks?: SubtaskInput[]
  recurring?: RecurringType
  recurringConfig?: Record<string, unknown>
  listId: string
  completed?: boolean
  completedAt?: Date
  position?: number
  reminders?: Date[]
  attachments?: string[]
}
type TaskUpdate = Partial<TaskInput>

const TRACKED_TASK_FIELDS = new Set<keyof Task>([
  'name', 'description', 'date', 'deadline', 'priority',
  'completed', 'listId', 'estimate', 'actualTime', 'recurring'
])

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
  position: number
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

  constructor(dbPath?: string) {
    const path = dbPath || process.env.DATABASE_PATH || './todo.db'
    this.db = new Database(path)
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

    // Add position column for task ordering (migration for existing DBs)
    const hasPositionColumn = this.db.prepare(
      "SELECT COUNT(*) as cnt FROM pragma_table_info('tasks') WHERE name = 'position'"
    ).get() as { cnt: number }
    if (!hasPositionColumn.cnt) {
      this.db.exec(`ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0`)
      // Set initial positions based on created_at order
      this.db.exec(`
        UPDATE tasks SET position = (
          SELECT COUNT(*) FROM tasks t2
          WHERE t2.created_at < tasks.created_at
          OR (t2.created_at = tasks.created_at AND t2.id < tasks.id)
        )
      `)
    }

    // Create indexes for better query performance
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)`)
  
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
  /**
   * Get all lists from the database
   * @returns {List[]} Array of lists ordered by creation date
   */
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

  /**
   * Create a new list in the database
   * @param {Omit<List, 'id' | 'createdAt' | 'updatedAt'>} list - The list data without id and timestamps
   * @returns {List} The created list with generated id and timestamps
   */
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

  /**
   * Get a single list by its ID
   * @param {string} id - The list ID
   * @returns {List | undefined} The list if found, undefined otherwise
   */
  getListById(id: string): List | undefined {
    const row = this.db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as ListRow | undefined
    if (!row) return undefined
    
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      isDefault: Boolean(row.is_default),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * Update an existing list
   * @param {string} id - The list ID
   * @param {Partial<Omit<List, 'id' | 'createdAt' | 'updatedAt'>>} updates - The fields to update
   * @returns {List} The updated list
   * @throws {Error} If the list is not found
   */
  updateList(id: string, updates: Partial<Omit<List, 'id' | 'createdAt' | 'updatedAt'>>): List {
    const existing = this.getListById(id)
    if (!existing) throw new Error('List not found')

    const fields: string[] = []
    const values: (string | number)[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?')
      values.push(updates.icon)
    }
    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?')
      values.push(updates.isDefault ? 1 : 0)
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())

    values.push(id)

    this.db.prepare(`UPDATE lists SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    return this.getListById(id)!
  }

  /**
   * Delete a list and all its associated tasks
   * @param {string} id - The list ID
   * @throws {Error} If the list is not found or is the default list
   */
  deleteList(id: string): void {
    const existing = this.getListById(id)
    if (!existing) throw new Error('List not found')
    if (existing.isDefault) throw new Error('Cannot delete default list')

    // Delete associated tasks first
    this.db.prepare('DELETE FROM tasks WHERE list_id = ?').run(id)
    
    this.db.prepare('DELETE FROM lists WHERE id = ?').run(id)
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

  getLabelById(id: string): Label | undefined {
    const row = this.db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow | undefined
    if (!row) return undefined

    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
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

  updateLabel(id: string, updates: Partial<Omit<Label, 'id' | 'createdAt' | 'updatedAt'>>): Label {
    const existing = this.db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow | undefined
    if (!existing) throw new Error('Label not found')

    const fields: string[] = []
    const values: (string | number)[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?')
      values.push(updates.icon)
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    this.db.prepare(`UPDATE labels SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    const updated = this.db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow
    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon,
      createdAt: new Date(updated.created_at),
      updatedAt: new Date(updated.updated_at)
    }
  }

  deleteLabel(id: string): void {
    this.db.prepare('DELETE FROM labels WHERE id = ?').run(id)
  }

  // Tasks
  /**
   * Get all tasks from the database with all related data
   * Uses batched queries to avoid N+1 problem
   * @returns {Task[]} Array of tasks with subtasks, labels, reminders, and attachments
   */
  getTasks(): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks ORDER BY position ASC, created_at DESC').all() as TaskRow[]
    const ids = rows.map(r => r.id)
    if (ids.length === 0) return []

    // Batch fetch all related data in 5 queries instead of 5 per task
    const allLabels = this.batchGetLabelsForTasks(ids)
    const allSubtasks = this.batchGetSubtasksForTasks(ids)
    const allHistory = this.batchGetHistoryForTasks(ids)
    const allReminders = this.batchGetRemindersForTasks(ids)
    const allAttachments = this.batchGetAttachmentsForTasks(ids)

    return rows.map(row => this.mapRowToTask(row, allLabels, allSubtasks, allHistory, allReminders, allAttachments))
  }

  private mapRowToTask(
    row: TaskRow,
    allLabels?: Map<string, Label[]>,
    allSubtasks?: Map<string, Subtask[]>,
    allHistory?: Map<string, TaskHistory[]>,
    allReminders?: Map<string, Date[]>,
    allAttachments?: Map<string, string[]>
  ): Task {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      date: row.date ? new Date(row.date) : undefined,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      reminders: allReminders?.get(row.id) || this.getRemindersForTask(row.id),
      estimate: row.estimate ?? undefined,
      actualTime: row.actual_time ?? undefined,
      labels: allLabels?.get(row.id) || this.getLabelsForTask(row.id),
      priority: row.priority as Priority,
      subtasks: allSubtasks?.get(row.id) || this.getSubtasksForTask(row.id),
      recurring: row.recurring as RecurringType || undefined,
      recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
      listId: row.list_id,
      completed: row.completed === 1,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      position: row.position,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      history: allHistory?.get(row.id) || this.getTaskHistory(row.id),
      attachments: allAttachments?.get(row.id) || this.getAttachmentsForTask(row.id)
    }
  }

  private batchGetLabelsForTasks(taskIds: string[]): Map<string, Label[]> {
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = this.db.prepare(`
      SELECT tl.task_id, l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id IN (${placeholders})
    `).all(...taskIds) as (LabelRow & { task_id: string })[]

    const map = new Map<string, Label[]>()
    for (const row of rows) {
      if (!map.has(row.task_id)) map.set(row.task_id, [])
      map.get(row.task_id)!.push({
        id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      })
    }
    return map
  }

  private batchGetSubtasksForTasks(taskIds: string[]): Map<string, Subtask[]> {
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = this.db.prepare(
      `SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY created_at`
    ).all(...taskIds) as (SubtaskRow)[]

    const map = new Map<string, Subtask[]>()
    for (const row of rows) {
      if (!map.has(row.task_id)) map.set(row.task_id, [])
      map.get(row.task_id)!.push({
        id: row.id,
        title: row.title,
        completed: row.completed === 1,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      })
    }
    return map
  }

  private batchGetHistoryForTasks(taskIds: string[]): Map<string, TaskHistory[]> {
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = this.db.prepare(
      `SELECT * FROM task_history WHERE task_id IN (${placeholders}) ORDER BY changed_at DESC`
    ).all(...taskIds) as (TaskHistoryRow)[]

    const map = new Map<string, TaskHistory[]>()
    for (const row of rows) {
      if (!map.has(row.task_id)) map.set(row.task_id, [])
      map.get(row.task_id)!.push({
        id: row.id,
        taskId: row.task_id,
        field: row.field,
        oldValue: row.old_value ? JSON.parse(row.old_value) : null,
        newValue: row.new_value ? JSON.parse(row.new_value) : null,
        changedAt: new Date(row.changed_at)
      })
    }
    return map
  }

  private batchGetRemindersForTasks(taskIds: string[]): Map<string, Date[]> {
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = this.db.prepare(
      `SELECT task_id, reminder_time FROM reminders WHERE task_id IN (${placeholders}) ORDER BY reminder_time`
    ).all(...taskIds) as { task_id: string; reminder_time: string }[]

    const map = new Map<string, Date[]>()
    for (const row of rows) {
      if (!map.has(row.task_id)) map.set(row.task_id, [])
      map.get(row.task_id)!.push(new Date(row.reminder_time))
    }
    return map
  }

  private batchGetAttachmentsForTasks(taskIds: string[]): Map<string, string[]> {
    const placeholders = taskIds.map(() => '?').join(',')
    const rows = this.db.prepare(
      `SELECT task_id, file_path FROM attachments WHERE task_id IN (${placeholders}) ORDER BY created_at`
    ).all(...taskIds) as { task_id: string; file_path: string }[]

    const map = new Map<string, string[]>()
    for (const row of rows) {
      if (!map.has(row.task_id)) map.set(row.task_id, [])
      map.get(row.task_id)!.push(row.file_path)
    }
    return map
  }

  /**
   * Create a new task in the database
   * @param {Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>} task - The task data without id and timestamps
   * @returns {Task} The created task with generated id and timestamps
   * @throws {Error} If no default list found and no listId provided
   */
  createTask(task: TaskInput): Task {
    const insert = this.db.transaction(() => {
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
      
      const maxPos = this.db.prepare(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks'
      ).get() as { next_pos: number }
      const position = task.position ?? maxPos.next_pos

      this.db.prepare(`
        INSERT INTO tasks (
          id, name, description, date, deadline, estimate, actual_time,
          priority, recurring, recurring_config, list_id, completed,
          completed_at, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        task.completedAt ? (typeof task.completedAt === 'string' ? task.completedAt : task.completedAt.toISOString()) : null,
        position,
        now,
        now
      )

      // Add labels
      if (task.labels) {
        for (const label of task.labels) {
          this.db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)')
            .run(id, label.id)
        }
      }

      // Add subtasks
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          this.createSubtask(id, subtask)
        }
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

      return id
    })

    const id = insert()
    return this.getTaskById(id)!
  }

  updateTask(id: string, updates: TaskUpdate): Task {
    const existingTask = this.getTaskById(id)
    if (!existingTask) throw new Error('Task not found')

    const update = this.db.transaction(() => {
      // Track changes
      for (const [field, newValue] of Object.entries(updates)) {
        if (!TRACKED_TASK_FIELDS.has(field as keyof Task)) continue

        const oldValue = existingTask[field as keyof Task]
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
        updateValues.push(typeof updates.date === 'string' ? updates.date : updates.date?.toISOString() ?? null)
      }
      if (updates.deadline !== undefined) {
        updateFields.push('deadline = ?')
        updateValues.push(typeof updates.deadline === 'string' ? updates.deadline : updates.deadline?.toISOString() ?? null)
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
    })

    update()
    return this.getTaskById(id)!
  }

  deleteTask(id: string): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  }

  getTaskById(id: string): Task | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
    if (!row) return undefined
    return this.mapRowToTask(row)
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

  private createSubtask(taskId: string, subtask: SubtaskInput): void {
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

  /**
   * Batch update task positions for reordering
   * @param {Array<{id: string, position: number}>} positions - Array of task ID and new position pairs
   */
  updateTaskPositions(positions: { id: string; position: number }[]): void {
    const update = this.db.transaction(() => {
      const stmt = this.db.prepare('UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?')
      const now = new Date().toISOString()
      for (const { id, position } of positions) {
        stmt.run(position, now, id)
      }
    })
    update()
  }

  close(): void {
    this.db.close()
  }
}