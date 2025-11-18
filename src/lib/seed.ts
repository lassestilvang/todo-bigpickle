import { DatabaseService } from '@/lib/database'

// Initialize some sample data for development
export function seedDatabase() {
  const db = new DatabaseService()

  // Create sample labels
  const workLabel = db.createLabel({
    name: 'Work',
    color: '#3b82f6',
    icon: '💼'
  })

  const personalLabel = db.createLabel({
    name: 'Personal',
    color: '#10b981',
    icon: '🏠'
  })

  const urgentLabel = db.createLabel({
    name: 'Urgent',
    color: '#ef4444',
    icon: '🔥'
  })

  // Create sample lists
  const workList = db.createList({
    name: 'Work Projects',
    color: '#3b82f6',
    icon: '💼',
    isDefault: false
  })

  const personalList = db.createList({
    name: 'Personal',
    color: '#10b981',
    icon: '🏠',
    isDefault: false
  })

  // Create sample tasks
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Today's tasks
  db.createTask({
    name: 'Complete project proposal',
    description: 'Finish the Q4 project proposal and send to team for review',
    date: today,
    deadline: today,
    estimate: 120,
    priority: 'high',
    labels: [workLabel, urgentLabel],
    subtasks: [
      {
        id: crypto.randomUUID(),
        title: 'Research competitors',
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        title: 'Write executive summary',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        title: 'Create budget estimate',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    listId: workList.id,
    completed: false
  })

  db.createTask({
    name: 'Team standup meeting',
    description: 'Daily sync with the development team',
    date: today,
    estimate: 30,
    priority: 'medium',
    labels: [workLabel],
    subtasks: [],
    listId: workList.id,
    completed: false
  })

  db.createTask({
    name: 'Grocery shopping',
    description: 'Buy groceries for the week',
    date: today,
    deadline: today,
    estimate: 45,
    priority: 'medium',
    labels: [personalLabel],
    subtasks: [
      {
        id: crypto.randomUUID(),
        title: 'Vegetables and fruits',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        title: 'Protein and dairy',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    listId: personalList.id,
    completed: false
  })

  // Tomorrow's tasks
  db.createTask({
    name: 'Client presentation',
    description: 'Present the new design concepts to the client',
    date: tomorrow,
    deadline: tomorrow,
    estimate: 90,
    priority: 'high',
    labels: [workLabel, urgentLabel],
    subtasks: [
      {
        id: crypto.randomUUID(),
        title: 'Prepare slides',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        title: 'Practice presentation',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    listId: workList.id,
    completed: false
  })

  // Next week tasks
  db.createTask({
    name: 'Plan vacation',
    description: 'Research and book flights for summer vacation',
    date: nextWeek,
    estimate: 60,
    priority: 'low',
    labels: [personalLabel],
    subtasks: [],
    listId: personalList.id,
    completed: false
  })

  // Overdue task
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  db.createTask({
    name: 'Submit expense report',
    description: 'Submit last month\'s expense report',
    date: yesterday,
    deadline: yesterday,
    estimate: 30,
    priority: 'medium',
    labels: [workLabel],
    subtasks: [],
    listId: workList.id,
    completed: false
  })

  console.log('Database seeded with sample data')
}