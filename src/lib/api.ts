// Client-side API utilities
import { Task, List, Label } from '@/types'

const API_BASE = '/api'
const DEFAULT_TIMEOUT = 30000 // 30 seconds

interface FetchOptions extends RequestInit {
  signal?: AbortSignal
  timeout?: number
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  const onAbort = () => controller.abort()
  
  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', onAbort)
  }
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
    if (fetchOptions.signal) {
      fetchOptions.signal.removeEventListener('abort', onAbort)
    }
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json().catch(() => ({ message: 'Invalid request' }))
      throw new Error(error.message || 'Invalid request')
    }
    if (response.status === 404) {
      throw new Error('Resource not found')
    }
    if (response.status >= 500) {
      throw new Error('Server error, please try again later')
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `Failed to fetch`)
  }
  return response.json()
}

export const api = {
  // Tasks
  async getTasks(signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/tasks`, { signal })
    return handleResponse<Task[]>(response)
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
      signal,
    })
    return handleResponse<Task>(response)
  },

  async updateTask(id: string, updates: Partial<Task>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal,
    })
    return handleResponse<Task>(response)
  },

  async deleteTask(id: string, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      signal,
    })
    return handleResponse<void>(response)
  },

  // Lists
  async getLists(signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/lists`, { signal })
    return handleResponse<List[]>(response)
  },

  async createList(listData: Omit<List, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
      signal,
    })
    return handleResponse<List>(response)
  },

  async updateList(id: string, updates: Partial<Omit<List, 'id' | 'createdAt' | 'updatedAt'>>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal,
    })
    return handleResponse<List>(response)
  },

  async deleteList(id: string, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/lists/${id}`, {
      method: 'DELETE',
      signal,
    })
    return handleResponse<void>(response)
  },

  // Labels
  async getLabels(signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/labels`, { signal })
    return handleResponse<Label[]>(response)
  },

  async createLabel(labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labelData),
      signal,
    })
    return handleResponse<Label>(response)
  },

  async updateLabel(id: string, updates: Partial<Omit<Label, 'id' | 'createdAt' | 'updatedAt'>>, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/labels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal,
    })
    return handleResponse<Label>(response)
  },

  async deleteLabel(id: string, signal?: AbortSignal) {
    const response = await fetchWithTimeout(`${API_BASE}/labels/${id}`, {
      method: 'DELETE',
      signal,
    })
    return handleResponse<void>(response)
  },
}