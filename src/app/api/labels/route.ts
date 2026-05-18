import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createLabelSchema } from '@/lib/validators'
import { parseJSONBody } from '@/lib/api-utils'

const db = getDatabase()

export async function GET() {
  try {
    const labels = db.getLabels()
    return NextResponse.json(labels)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseJSONBody(request)
    if (!result.success) return result.response
    const validated = createLabelSchema.parse(result.data)
    const label = db.createLabel(validated)
    return NextResponse.json(label)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}