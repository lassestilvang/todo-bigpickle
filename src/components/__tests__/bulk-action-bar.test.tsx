/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeEach } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BulkActionBar } from '@/components/bulk-action-bar'
import { useAppStore } from '@/store'

describe('BulkActionBar', () => {
  let completedIds: string[] | null = null
  let deletedIds: string[] | null = null

  beforeEach(() => {
    cleanup()
    completedIds = null
    deletedIds = null
    useAppStore.setState({
      lists: [
        { id: 'list-1', name: 'Work', icon: '📋', color: '#3b82f6', createdAt: new Date(), updatedAt: new Date(), isDefault: false },
        { id: 'list-2', name: 'Personal', icon: '🏠', color: '#10b981', createdAt: new Date(), updatedAt: new Date(), isDefault: true },
      ],
      tasks: [
        { id: 'task-1', completed: false },
        { id: 'task-2', completed: true },
      ] as any,
      bulkCompleteTasks: async (ids: string[], completed: boolean) => { completedIds = ids; deletedIds = completed ? ['set'] : ['unset'] },
      bulkDeleteTasks: async (ids: string[]) => { deletedIds = ids },
      bulkMoveTasks: async () => {},
      duplicateTask: async () => {},
    })
  })

  it('returns null when selectedIds is empty', () => {
    const { container } = render(
      <BulkActionBar selectedIds={[]} onClearSelection={() => {}} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders count text', () => {
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => {}} />
    )
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('shows Complete when no completed tasks selected', () => {
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => {}} />
    )
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('shows Incomplete when completed tasks selected', () => {
    render(
      <BulkActionBar selectedIds={['task-2']} onClearSelection={() => {}} />
    )
    expect(screen.getByText('Incomplete')).toBeInTheDocument()
  })

  it('calls bulkCompleteTasks and onClearSelection on Complete click', () => {
    let cleared = false
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => { cleared = true }} />
    )
    fireEvent.click(screen.getByText('Complete'))
    expect(completedIds).toEqual(['task-1'])
    expect(cleared).toBe(true)
  })

  it('calls bulkDeleteTasks and onClearSelection on Delete click', () => {
    let cleared = false
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => { cleared = true }} />
    )
    fireEvent.click(screen.getByText('Delete'))
    expect(deletedIds).toEqual(['task-1'])
    expect(cleared).toBe(true)
  })

  it('renders Duplicate button', () => {
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => {}} />
    )
    expect(screen.getByText('Duplicate')).toBeInTheDocument()
  })

  it('renders Move to... select', () => {
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => {}} />
    )
    expect(screen.getByText('Move to...')).toBeInTheDocument()
  })

  it('calls onClearSelection when close button clicked', () => {
    let cleared = false
    render(
      <BulkActionBar selectedIds={['task-1']} onClearSelection={() => { cleared = true }} />
    )
    fireEvent.click(screen.getByLabelText('Clear selection'))
    expect(cleared).toBe(true)
  })
})
