// Client-side API utilities
import { Task, List, Label } from '@/types'

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api'

const getAbortSignal = (timeoutMs = 10000) => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `Failed to fetch`)
  }
  return response.json()
}

export const api = {
  // Tasks
  async getTasks(signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/tasks`, { signal })
    return handleResponse<Task[]>(response)
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>, signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
      signal,
    })
    return handleResponse<Task>(response)
  },

  async updateTask(id: string, updates: Partial<Task>, signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal,
    })
    return handleResponse<Task>(response)
  },

  async deleteTask(id: string, signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      signal,
    })
    return handleResponse<void>(response)
  },

  // Lists
  async getLists(signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/lists`, { signal })
    return handleResponse<List[]>(response)
  },

  async createList(listData: Omit<List, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
      signal,
    })
    return handleResponse<List>(response)
  },

  // Labels
  async getLabels(signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/labels`, { signal })
    return handleResponse<Label[]>(response)
  },

  async createLabel(labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    const response = await fetch(`${API_BASE}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labelData),
      signal,
    })
    return handleResponse<Label>(response)
  },
}