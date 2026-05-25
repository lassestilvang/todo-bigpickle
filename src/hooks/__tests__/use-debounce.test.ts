// @bun-test-environment jsdom

import { describe, expect, it } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } },
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 100 })
    expect(result.current).toBe('initial')

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current).toBe('updated')
  })

  it('should cancel previous timer on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 100 } },
    )

    rerender({ value: 'b', delay: 100 })
    rerender({ value: 'c', delay: 100 })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current).toBe('c')
  })
})
