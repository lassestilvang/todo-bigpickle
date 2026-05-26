// @bun-test-environment jsdom

import { describe, expect, it, beforeEach } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastContainer } from '@/components/toaster'
import { toast, subscribeToasts } from '@/hooks/use-toast'

describe('ToastContainer', () => {
  beforeEach(() => {
    // Reset internal toast state
    const unsub = subscribeToasts(() => {})
    unsub()
  })

  it('should render nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.innerHTML).toBe('')
  })

  it('should render toasts that are added', () => {
    render(<ToastContainer />)
    toast({ type: 'success', title: 'Task saved!' })
    expect(screen.getByText('Task saved!')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(<ToastContainer />)
    toast({ type: 'info', title: 'Info', description: 'Here are the details' })
    expect(screen.getByText('Here are the details')).toBeInTheDocument()
  })

  it('should dismiss toast when dismiss button is clicked', () => {
    render(<ToastContainer />)
    toast({ type: 'success', title: 'Temporary' })

    expect(screen.getByText('Temporary')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(screen.queryByText('Temporary')).not.toBeInTheDocument()
  })

  it('should render action button when provided', () => {
    render(<ToastContainer />)
    toast({ type: 'success', title: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })
})
