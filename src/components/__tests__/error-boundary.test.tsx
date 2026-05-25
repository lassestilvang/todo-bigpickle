import { describe, expect, it } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/error-boundary'

function ThrowError({ message }) {
  throw new Error(message)
}

function SafeChild() {
  return <div>Safe content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('renders error UI when a child throws', () => {
    const onError = () => {}
    const originalError = console.error
    console.error = onError

    render(
      <ErrorBoundary>
        <ThrowError message="Something broke" />
        <SafeChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Something broke')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

    console.error = originalError
  })

  it('renders custom fallback when provided', () => {
    const onError = () => {}
    const originalError = console.error
    console.error = onError

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError message="Boom" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()

    console.error = originalError
  })

  it('retries and re-renders children after error', () => {
    const onError = () => {}
    const originalError = console.error
    console.error = onError

    let shouldThrow = true
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Temporary')
      return <div>Recovered content</div>
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Recovered content')).toBeInTheDocument()

    console.error = originalError
  })
})
