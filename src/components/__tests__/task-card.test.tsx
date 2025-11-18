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

    render(
      <TaskCard 
        task={mockTask} 
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
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

    render(
      <TaskCard 
        task={mockTask} 
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('calls onEdit when card is clicked', () => {
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()

    render(
      <TaskCard 
        task={mockTask} 
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
      />
    )

    const card = screen.getByRole('button') // The card is clickable
    fireEvent.click(card)

    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('displays completed state correctly', () => {
    const completedTask = { ...mockTask, completed: true }
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()

    render(
      <TaskCard 
        task={completedTask} 
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
      />
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText('Test Task')).toHaveClass('line-through')
  })

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      deadline: new Date('2024-01-01') // Past date
    }
    const onToggleComplete = jest.fn()
    const onEdit = jest.fn()

    render(
      <TaskCard 
        task={overdueTask} 
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
      />
    )

    // Check for overdue indicator (alert triangle icon)
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument()
  })
})