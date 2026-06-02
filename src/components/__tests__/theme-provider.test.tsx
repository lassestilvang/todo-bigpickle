import { describe, expect, it, beforeEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/theme-provider'

function TestConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('should provide default theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('should read theme from localStorage', () => {
    localStorage.setItem('todo-app-theme', 'dark')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('should fall back to default when localStorage is empty', () => {
    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('should throw useTheme outside provider', () => {
    const originalError = console.error
    console.error = () => {}

    expect(() => render(<TestConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    )

    console.error = originalError
  })
})
