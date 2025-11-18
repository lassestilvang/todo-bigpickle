import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

const db = new DatabaseService()

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const updates = await request.json()
    const task = db.updateTask(id, updates)
    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    db.deleteTask(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}