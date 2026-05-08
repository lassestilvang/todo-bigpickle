import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createListSchema } from '@/lib/validators'

const db = getDatabase()

export async function GET() {
  try {
    const lists = db.getLists()
    return NextResponse.json(lists)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
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
    const validated = createListSchema.parse(body)
    const list = db.createList(validated)
    return NextResponse.json(list)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}