// Client-side API utilities
import { Task, List, Label } from '@/types'

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api'

export const api = {
  // Tasks
  async getTasks() {
    const response = await fetch(`${API_BASE}/tasks`)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>) {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  async deleteTask(id: string) {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete task')
    return response.json()
  },

  // Lists
  async getLists() {
    const response = await fetch(`${API_BASE}/lists`)
    if (!response.ok) throw new Error('Failed to fetch lists')
    return response.json()
  },

  async createList(listData: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listData),
    })
    if (!response.ok) throw new Error('Failed to create list')
    return response.json()
  },

  // Labels
  async getLabels() {
    const response = await fetch(`${API_BASE}/labels`)
    if (!response.ok) throw new Error('Failed to fetch labels')
    return response.json()
  },

  async createLabel(labelData: Omit<Label, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await fetch(`${API_BASE}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labelData),
    })
    if (!response.ok) throw new Error('Failed to create label')
    return response.json()
  },
}