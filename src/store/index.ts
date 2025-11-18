import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, List, Label, ViewType, AppState } from '@/types'
import { api } from '@/lib/api'

interface AppStore extends AppState {
  // Actions
  setCurrentView: (view: ViewType) => void
  setSelectedListId: (listId: string | undefined) => void
  setShowCompleted: (show: boolean) => void
  setSearchQuery: (query: string) => void
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskComplete: (id: string) => void
  
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
    (set, get) => ({
      // Initial state
      tasks: [],
      lists: [],
      labels: [],
      currentView: 'today',
      selectedListId: undefined,
      showCompleted: false,
      searchQuery: '',

      // View actions
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedListId: (listId) => set({ selectedListId: listId }),
      setShowCompleted: (show) => set({ showCompleted: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Task actions
      addTask: async (taskData) => {
        try {
          const task = await api.createTask(taskData)
          set((state) => ({
            tasks: [task, ...state.tasks]
          }))
        } catch (error) {
          console.error('Failed to create task:', error)
        }
      },

      updateTask: async (id, updates) => {
        try {
          const task = await api.updateTask(id, updates)
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t)
          }))
        } catch (error) {
          console.error('Failed to update task:', error)
        }
      },

      deleteTask: async (id) => {
        try {
          await api.deleteTask(id)
          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
          }))
        } catch (error) {
          console.error('Failed to delete task:', error)
        }
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find(t => t.id === id)
        if (task) {
          get().updateTask(id, { 
            completed: !task.completed,
            completedAt: !task.completed ? new Date() : undefined
          })
        }
      },

      // List actions
      addList: async (listData) => {
        try {
          const list = await api.createList(listData)
          set((state) => ({
            lists: [...state.lists, list]
          }))
        } catch (error) {
          console.error('Failed to create list:', error)
        }
      },

      updateList: (id, updates) => {
        // For now, we'll just update the local state
        // In a real app, you'd want to update the database too
        set((state) => ({
          lists: state.lists.map(l => l.id === id ? { ...l, ...updates } : l)
        }))
      },

      deleteList: (id) => {
        // Don't allow deleting the default inbox
        const list = get().lists.find(l => l.id === id)
        if (list?.isDefault) return
        
        set((state) => ({
          lists: state.lists.filter(l => l.id !== id)
        }))
      },

      // Label actions
      addLabel: async (labelData) => {
        try {
          const label = await api.createLabel(labelData)
          set((state) => ({
            labels: [...state.labels, label]
          }))
        } catch (error) {
          console.error('Failed to create label:', error)
        }
      },

      updateLabel: (id, updates) => {
        set((state) => ({
          labels: state.labels.map(l => l.id === id ? { ...l, ...updates } : l)
        }))
      },

      deleteLabel: (id) => {
        set((state) => ({
          labels: state.labels.filter(l => l.id !== id),
          // Remove label from all tasks
          tasks: state.tasks.map(task => ({
            ...task,
            labels: task.labels.filter(l => l.id !== id)
          }))
        }))
      },

      // Data loading
      loadData: async () => {
        try {
          const [tasks, lists, labels] = await Promise.all([
            api.getTasks(),
            api.getLists(),
            api.getLabels()
          ])
          
          set({ tasks, lists, labels })
        } catch (error) {
          console.error('Failed to load data:', error)
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

        // Apply search
        if (state.searchQuery) {
          // Simple search implementation for now
          const query = state.searchQuery.toLowerCase()
          tasks = tasks.filter(task => 
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
          )
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
    }),
    {
      name: 'todo-app-storage',
      storage: typeof window !== 'undefined' ? {
        getItem: (name) => {
          const item = localStorage.getItem(name)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      } : undefined,
      partialize: (state) => ({
        currentView: state.currentView,
        selectedListId: state.selectedListId,
        showCompleted: state.showCompleted,
        searchQuery: state.searchQuery,
        tasks: state.tasks,
        lists: state.lists,
        labels: state.labels,
        setCurrentView: undefined,
        setSelectedListId: undefined,
        setShowCompleted: undefined,
        setSearchQuery: undefined,
        addTask: undefined,
        updateTask: undefined,
        deleteTask: undefined,
        toggleTaskComplete: undefined,
        addList: undefined,
        updateList: undefined,
        deleteList: undefined,
        addLabel: undefined,
        updateLabel: undefined,
        deleteLabel: undefined,
        loadData: undefined,
        getFilteredTasks: undefined,
        getOverdueTaskCount: undefined,
        getTasksByView: undefined
      })
    }
  )
)

// Initialize data on app start
if (typeof window !== 'undefined') {
  useAppStore.getState().loadData()
}