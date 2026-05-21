import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import Fuse from 'fuse.js'
import { Task, List, Label, ViewType, AppState } from '@/types'
import { api } from '@/lib/api'
import { toast, dismissToast } from '@/hooks/use-toast'

export { shallow }

const handleError = (message: string, error: unknown, set: (state: Partial<AppStore>) => void) => {
  const errorMessage = error instanceof Error ? error.message : message
  console.error(`${message}: ${errorMessage}`)
  set({ error: errorMessage })
}

interface AppStore extends AppState {
  // UI state
  isLoading: boolean
  error: string | null
  
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
  reorderTasks: (reorder: { id: string; position: number }[]) => void
  
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
  
  // Computed values
  getFilteredTasks: () => Task[]
  getOverdueTaskCount: () => number
  getTasksByView: (view: ViewType) => Task[]
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      let fuseVersion = 0
      let cachedFuseKey = ''
      let cachedFuse: Fuse<Task> | null = null

      const invalidateFuseCache = () => {
        fuseVersion++
        cachedFuseKey = ''
        cachedFuse = null
      }

      return {
      // Initial state
      tasks: [],
      lists: [],
      labels: [],
      currentView: 'today',
      selectedListId: undefined,
      showCompleted: false,
      searchQuery: '',
      isLoading: true,
      error: null,

      // View actions
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedListId: (listId) => set({ selectedListId: listId }),
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
        invalidateFuseCache()
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
        invalidateFuseCache()
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
        invalidateFuseCache()
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
                invalidateFuseCache()
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
          toast({ type: 'success', title: 'Task completed!' })
        }

        try {
          invalidateFuseCache()
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

      reorderTasks: async (reorder) => {
        const prevTasks = [...get().tasks]
        invalidateFuseCache()
        set((state) => {
          const updated = [...state.tasks]
          for (const item of reorder) {
            const task = updated.find(t => t.id === item.id)
            if (task) task.position = item.position
          }
          updated.sort((a, b) => a.position - b.position)
          return { tasks: updated, error: null }
        })
        try {
          await api.reorderTasks(reorder)
        } catch (error) {
          set({ tasks: prevTasks })
          handleError('Failed to reorder tasks', error, set)
          toast({ type: 'error', title: 'Failed to save order' })
        }
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
        set({ isLoading: true, error: null })
        invalidateFuseCache()
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

      // Computed values
      getFilteredTasks: () => {
        const state = get()
        let tasks = state.tasks

        // Filter by view
        if (state.selectedListId) {
          tasks = tasks.filter(task => task.listId === state.selectedListId)
        } else {
          tasks = state.getTasksByView(state.currentView)
        }

        // Filter completed tasks
        if (!state.showCompleted) {
          tasks = tasks.filter(task => !task.completed)
        }

        // Apply search (with cached Fuse index)
        if (state.searchQuery) {
          const fuseKey = `${fuseVersion}:${tasks.map(t => t.id).join(',')}`
          if (!cachedFuse || cachedFuseKey !== fuseKey) {
            cachedFuse = new Fuse(tasks, {
              keys: ['name', 'description'],
              threshold: 0.3,
              includeScore: false
            })
            cachedFuseKey = fuseKey
          }
          const results = cachedFuse.search(state.searchQuery)
          tasks = results.map(result => result.item)
        }

        return tasks
      },

      getOverdueTaskCount: () => {
        const now = new Date()
        return get().tasks.filter(task => 
          !task.completed && 
          task.deadline && 
          task.deadline < now
        ).length
      },

      getTasksByView: (view) => {
        const tasks = get().tasks
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        switch (view) {
          case 'today':
            return tasks.filter(task => {
              if (!task.date) return false
              const taskDate = new Date(task.date)
              const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
              return taskDateOnly.getTime() === today.getTime()
            })

          case 'next7days':
            return tasks.filter(task => {
              if (!task.date) return false
              const taskDate = new Date(task.date)
              const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
              return taskDateOnly >= today && taskDateOnly <= nextWeek
            })

          case 'upcoming':
            return tasks.filter(task => {
              if (!task.date) return false
              const taskDate = new Date(task.date)
              const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
              return taskDateOnly >= today
            })

          case 'all':
          default:
            return tasks
        }
      }
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
        tasks: state.tasks,
        lists: state.lists,
        labels: state.labels
      }) satisfies AppState
    }
  )
)