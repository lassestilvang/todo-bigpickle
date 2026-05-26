// @bun-test-environment jsdom

import { describe, expect, it, mock } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function fireKey(key: string, mods: Partial<KeyboardEvent> = {}) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      ...mods,
    })
  )
}

describe('useKeyboardShortcuts', () => {
  it('should call handler when matching key is pressed', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'Escape', handler }])
    )

    fireKey('Escape')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler for non-matching key', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'Enter', handler }])
    )

    fireKey('Escape')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should match key case-insensitively', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'a', handler }])
    )

    fireKey('A')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should require metaKey when specified', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', metaKey: true, handler }])
    )

    fireKey('k')
    expect(handler).not.toHaveBeenCalled()

    fireKey('k', { metaKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should require ctrlKey when specified', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'n', ctrlKey: true, handler }])
    )

    fireKey('n')
    expect(handler).not.toHaveBeenCalled()

    fireKey('n', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should require shiftKey when specified', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'N', shiftKey: true, handler }])
    )

    fireKey('n')
    expect(handler).not.toHaveBeenCalled()

    fireKey('N', { shiftKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not trigger when disabled', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'Escape', handler, disabled: true }])
    )

    fireKey('Escape')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should not trigger handler when focused on an input without modifier', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'a', handler }])
    )

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    fireKey('a')
    expect(handler).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should allow input-focused shortcuts with modifier', () => {
    const handler = mock()
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', metaKey: true, handler }])
    )

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    fireKey('k', { metaKey: true })
    expect(handler).toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should support multiple shortcuts', () => {
    const handler1 = mock()
    const handler2 = mock()
    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'a', handler: handler1 },
        { key: 'b', handler: handler2 },
      ])
    )

    fireKey('a')
    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).not.toHaveBeenCalled()

    fireKey('b')
    expect(handler2).toHaveBeenCalledTimes(1)
  })
})
