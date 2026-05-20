import { render, screen, fireEvent } from '@testing-library/react'
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
    { id: '1', name: 'Work', color: '#3b82f6', icon: '💼', createdAt: new Date(), updatedAt: new Date() }
  ],
  priority: 'high',
  subtasks: [
    { id: '1', title: 'Subtask 1', completed: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', title: 'Subtask 2', completed: false, createdAt: new Date(), updatedAt: new Date() }
  ],
  listId: '1',
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  history: []
}

describe('TaskCard', () => {
  it('renders task information correctly', () => {
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('This is a test task')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('💼 Work')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox is clicked', () => {
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('calls onEdit when card is clicked', () => {
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    const card = screen.getByRole('button', { name: /click to edit/i })
    fireEvent.click(card)

    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={mockTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteBtn)

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('displays completed state correctly', () => {
    const completedTask = { ...mockTask, completed: true }
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={completedTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText('Test Task')).toHaveClass('line-through')
  })

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      deadline: new Date(Date.now() - 86400000) // Yesterday
    }
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(
      <TaskCard
        task={overdueTask}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument()
  })
})
