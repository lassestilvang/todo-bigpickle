import { describe, expect, it, mock, beforeEach } from 'bun:test'
import { toast, dismissToast, subscribeToasts, resetToasts } from '@/hooks/use-toast'

describe('use-toast', () => {
  beforeEach(() => {
    resetToasts()
  })
  it('should add a toast and notify subscribers', () => {
    const listener = mock()
    subscribeToasts(listener)

    toast({ type: 'success', title: 'Done!' })

    const lastCalls = listener.mock.calls
    const lastToasts = lastCalls[lastCalls.length - 1][0]
    expect(lastToasts).toHaveLength(1)
    expect(lastToasts[0].title).toBe('Done!')
    expect(lastToasts[0].type).toBe('success')
    expect(lastToasts[0].id).toBeDefined()
  })

  it('should return a toast id', () => {
    const id = toast({ type: 'info', title: 'Info' })
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('should dismiss a toast', () => {
    const listener = mock()
    subscribeToasts(listener)

    const id = toast({ type: 'warning', title: 'Warning' })

    dismissToast(id)

    const lastCalls = listener.mock.calls
    const lastToasts = lastCalls[lastCalls.length - 1][0]
    expect(lastToasts).toHaveLength(0)
  })

  it('should cap toasts at MAX_TOASTS', () => {
    const listener = mock()
    subscribeToasts(listener)

    toast({ type: 'info', title: 'T1' })
    toast({ type: 'info', title: 'T2' })
    toast({ type: 'info', title: 'T3' })
    toast({ type: 'info', title: 'T4' })
    toast({ type: 'info', title: 'T5' })
    toast({ type: 'info', title: 'T6' })

    const lastCalls = listener.mock.calls
    const lastToasts = lastCalls[lastCalls.length - 1][0]
    expect(lastToasts).toHaveLength(5)
    expect(lastToasts[0].title).toBe('T2')
  })

  it('should include description and action when provided', () => {
    const listener = mock()
    subscribeToasts(listener)
    const action = { label: 'Undo', onClick: () => {} }

    toast({ type: 'error', title: 'Failed', description: 'Something broke', action })

    const lastCalls = listener.mock.calls
    const lastToasts = lastCalls[lastCalls.length - 1][0]
    expect(lastToasts[0].description).toBe('Something broke')
    expect(lastToasts[0].action).toBe(action)
  })

  it('should unsubscribe properly', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)

    // subscribeToasts calls listener immediately - that's call 1
    toast({ type: 'success', title: 'First' })
    // toast call - that's call 2

    unsub()

    toast({ type: 'success', title: 'Second' })
    // no more calls expected

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
