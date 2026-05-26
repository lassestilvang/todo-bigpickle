import { describe, expect, it } from 'bun:test'
import { parseJSONBody } from '@/lib/api-utils'

function createMockRequest(body: unknown): Request {
  return {
    json: () =>
      body instanceof Error
        ? Promise.reject(body)
        : Promise.resolve(body),
  } as unknown as Request
}

describe('parseJSONBody', () => {
  it('should parse valid JSON body', async () => {
    const req = createMockRequest({ name: 'test' })
    const result = await parseJSONBody(req)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'test' })
    }
  })

  it('should handle empty object body', async () => {
    const req = createMockRequest({})
    const result = await parseJSONBody(req)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('should handle array body', async () => {
    const req = createMockRequest([1, 2, 3])
    const result = await parseJSONBody(req)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3])
    }
  })

  it('should return error response for invalid JSON', async () => {
    const req = createMockRequest(new SyntaxError('Failed to parse'))
    const result = await parseJSONBody(req)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toBe('Invalid JSON in request body')
    }
  })

  it('should handle null body', async () => {
    const req = createMockRequest(null)
    const result = await parseJSONBody(req)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })
})
