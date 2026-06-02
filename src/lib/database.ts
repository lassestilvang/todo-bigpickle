import { Database, Statement } from 'bun:sqlite'
import { Task, List, Label, Subtask, TaskHistory, Priority, RecurringType } from '@/types'
import { randomUUID } from 'crypto'

type LabelRef = { id: string }
type SubtaskInput = { title: string; completed?: boolean; position?: number }
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
  position: number
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
  private db: Database
  private stmts!: {
    getTaskById: Statement
    deleteTask: Statement
    getSubtasks: Statement
    getLabelsForTask: Statement
    getTaskHistory: Statement
    getReminders: Statement
    getAttachments: Statement
    deleteTaskLabels: Statement
    deleteSubtasks: Statement
    insertTaskLabel: Statement
    insertTaskHistory: Statement
    insertSubtask: Statement
    insertReminder: Statement
    insertAttachment: Statement
    updateTaskPos: Statement
  }

  constructor(dbPath?: string) {
    const path = dbPath || process.env.DATABASE_PATH || './todo.db'
    this.db = new Database(path)

    this.db.run('PRAGMA journal_mode = WAL')
    this.db.run('PRAGMA synchronous = NORMAL')
    this.db.run('PRAGMA cache_size = -80000')
    this.db.run('PRAGMA temp_store = MEMORY')
    this.db.run('PRAGMA mmap_size = 536870912')
    this.db.run('PRAGMA busy_timeout = 5000')
    this.db.run('PRAGMA wal_autocheckpoint = 2000')
    this.db.run('PRAGMA foreign_keys = ON')

    this.initializeTables()
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS labels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        date TEXT,
        deadline TEXT,
        estimate INTEGER,
        actual_time INTEGER,
        priority TEXT NOT NULL DEFAULT 'none',
        recurring TEXT,
        recurring_config TEXT,
        list_id TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (list_id) REFERENCES lists (id)
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    // Migration: add position column if missing
    try {
      this.db.run('ALTER TABLE subtasks ADD COLUMN position INTEGER DEFAULT 0')
    } catch {
      // Column already exists
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id TEXT NOT NULL,
        label_id TEXT NOT NULL,
        PRIMARY KEY (task_id, label_id),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES labels (id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        reminder_time TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    `)

    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_completed_date ON tasks(completed, date)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_list_position ON tasks(list_id, position)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_position_created ON tasks(position, created_at)')

    this.createDefaultInbox()
    this.cacheStatements()
  }

  private cacheStatements() {
    this.stmts = {
      getTaskById: this.db.query('SELECT * FROM tasks WHERE id = ?'),
      deleteTask: this.db.query('DELETE FROM tasks WHERE id = ?'),
      getSubtasks: this.db.query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at'),
      getLabelsForTask: this.db.query(`
        SELECT l.* FROM labels l JOIN task_labels tl ON l.id = tl.label_id WHERE tl.task_id = ?
      `),
      getTaskHistory: this.db.query('SELECT * FROM task_history WHERE task_id = ? ORDER BY changed_at DESC'),
      getReminders: this.db.query('SELECT reminder_time FROM reminders WHERE task_id = ? ORDER BY reminder_time'),
      getAttachments: this.db.query('SELECT file_path FROM attachments WHERE task_id = ? ORDER BY created_at'),
      deleteTaskLabels: this.db.query('DELETE FROM task_labels WHERE task_id = ?'),
      deleteSubtasks: this.db.query('DELETE FROM subtasks WHERE task_id = ?'),
      insertTaskLabel: this.db.query('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)'),
      insertTaskHistory: this.db.query(`
        INSERT INTO task_history (id, task_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)
      `),
      insertSubtask: this.db.query(`
        INSERT INTO subtasks (id, task_id, title, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      insertReminder: this.db.query(`
        INSERT INTO reminders (id, task_id, reminder_time) VALUES (?, ?, ?)
      `),
      insertAttachment: this.db.query(`
        INSERT INTO attachments (id, task_id, file_path, file_name) VALUES (?, ?, ?, ?)
      `),
      updateTaskPos: this.db.query('UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?'),
    }
  }

  private createDefaultInbox() {
    const existingInbox = this.db.query('SELECT id FROM lists WHERE is_default = TRUE').get() as { id: string } | undefined
    if (!existingInbox) {
      const inboxId = randomUUID()
      this.db.run(`
        INSERT INTO lists (id, name, color, icon, is_default)
        VALUES (?, ?, ?, ?, ?)
      `, inboxId, 'Inbox', '#3b82f6', '📥', 1)
    }
  }

  getLists(): List[] {
    const rows = this.db.query('SELECT * FROM lists ORDER BY created_at').all() as ListRow[]
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

    this.db.run(`
      INSERT INTO lists (id, name, color, icon, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, id, list.name, list.color, list.icon, list.isDefault ? 1 : 0, now, now)

    return {
      id,
      ...list,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }
  }

  getListById(id: string): List | undefined {
    const row = this.db.query('SELECT * FROM lists WHERE id = ?').get(id) as ListRow | undefined
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

    this.db.run(`UPDATE lists SET ${fields.join(', ')} WHERE id = ?`, ...values)

    return this.getListById(id)!
  }

  deleteList(id: string): void {
    const existing = this.getListById(id)
    if (!existing) throw new Error('List not found')
    if (existing.isDefault) throw new Error('Cannot delete default list')

    this.db.run('DELETE FROM tasks WHERE list_id = ?', id)
    this.db.run('DELETE FROM lists WHERE id = ?', id)
  }

  getLabels(): Label[] {
    const rows = this.db.query('SELECT * FROM labels ORDER BY created_at').all() as LabelRow[]
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
    const row = this.db.query('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow | undefined
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

    this.db.run(`
      INSERT INTO labels (id, name, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, id, label.name, label.color, label.icon, now, now)

    return {
      id,
      ...label,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }
  }

  updateLabel(id: string, updates: Partial<Omit<Label, 'id' | 'createdAt' | 'updatedAt'>>): Label {
    const existing = this.db.query('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow | undefined
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

    this.db.run(`UPDATE labels SET ${fields.join(', ')} WHERE id = ?`, ...values)

    const updated = this.db.query('SELECT * FROM labels WHERE id = ?').get(id) as LabelRow
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
    this.db.run('DELETE FROM labels WHERE id = ?', id)
  }

  getTasks(): Task[] {
    const rows = this.db.query('SELECT * FROM tasks ORDER BY position ASC, created_at DESC').all() as TaskRow[]
    const ids = rows.map(r => r.id)
    if (ids.length === 0) return []

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
      reminders: allReminders ? (allReminders.get(row.id) ?? this.getRemindersForTask(row.id)) : this.getRemindersForTask(row.id),
      estimate: row.estimate ?? undefined,
      actualTime: row.actual_time ?? undefined,
      labels: allLabels ? (allLabels.get(row.id) ?? this.getLabelsForTask(row.id)) : this.getLabelsForTask(row.id),
      priority: row.priority as Priority,
      subtasks: allSubtasks ? (allSubtasks.get(row.id) ?? this.getSubtasksForTask(row.id)) : this.getSubtasksForTask(row.id),
      recurring: row.recurring as RecurringType || undefined,
      recurringConfig: row.recurring_config ? JSON.parse(row.recurring_config) : undefined,
      listId: row.list_id,
      completed: row.completed === 1,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      position: row.position,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      history: allHistory ? (allHistory.get(row.id) ?? this.getTaskHistory(row.id)) : this.getTaskHistory(row.id),
      attachments: allAttachments ? (allAttachments.get(row.id) ?? this.getAttachmentsForTask(row.id)) : this.getAttachmentsForTask(row.id)
    }
  }

  private batchGetLabelsForTasks(taskIds: string[]): Map<string, Label[]> {
    const map = new Map<string, Label[]>()
    for (const id of taskIds) map.set(id, [])

    if (taskIds.length === 0) return map
    const rows = this.db.query(`
      SELECT tl.task_id, l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id IN (${taskIds.map(() => '?').join(',')})
    `).all(...taskIds) as (LabelRow & { task_id: string })[]

    for (const row of rows) {
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
    const map = new Map<string, Subtask[]>()
    for (const id of taskIds) map.set(id, [])

    if (taskIds.length === 0) return map
    const rows = this.db.query(
      `SELECT * FROM subtasks WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY position ASC, created_at ASC`
    ).all(...taskIds) as SubtaskRow[]

    for (const row of rows) {
      map.get(row.task_id)!.push({
        id: row.id,
        title: row.title,
        completed: row.completed === 1,
        position: row.position,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      })
    }
    return map
  }

  private batchGetHistoryForTasks(taskIds: string[]): Map<string, TaskHistory[]> {
    const map = new Map<string, TaskHistory[]>()
    for (const id of taskIds) map.set(id, [])

    if (taskIds.length === 0) return map
    const rows = this.db.query(
      `SELECT * FROM task_history WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY changed_at DESC`
    ).all(...taskIds) as TaskHistoryRow[]

    for (const row of rows) {
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
    const map = new Map<string, Date[]>()
    for (const id of taskIds) map.set(id, [])

    if (taskIds.length === 0) return map
    const rows = this.db.query(
      `SELECT task_id, reminder_time FROM reminders WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY reminder_time`
    ).all(...taskIds) as { task_id: string; reminder_time: string }[]

    for (const row of rows) {
      map.get(row.task_id)!.push(new Date(row.reminder_time))
    }
    return map
  }

  private batchGetAttachmentsForTasks(taskIds: string[]): Map<string, string[]> {
    const map = new Map<string, string[]>()
    for (const id of taskIds) map.set(id, [])

    if (taskIds.length === 0) return map
    const rows = this.db.query(
      `SELECT task_id, file_path FROM attachments WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY created_at`
    ).all(...taskIds) as { task_id: string; file_path: string }[]

    for (const row of rows) {
      map.get(row.task_id)!.push(row.file_path)
    }
    return map
  }

  createTask(task: TaskInput): Task {
    const insert = this.db.transaction(() => {
      const id = randomUUID()
      const now = new Date().toISOString()

      let listId = task.listId
      if (!listId) {
        const defaultList = this.db.query('SELECT id FROM lists WHERE is_default = TRUE').get() as { id: string } | undefined
        listId = defaultList?.id || ''
        if (!listId) {
          throw new Error('No default list found and no listId provided')
        }
      }

      const maxPos = this.db.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks'
      ).get() as { next_pos: number }
      const position = task.position ?? maxPos.next_pos

      this.db.run(`
        INSERT INTO tasks (
          id, name, description, date, deadline, estimate, actual_time,
          priority, recurring, recurring_config, list_id, completed,
          completed_at, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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
        now,
      )

      if (task.labels) {
        for (const label of task.labels) {
          this.stmts.insertTaskLabel.run(id, label.id)
        }
      }

      if (task.subtasks) {
        for (let i = 0; i < task.subtasks.length; i++) {
          this.createSubtask(id, task.subtasks[i], i)
        }
      }

      if (task.reminders) {
        for (const reminder of task.reminders) {
          this.addReminder(id, reminder)
        }
      }

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
      for (const [field, newValue] of Object.entries(updates)) {
        if (!TRACKED_TASK_FIELDS.has(field as keyof Task)) continue

        const oldValue = existingTask[field as keyof Task]
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          this.recordTaskHistory(id, field, oldValue, newValue)
        }
      }

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

        this.db.run(`
          UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?
        `, ...updateValues)
      }

      if (updates.labels !== undefined) {
        this.stmts.deleteTaskLabels.run(id)
        for (const label of updates.labels) {
          this.stmts.insertTaskLabel.run(id, label.id)
        }
      }

      if (updates.subtasks !== undefined) {
        this.stmts.deleteSubtasks.run(id)
        for (let i = 0; i < updates.subtasks.length; i++) {
          this.createSubtask(id, updates.subtasks[i], i)
        }
      }
    })

    update()
    return this.getTaskById(id)!
  }

  deleteTask(id: string): void {
    this.stmts.deleteTask.run(id)
  }

  deleteTasks(ids: string[]): void {
    const deleteMany = this.db.transaction((taskIds: string[]) => {
      for (const id of taskIds) {
        this.stmts.deleteTaskLabels.run(id)
        this.stmts.deleteTask.run(id)
      }
    })
    deleteMany(ids)
  }

  getTaskById(id: string): Task | undefined {
    const row = this.stmts.getTaskById.get(id) as TaskRow | undefined
    if (!row) return undefined
    return this.mapRowToTask(row)
  }

  private getSubtasksForTask(taskId: string): Subtask[] {
    const rows = this.db.query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, created_at ASC').all(taskId) as SubtaskRow[]
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      completed: row.completed === 1,
      position: row.position,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  private createSubtask(taskId: string, subtask: SubtaskInput, index?: number): void {
    const id = randomUUID()
    const now = new Date().toISOString()
    const position = subtask.position ?? index ?? 0
    this.stmts.insertSubtask.run(id, taskId, subtask.title, subtask.completed ? 1 : 0, position, now, now)
  }

  private getTaskHistory(taskId: string): TaskHistory[] {
    const rows = this.stmts.getTaskHistory.all(taskId) as TaskHistoryRow[]
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
    this.stmts.insertTaskHistory.run(
      id, taskId, field,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    )
  }

  private getLabelsForTask(taskId: string): Label[] {
    const rows = this.stmts.getLabelsForTask.all(taskId) as LabelRow[]
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
    const rows = this.stmts.getReminders.all(taskId) as { reminder_time: string }[]
    return rows.map(row => new Date(row.reminder_time))
  }

  private addReminder(taskId: string, reminderTime: Date): void {
    const id = randomUUID()
    this.stmts.insertReminder.run(id, taskId, reminderTime.toISOString())
  }

  private getAttachmentsForTask(taskId: string): string[] {
    const rows = this.stmts.getAttachments.all(taskId) as { file_path: string }[]
    return rows.map(row => row.file_path)
  }

  private addAttachment(taskId: string, filePath: string): void {
    const id = randomUUID()
    const fileName = filePath.split('/').pop() || ''
    this.stmts.insertAttachment.run(id, taskId, filePath, fileName)
  }

  updateTaskPositions(positions: { id: string; position: number }[]): void {
    const update = this.db.transaction(() => {
      const now = new Date().toISOString()
      for (const { id, position } of positions) {
        this.stmts.updateTaskPos.run(position, now, id)
      }
    })
    update()
  }

  close(): void {
    this.db.close()
  }
}
