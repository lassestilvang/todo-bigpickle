import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test'
import { toast, dismissToast, subscribeToasts } from '@/hooks/use-toast'

describe('use-toast', () => {
  beforeEach(() => {
    // Subscribe and immediately unsubscribe to reset internal state
    const unsub = subscribeToasts(() => {})
    unsub()
  })

  it('should add a toast and notify subscribers', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)

    toast({ type: 'success', title: 'Done!' })

    expect(listener).toHaveBeenCalled()
    const toasts = listener.mock.calls[0][0]
    expect(toasts).toHaveLength(1)
    expect(toasts[0].title).toBe('Done!')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeDefined()

    unsub()
  })

  it('should return a toast id', () => {
    const id = toast({ type: 'info', title: 'Info' })
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('should dismiss a toast', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)

    const id = toast({ type: 'warning', title: 'Warning' })
    expect(listener.mock.calls[0][0]).toHaveLength(1)

    dismissToast(id)

    const toasts = listener.mock.calls[1][0]
    expect(toasts).toHaveLength(0)

    unsub()
  })

  it('should cap toasts at MAX_TOASTS', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)

    toast({ type: 'info', title: 'T1' })
    toast({ type: 'info', title: 'T2' })
    toast({ type: 'info', title: 'T3' })
    toast({ type: 'info', title: 'T4' })
    toast({ type: 'info', title: 'T5' })
    toast({ type: 'info', title: 'T6' })

    const toasts = listener.mock.calls[listener.mock.calls.length - 1][0]
    expect(toasts).toHaveLength(5)
    expect(toasts[0].title).toBe('T2')

    unsub()
  })

  it('should include description and action when provided', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)
    const action = { label: 'Undo', onClick: () => {} }

    toast({ type: 'error', title: 'Failed', description: 'Something broke', action })

    const toasts = listener.mock.calls[0][0]
    expect(toasts[0].description).toBe('Something broke')
    expect(toasts[0].action).toBe(action)

    unsub()
  })

  it('should unsubscribe properly', () => {
    const listener = mock()
    const unsub = subscribeToasts(listener)

    toast({ type: 'success', title: 'First' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsub()

    toast({ type: 'success', title: 'Second' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
