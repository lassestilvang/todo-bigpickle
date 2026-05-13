// Client-side API utilities
import { Task, List, Label } from '@/types'

const API_BASE = '/api'
const DEFAULT_TIMEOUT = 30000 // 30 seconds

interface FetchOptions extends RequestInit {
  signal?: AbortSignal
  timeout?: number
}

function createTimeoutSignal(timeout: number): [AbortController, ReturnType<typeof setTimeout>] {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return [controller, id]
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options
  
  const [timeoutController, timeoutId] = createTimeoutSignal(timeout)
  const signal = fetchOptions.signal

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId)
      throw new DOMException('The operation was aborted', 'AbortError')
    }
    signal.addEventListener('abort', () => timeoutController.abort(), { once: true })
  }
  
  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: timeoutController.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body.error || body.message || 'Request failed'

    if (response.status === 400) {
      throw new Error(message)
    }
    if (response.status === 404) {
      throw new Error(message)
    }
    if (response.status >= 500) {
      throw new Error(message)
    }
    throw new Error(message)
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