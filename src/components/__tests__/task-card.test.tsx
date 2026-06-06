import { describe, expect, it, beforeEach, mock } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskCard } from '@/components/task-card'
import { Task } from '@/types'

const mockTask: Task = {
  id: '1',
  name: 'Test Task',
  description: 'This is a test task',
  date: new Date('2024-01-15'),
  deadline: new Date('2024-01-16'),
  estimate: 120,
  actualTime: 90,
  labels: [
    { id: '1', name: 'Work', color: '#3b82f6', icon: '💼', createdAt: new Date(), updatedAt: new Date() },
  ],
  priority: 'high',
  subtasks: [
    { id: '1', title: 'Subtask 1', completed: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', title: 'Subtask 2', completed: false, createdAt: new Date(), updatedAt: new Date() },
  ],
  listId: '1',
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  history: [],
}

describe('TaskCard', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders task information correctly', () => {
    const onToggleComplete = () => {}
    const onEdit = () => {}
    const onDelete = () => {}

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('This is a test task')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('💼 Work')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox is clicked', () => {
    let called = false
    const onToggleComplete = (id: string) => { called = true; expect(id).toBe('1') }

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /mark.*complete/i }))
    expect(called).toBe(true)
  })

  it('calls onEdit when card is clicked', () => {
    let called = false
    const onEdit = (task: Task) => { called = true; expect(task).toBe(mockTask) }

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={() => {}}
        onEdit={onEdit}
        onDelete={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /click to edit/i }))
    expect(called).toBe(true)
  })

  it('calls onDelete when delete button is clicked', () => {
    let called = false
    const onDelete = (id: string) => { called = true; expect(id).toBe('1') }

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /delete.*test task/i }))
    expect(called).toBe(true)
  })

  it('displays completed state correctly', () => {
    const completedTask = { ...mockTask, completed: true }

    render(
      <TaskCard
        task={completedTask}
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /mark.*incomplete/i })).toBeChecked()
    expect(screen.getByText('Test Task')).toHaveClass('line-through')
  })

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      deadline: new Date(Date.now() - 86400000),
    }

    render(
      <TaskCard
        task={overdueTask}
        onToggleComplete={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )

    expect(screen.getAllByTestId('alert-triangle')[0]).toBeInTheDocument()
  })
})
