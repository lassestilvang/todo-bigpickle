'use client'

import { createContext, use, useEffect, useState, useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'

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

  useEffect(() => {
    updateDOM(theme, attribute, disableTransitionOnChange)
  }, [theme, attribute, disableTransitionOnChange])

  const systemPrefersDark = useSyncExternalStore(
    (onStoreChange) => {
      if (!enableSystem) return () => {}
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    () => enableSystem ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
    () => false,
  )

  const resolvedTheme: 'light' | 'dark' = theme === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

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
