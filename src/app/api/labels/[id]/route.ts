import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createLabelSchema } from '@/lib/validators'

const db = getDatabase()

const updateLabelSchema = createLabelSchema.partial()

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const validated = updateLabelSchema.parse(body)

    const label = db.updateLabel(id, validated)
    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    return NextResponse.json(label)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    db.deleteLabel(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}
