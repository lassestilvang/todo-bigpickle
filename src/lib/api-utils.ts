import { NextRequest, NextResponse } from 'next/server'

export async function parseJSONBody(request: NextRequest): Promise<
  { success: true; data: unknown } | { success: false; response: NextResponse }
> {
  try {
    const data = await request.json()
    return { success: true, data }
  } catch (error) {
    console.error('Failed to parse request body:', error)
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
  }
}
