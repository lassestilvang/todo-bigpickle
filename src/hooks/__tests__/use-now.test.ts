import { describe, expect, it } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { useNow } from '@/hooks/use-now'

describe('useNow', () => {
  it('should return a Date object', () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toBeInstanceOf(Date)
  })

  it('should return a current-ish time', () => {
    const { result } = renderHook(() => useNow())
    const now = Date.now()
    const diff = Math.abs(now - result.current.getTime())
    expect(diff).toBeLessThan(5000)
  })
})
