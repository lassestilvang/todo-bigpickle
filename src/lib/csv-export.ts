import { Task } from '@/types'
import { format } from 'date-fns'

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTasksAsCSV(tasks: Task[]): void {
  const headers = [
    'Name',
    'Description',
    'Priority',
    'Date',
    'Deadline',
    'Estimate (min)',
    'List',
    'Labels',
    'Completed',
    'Completed At',
    'Subtasks',
    'Recurring',
    'Created At',
  ]

  const rows = tasks.map((task) => [
    escapeCSV(task.name),
    escapeCSV(task.description || ''),
    escapeCSV(task.priority),
    escapeCSV(task.date ? format(task.date, 'yyyy-MM-dd') : ''),
    escapeCSV(task.deadline ? format(task.deadline, 'yyyy-MM-dd') : ''),
    escapeCSV(task.estimate ?? ''),
    escapeCSV(task.listId),
    escapeCSV(task.labels.map((l) => l.name).join('; ')),
    escapeCSV(task.completed ? 'Yes' : 'No'),
    escapeCSV(task.completedAt ? format(task.completedAt, 'yyyy-MM-dd HH:mm') : ''),
    escapeCSV(task.subtasks.filter((s) => s.completed).length + '/' + task.subtasks.length),
    escapeCSV(task.recurring || ''),
    escapeCSV(format(task.createdAt, 'yyyy-MM-dd HH:mm')),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `todo-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
