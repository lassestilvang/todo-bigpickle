import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

const db = new DatabaseService()

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
    const listData = await request.json()
    const list = db.createList(listData)
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}