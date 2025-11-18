import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

const db = new DatabaseService()

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
    const labelData = await request.json()
    const label = db.createLabel(labelData)
    return NextResponse.json(label)
  } catch {
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}