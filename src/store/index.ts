import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Task, List, Label, ViewType, AppState, RecurringType } from '@/types'
import { api } from '@/lib/api'
import { toast, dismissToast } from '@/hooks/use-toast'

export { useShallow }

function getNextRecurringDate(recurring: RecurringType, config?: Task['recurringConfig']): Date | undefined {
  const now = new Date()
  switch (recurring) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    case 'weekdays': {
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1)
      return next
    }
    case 'weekly':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
    case 'monthly': {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      if (next.getMonth() !== (now.getMonth() + 1) % 12) next.setDate(0)
      return next
    }
    case 'yearly': {
      const next = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      if (next.getMonth() !== now.getMonth()) next.setDate(0)
      return next
    }
    case 'custom': {
      if (config?.interval) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + config.interval)
      }
      return undefined
    }
    default:
      return undefined
  }
}

const handleError = (message: string, error: unknown, set: (state: Partial<AppStore>) => void) => {
  const errorMessage = error instanceof Error ? error.message : message
  console.error(`${message}: ${errorMessage}`)
  set({ error: errorMessage })
  setTimeout(() => {
    const current = useAppStore.getState().error
    if (current === errorMessage) {
      useAppStore.setState({ error: null })
    }
  }, 8000)
}

interface AppStore extends AppState {
  // UI state
  isLoading: boolean
  error: string | null
  reorderVersion: number
  
  // Actions
  setCurrentView: (view: ViewType) => void
  setSelectedListId: (listId: string | undefined) => void
  setShowCompleted: (show: boolean) => void
  setSearchQuery: (query: string) => void
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'position'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskComplete: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  clearCompleted: () => void
  reorderTasks: (reorder: { id: string; position: number }[]) => void
  duplicateTask: (task: Task) => void
  bulkCompleteTasks: (ids: string[], completed: boolean) => void
  bulkDeleteTasks: (ids: string[]) => void
  bulkMoveTasks: (ids: string[], listId: string) => void
  
