import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

const db = new DatabaseService()

export async function GET() {
  try {
    const tasks = db.getTasks()
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()
    console.log('Received task data:', taskData)
    const task = db.createTask(taskData)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}