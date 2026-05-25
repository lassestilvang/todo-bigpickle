// @bun-test-environment jsdom

import { describe, expect, it } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

function createMatchMedia(matches) {
  return function matchMedia(query) {
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
  }
}

describe('useIsMobile', () => {
  it('should return false for desktop viewport', () => {
    window.matchMedia = createMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true for mobile viewport', () => {
    window.matchMedia = createMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should update when media query changes', () => {
    let listener = null

    window.matchMedia = function matchMedia(query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: function(type, fn) {
          listener = fn
        },
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
    }

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      listener({ matches: true })
    })

    expect(result.current).toBe(true)
  })
})
