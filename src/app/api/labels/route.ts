import { NextRequest, NextResponse } from 'next/server'
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
    const body = await request.json()
    const validated = createLabelSchema.parse(body)
    const label = db.createLabel(validated)
    return NextResponse.json(label)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}