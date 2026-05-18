import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabase } from '@/lib/database-singleton'
import { createListSchema } from '@/lib/validators'
import { parseJSONBody } from '@/lib/api-utils'

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
    const result = await parseJSONBody(request)
    if (!result.success) return result.response
    const validated = createListSchema.parse(result.data)
    const list = db.createList(validated)
    return NextResponse.json(list)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}