  // List actions
  addList: (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateList: (id: string, updates: Partial<List>) => void
  deleteList: (id: string) => void
  
  // Label actions
  addLabel: (label: Omit<Label, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateLabel: (id: string, updates: Partial<Label>) => void
  deleteLabel: (id: string) => void
  
  // Data loading
  loadData: () => void
  clearError: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      return {
      // Initial state
      tasks: [],
      lists: [],
      labels: [],
      reorderVersion: 0,
      currentView: 'today',
      selectedListId: undefined,
      showCompleted: false,
      searchQuery: '',
      isLoading: true,
      error: null,

      // View actions
      setCurrentView: (view) => set({ currentView: view, error: null }),
      setSelectedListId: (listId) => set({ selectedListId: listId, error: null }),
      setShowCompleted: (show) => set({ showCompleted: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Task actions
      addTask: async (taskData) => {
        const tempId = `temp_${Date.now()}`
        const now = new Date()
        const optimisticTask: Task = {
          id: tempId,
          name: taskData.name,
          description: taskData.description,
          date: taskData.date,
          deadline: taskData.deadline,
          estimate: taskData.estimate,
          actualTime: taskData.actualTime,
          labels: taskData.labels || [],
          priority: taskData.priority || 'none',
          subtasks: taskData.subtasks || [],
          recurring: taskData.recurring,
          recurringConfig: taskData.recurringConfig,
          listId: taskData.listId,
          completed: taskData.completed || false,
          completedAt: taskData.completedAt,
          position: 0,
          createdAt: now,
          updatedAt: now,
          history: [],
        }
        set((state) => ({ tasks: [optimisticTask, ...state.tasks], error: null }))
        try {
          const task = await api.createTask(taskData)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === tempId ? task : t),
          }))
          toast({ type: 'success', title: 'Task created', description: taskData.name })
        } catch (error) {
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
          handleError('Failed to create task', error, set)
          toast({ type: 'error', title: 'Failed to create task' })
        }
      },

      updateTask: async (id, updates) => {
        const prev = get().tasks.find(t => t.id === id)
        if (!prev) return
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t),
          error: null,
        }))
        try {
          await api.updateTask(id, updates)
        } catch (error) {
          set((state) => ({ tasks: state.tasks.map(t => t.id === id ? prev : t) }))
          handleError('Failed to update task', error, set)
          toast({ type: 'error', title: 'Failed to update task' })
        }
      },

      deleteTask: async (id) => {
        const prev = get().tasks.find(t => t.id === id)
        if (!prev) return
        set((state) => ({ tasks: state.tasks.filter(t => t.id !== id), error: null }))

        const undoId = toast({
          type: 'success',
          title: 'Task deleted',
          description: prev.name,
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: async () => {
              const stillGone = !get().tasks.some(t => t.id === id)
              if (stillGone) {
                set((state) => ({ tasks: [...state.tasks, prev].sort((a, b) => a.position - b.position) }))
                try {
                  await api.createTask(prev)
                } catch {
                  set((state) => ({ tasks: state.tasks.filter(t => t.id !== prev.id) }))
                  toast({ type: 'error', title: 'Failed to restore task' })
                }
              }
            },
          },
        })

        try {
          await api.deleteTask(id)
        } catch (error) {
          dismissToast(undoId)
          set((state) => ({ tasks: [...state.tasks, prev].sort((a, b) => a.position - b.position) }))
          handleError('Failed to delete task', error, set)
        }
      },

      toggleTaskComplete: async (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (!task) return

        const newCompleted = !task.completed
        const now = new Date()

        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id
              ? { ...t, completed: newCompleted, completedAt: newCompleted ? now : undefined }
              : t
          ),
        }))

        if (newCompleted) {
          toast({
            type: 'success',
            title: 'Task completed!',
            duration: 6000,
            action: {
              label: 'Undo',
              onClick: () => get().toggleTaskComplete(id),
            },
          })

          if (task.recurring) {
            const nextDate = getNextRecurringDate(task.recurring, task.recurringConfig)
            if (nextDate) {
              const recurringTask: Task = {
                ...task,
                id: `temp_${Date.now()}`,
                completed: false,
                completedAt: undefined,
                date: nextDate,
                createdAt: now,
                updatedAt: now,
                position: 0,
                history: [],
              }
              set((state) => ({ tasks: [recurringTask, ...state.tasks] }))
              try {
                const created = await api.createTask({
                  name: task.name,
                  description: task.description,
                  date: nextDate,
                  deadline: task.deadline,
                  estimate: task.estimate,
                  actualTime: task.actualTime,
                  labels: task.labels.map(l => ({ id: l.id, name: l.name, color: l.color, icon: l.icon, createdAt: l.createdAt, updatedAt: l.updatedAt })),
                  priority: task.priority,
                  subtasks: task.subtasks.map(st => ({ title: st.title, completed: false, position: st.position, createdAt: new Date(), updatedAt: new Date() })),
                  recurring: task.recurring,
                  recurringConfig: task.recurringConfig,
                  listId: task.listId,
                  completed: false,
                })
                set((state) => ({
                  tasks: state.tasks.map(t => t.id === recurringTask.id ? created : t),
                }))
              } catch {
                set((state) => ({ tasks: state.tasks.filter(t => t.id !== recurringTask.id) }))
              }
            }
          }
        }

        try {
          await api.updateTask(id, {
            completed: newCompleted,
            completedAt: newCompleted ? now : undefined
          })
        } catch (error) {
          set((state) => ({
            tasks: state.tasks.map(t =>
              t.id === id
                ? { ...t, completed: task.completed, completedAt: task.completedAt }
                : t
            ),
          }))
          handleError('Failed to toggle task completion', error, set)
          toast({ type: 'error', title: 'Failed to update task' })
        }
      },

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks.find(t => t.id === taskId)
        if (!task) return

        const updatedSubtasks = task.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed, updatedAt: new Date() } : st
        )

        get().updateTask(taskId, { subtasks: updatedSubtasks })
      },

      reorderTasks: async (reorder) => {
        const prevTasks = get().tasks.map(t => ({ ...t }))
        set((state) => {
          const updated = [...state.tasks]
          const taskMap = new Map(updated.map(t => [t.id, t]))
          for (const item of reorder) {
            const task = taskMap.get(item.id)
            if (task) task.position = item.position
          }
          updated.sort((a, b) => a.position - b.position)
          return { tasks: updated, error: null }
        })
        try {
          await api.reorderTasks(reorder)
        } catch (error) {
          set({ tasks: prevTasks, reorderVersion: get().reorderVersion + 1 })
          handleError('Failed to reorder tasks', error, set)
          toast({ type: 'error', title: 'Failed to save order' })
        }
      },

      clearCompleted: () => {
        const completedTasks = get().tasks.filter(t => t.completed)
        if (completedTasks.length === 0) return

        const count = completedTasks.length
        set((state) => ({
          tasks: state.tasks.filter(t => !t.completed),
          error: null,
        }))

        toast({
          type: 'info',
          title: `Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}`,
          duration: 6000,
          action: {
            label: 'Undo',
            onClick: () => {
              set((state) => ({
                tasks: [...state.tasks, ...completedTasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
              }))
              toast({ type: 'info', title: `Restored ${count} completed ${count === 1 ? 'task' : 'tasks'}` })
            },
          },
        })

        api.deleteCompletedTasks(completedTasks.map(t => t.id)).catch((error) => {
          set((state) => ({
            tasks: [...state.tasks, ...completedTasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
          }))
          handleError('Failed to clear completed tasks', error, set)
          toast({ type: 'error', title: 'Failed to clear completed tasks on server' })
        })
      },

      duplicateTask: async (task: Task) => {
        const taskData = {
          name: `${task.name} (copy)`,
          description: task.description,
          date: task.date,
          deadline: task.deadline,
          estimate: task.estimate,
          actualTime: task.actualTime,
          labels: task.labels.map(l => ({ id: l.id, name: l.name, color: l.color, icon: l.icon })),
          priority: task.priority,
          subtasks: task.subtasks.map(s => ({ title: s.title, completed: false })),
          recurring: task.recurring,
          recurringConfig: task.recurringConfig,
          listId: task.listId,
          completed: false,
        }
        const tempId = `temp_${Date.now()}`
        const now = new Date()
        const optimisticTask: Task = {
          id: tempId,
          ...taskData,
          position: 0,
          createdAt: now,
          updatedAt: now,
          history: [],
        }
        set((state) => ({ tasks: [optimisticTask, ...state.tasks], error: null }))
        try {
          const created = await api.createTask(taskData)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === tempId ? created : t),
          }))
          toast({ type: 'success', title: 'Task duplicated', description: task.name })
        } catch (error) {
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
          handleError('Failed to duplicate task', error, set)
          toast({ type: 'error', title: 'Failed to duplicate task' })
        }
      },

      bulkCompleteTasks: async (ids, completed) => {
        const now = new Date()
        set((state) => ({
          tasks: state.tasks.map(t =>
            ids.includes(t.id)
              ? { ...t, completed, completedAt: completed ? now : undefined, updatedAt: now }
              : t
          ),
          error: null,
        }))
        const count = ids.length
        toast({
          type: 'success',
          title: completed ? `Completed ${count} ${count === 1 ? 'task' : 'tasks'}` : `Uncompleted ${count} ${count === 1 ? 'task' : 'tasks'}`,
          duration: 4000,
        })
        await Promise.allSettled(ids.map(id => api.updateTask(id, { completed, completedAt: completed ? now : undefined })))
      },

      bulkDeleteTasks: async (ids) => {
        const prevTasks = get().tasks.filter(t => ids.includes(t.id))
        set((state) => ({
          tasks: state.tasks.filter(t => !ids.includes(t.id)),
          error: null,
        }))
        const count = ids.length
        toast({
          type: 'success',
          title: `Deleted ${count} ${count === 1 ? 'task' : 'tasks'}`,
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              set((state) => ({
                tasks: [...state.tasks, ...prevTasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
              }))
              toast({ type: 'info', title: `Restored ${count} ${count === 1 ? 'task' : 'tasks'}` })
              Promise.allSettled(prevTasks.map(t => api.createTask(t)))
            },
          },
        })
        await api.deleteCompletedTasks(ids).catch(() => {})
      },

      bulkMoveTasks: async (ids, listId) => {
        const list = get().lists.find(l => l.id === listId)
        set((state) => ({
          tasks: state.tasks.map(t =>
            ids.includes(t.id) ? { ...t, listId, updatedAt: new Date() } : t
          ),
          error: null,
        }))
        const count = ids.length
        toast({
          type: 'info',
          title: `Moved ${count} ${count === 1 ? 'task' : 'tasks'} to ${list?.name || 'list'}`,
          duration: 4000,
        })
        await Promise.allSettled(ids.map(id => api.updateTask(id, { listId })))
      },

      // List actions
      addList: async (listData) => {
        try {
          const list = await api.createList(listData)
          set((state) => ({
            lists: [...state.lists, list],
            error: null
          }))
        } catch (error) {
          handleError('Failed to create list', error, set)
          throw error
        }
      },

      updateList: async (id, updates) => {
        try {
          const list = await api.updateList(id, updates)
          set((state) => ({
            lists: state.lists.map(l => l.id === id ? list : l),
            error: null
          }))
        } catch (error) {
          handleError('Failed to update list', error, set)
          throw error
        }
      },

      deleteList: async (id) => {
        try {
          const list = get().lists.find(l => l.id === id)
          if (list?.isDefault) {
            set({ error: 'Cannot delete the default list' })
            return
          }
          
          await api.deleteList(id)
          set((state) => ({
            lists: state.lists.filter(l => l.id !== id),
            error: null
          }))
        } catch (error) {
          handleError('Failed to delete list', error, set)
          throw error
        }
      },

      // Label actions
      addLabel: async (labelData) => {
        try {
          const label = await api.createLabel(labelData)
          set((state) => ({
            labels: [...state.labels, label],
            error: null
          }))
        } catch (error) {
          handleError('Failed to create label', error, set)
          throw error
        }
      },

      updateLabel: async (id, updates) => {
        try {
          const label = await api.updateLabel(id, updates)
          set((state) => ({
            labels: state.labels.map(l => l.id === id ? label : l),
            error: null
          }))
        } catch (error) {
          handleError('Failed to update label', error, set)
          throw error
        }
      },

      deleteLabel: async (id) => {
        try {
          await api.deleteLabel(id)
          set((state) => ({
            labels: state.labels.filter(l => l.id !== id),
            tasks: state.tasks.map(task => ({
              ...task,
              labels: task.labels.filter(l => l.id !== id)
            })),
            error: null
          }))
        } catch (error) {
          handleError('Failed to delete label', error, set)
          throw error
        }
      },

      // Data loading
      loadData: async () => {
        const currentState = get()
        if (currentState.isLoading) return
        set({ isLoading: true, error: null })
        try {
          const [tasks, lists, labels] = await Promise.all([
            api.getTasks(),
            api.getLists(),
            api.getLabels()
          ])
          
          set({ tasks, lists, labels, isLoading: false })
        } catch (error) {
          handleError('Failed to load data', error, set)
          set({ isLoading: false })
        }
      },

      clearError: () => set({ error: null }),
    }
    },
    {
      name: 'todo-app-storage',
      storage: typeof window !== 'undefined' ? {
        getItem: (name) => {
          try {
            const item = localStorage.getItem(name)
            return item ? JSON.parse(item) : null
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch {
            // localStorage might be full or unavailable
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {
            // localStorage might be unavailable
          }
        }
      } : undefined,
      partialize: (state: AppStore) => ({
        currentView: state.currentView,
        selectedListId: state.selectedListId,
        showCompleted: state.showCompleted,
        searchQuery: state.searchQuery,
      })
    }
  )
)