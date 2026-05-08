import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createLabelSchema } from '@/lib/validators'

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
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    const validated = createLabelSchema.parse(body)
    const label = db.createLabel(validated)
    return NextResponse.json(label)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}