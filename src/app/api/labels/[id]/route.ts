import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { updateLabelSchema } from '@/lib/validators'
import { parseJSONBody } from '@/lib/api-utils'

const db = getDatabase()

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const result = await parseJSONBody(request)
    if (!result.success) return result.response
    const validated = updateLabelSchema.parse(result.data)

    const existing = db.getLabelById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const label = db.updateLabel(id, validated)
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

    const existing = db.getLabelById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    db.deleteLabel(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 })
  }
}
