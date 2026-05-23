'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

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

function applyTheme(root: HTMLElement, theme: Theme, attribute: string) {
  if (attribute === 'class') {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light'
    if (document.documentElement.classList.contains('dark')) return 'dark'
    return 'light'
  })

  // Sync resolved theme with DOM on mount
  useEffect(() => {
    const root = document.documentElement
    if (disableTransitionOnChange) {
      root.style.transition = 'none'
      void root.offsetHeight
    }

    const resolved = theme === 'system' && enableSystem ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    if (attribute === 'class') {
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        root.style.transition = ''
      })
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system' || !enableSystem) return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      const root = document.documentElement
      if (disableTransitionOnChange) {
        root.style.transition = 'none'
        void root.offsetHeight
      }
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
      if (disableTransitionOnChange) {
        requestAnimationFrame(() => {
          root.style.transition = ''
        })
      }
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, enableSystem, disableTransitionOnChange])

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch {
      // localStorage unavailable
    }
    setThemeState(newTheme)
  }, [storageKey])

  const value = { theme, setTheme }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
