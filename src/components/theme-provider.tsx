'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'todo-app-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
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
    const root = window.document.documentElement

    if (disableTransitionOnChange) {
      root.style.transition = 'none'
      // Force reflow
      void root.offsetHeight
      root.style.transition = ''
    }

    const applyTheme = (preferDark: boolean) => {
      root.classList.remove('light', 'dark')
      root.classList.add(preferDark ? 'dark' : 'light')
    }

    if (attribute === 'class') {
      if (theme === 'system' && enableSystem) {
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        applyTheme(mql.matches)
        return
      }

      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system' || !enableSystem) return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      if (disableTransitionOnChange) {
        root.style.transition = 'none'
        void root.offsetHeight
        root.style.transition = ''
      }
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, enableSystem, disableTransitionOnChange])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme)
      } catch {
        // localStorage unavailable
      }
      setTheme(theme)
    },
  }

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