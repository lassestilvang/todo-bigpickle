import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-singleton'
import { createListSchema } from '@/lib/validators'
import { z } from 'zod'

const db = getDatabase()

const updateListSchema = createListSchema.partial()

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    const validated = updateListSchema.parse(body)
    
    // Check if list exists
    const existing = db.getListById(id)
    if (!existing) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    const list = db.updateList(id, validated)
    return NextResponse.json(list)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Check if list exists
    const existing = db.getListById(id)
    if (!existing) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }
    
    // Don't allow deleting default list
    if (existing.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default list' }, { status: 400 })
    }
    
    db.deleteList(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}
