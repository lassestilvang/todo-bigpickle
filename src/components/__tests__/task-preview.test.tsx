import { describe, expect, it, beforeEach } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TaskPreview } from '@/components/task-preview'
import { useAppStore } from '@/store'
import { Task } from '@/types'

const mockTask: Task = {
  id: '1',
  name: 'Test Task',
  description: 'A description',
  date: new Date('2024-06-15'),
  deadline: new Date('2024-06-16'),
  estimate: 90,
  labels: [
    { id: 'l1', name: 'Work', color: '#3b82f6', icon: '💼', createdAt: new Date(), updatedAt: new Date() },
  ],
  priority: 'high',
  subtasks: [
    { id: 's1', title: 'Sub 1', completed: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 's2', title: 'Sub 2', completed: false, createdAt: new Date(), updatedAt: new Date() },
  ],
  reminders: [new Date('2024-06-15T09:00:00')],
  attachments: ['doc.pdf'],
  recurring: 'weekly' as const,
  listId: 'list-1',
  completed: false,
  completedAt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  history: [
    { id: 'h1', field: 'priority', oldValue: 'low', newValue: 'high', changedAt: new Date() },
  ],
}

describe('TaskPreview', () => {
  const defaultProps = {
    task: null,
    isOpen: true,
    onClose: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onToggleComplete: () => {},
    onToggleSubtask: () => {},
  }

  beforeEach(() => {
    cleanup()
    useAppStore.setState({
      lists: [
        { id: 'list-1', name: 'Work List', icon: '📋', color: '#3b82f6', createdAt: new Date(), updatedAt: new Date(), isDefault: false },
      ],
    })
  })

  it('returns null when task is null', () => {
    const { container } = render(<TaskPreview {...defaultProps} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders task name and description', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('renders priority badge', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders date badge', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getAllByText(/Jun 15/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders subtasks with progress', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText('Sub 1')).toBeInTheDocument()
    expect(screen.getByText('Sub 2')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox clicked', () => {
    let called = false
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onToggleComplete={(id) => { called = true; expect(id).toBe('1') }}
      />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /mark.*complete/i }))
    expect(called).toBe(true)
  })

  it('calls onToggleSubtask when subtask clicked', () => {
    let called = false
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onToggleSubtask={(taskId, subtaskId) => { called = true; expect(taskId).toBe('1'); expect(subtaskId).toBe('s2') }}
      />
    )
    fireEvent.click(screen.getByText('Sub 2'))
    expect(called).toBe(true)
  })

  it('calls onDelete when delete button clicked', () => {
    let called = false
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onDelete={(id) => { called = true; expect(id).toBe('1') }}
      />
    )
    fireEvent.click(screen.getByText('Delete'))
    expect(called).toBe(true)
  })

  it('calls onEdit when edit button clicked', () => {
    let called = false
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onEdit={(task) => { called = true; expect(task.id).toBe('1') }}
      />
    )
    fireEvent.click(screen.getByText('Edit'))
    expect(called).toBe(true)
  })

  it('renders reminders section', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText(/reminders/i)).toBeInTheDocument()
  })

  it('renders attachments', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  it('renders recurring info', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText(/weekly/i)).toBeInTheDocument()
  })

  it('renders list info', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText(/Work List/i)).toBeInTheDocument()
  })

  it('renders activity history', () => {
    render(<TaskPreview {...defaultProps} task={mockTask} />)
    expect(screen.getByText(/priority/i)).toBeInTheDocument()
  })

  it('shows completed state with line-through', () => {
    const completedTask = { ...mockTask, completed: true }
    render(<TaskPreview {...defaultProps} task={completedTask} />)
    expect(screen.getByText('Test Task')).toHaveClass('line-through')
  })

  it('shows navigation buttons when onNavigate provided', () => {
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onNavigate={() => {}}
      />
    )
    expect(screen.getByLabelText('Previous task')).toBeInTheDocument()
    expect(screen.getByLabelText('Next task')).toBeInTheDocument()
  })

  it('calls onNavigate with prev on ArrowLeft', () => {
    let direction = ''
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onNavigate={(d) => { direction = d }}
      />
    )
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(direction).toBe('prev')
  })

  it('calls onNavigate with next on ArrowRight', () => {
    let direction = ''
    render(
      <TaskPreview
        {...defaultProps}
        task={mockTask}
        onNavigate={(d) => { direction = d }}
      />
    )
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(direction).toBe('next')
  })
})
