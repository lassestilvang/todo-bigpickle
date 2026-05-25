'use client'

import { createContext, use, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function updateDOM(theme: Theme, attribute: string, disableTransition: boolean) {
  const root = document.documentElement
  if (disableTransition) {
    root.style.transition = 'none'
    void root.offsetHeight
  }

  const resolved = theme === 'system' ? getSystemTheme() : theme
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)

  if (disableTransition) {
    requestAnimationFrame(() => {
      root.style.transition = ''
    })
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'todo-app-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        return (localStorage.getItem(storageKey) as Theme) || defaultTheme
      } catch {
        return defaultTheme
      }
    }
    return defaultTheme
  })

  // Sync DOM with theme on mount and on change
  useEffect(() => {
    updateDOM(theme, attribute, disableTransitionOnChange)
  }, [theme, attribute, disableTransitionOnChange])

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system' || !enableSystem) return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      updateDOM('system', attribute, disableTransitionOnChange)
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch {
      // localStorage unavailable
    }
    setThemeState(newTheme)
  }, [storageKey])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = use(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
