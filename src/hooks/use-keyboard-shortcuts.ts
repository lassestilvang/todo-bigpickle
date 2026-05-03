'use client'

import { useEffect } from 'react'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  handler: (e: KeyboardEvent) => void
  disabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : true
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !shortcut.shiftKey || e.shiftKey
        const metaMatch = shortcut.metaKey ? e.metaKey : !shortcut.metaKey || e.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && metaMatch) {
          e.preventDefault()
          shortcut.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
