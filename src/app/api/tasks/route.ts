import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createTaskSchema } from '@/lib/validators'

const db = getDatabase()

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
    const body = await request.json()
    const validated = createTaskSchema.parse(body)
    const task = db.createTask(validated)
    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}