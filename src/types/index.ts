export type Priority = 'high' | 'medium' | 'low' | 'none'
export type RecurringType = 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom'

export interface Label {
  id: string
  name: string
  color: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

export interface List {
  id: string
  name: string
  color: string
  icon: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskHistory {
  id: string
  taskId: string
  field: string
  oldValue: unknown
  newValue: unknown
  changedAt: Date
}

export interface Task {
  id: string
  name: string
  description?: string
  date?: Date
  deadline?: Date
  reminders?: Date[]
  estimate?: number // in minutes
  actualTime?: number // in minutes
  labels: Label[]
  priority: Priority
  subtasks: Subtask[]
  recurring?: RecurringType
  recurringConfig?: {
    interval?: number
    daysOfWeek?: number[]
    dayOfMonth?: number
    monthOfYear?: number
  }
  listId: string
  completed: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  history: TaskHistory[]
  attachments?: string[]
}

export type ViewType = 'today' | 'next7days' | 'upcoming' | 'all'

export interface AppState {
  tasks: Task[]
  lists: List[]
  labels: Label[]
  currentView: ViewType
  selectedListId?: string
  showCompleted: boolean
  searchQuery: string
}