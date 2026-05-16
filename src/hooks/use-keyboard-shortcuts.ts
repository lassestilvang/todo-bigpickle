'use client'

import { useEffect, useRef } from 'react'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  handler: (e: KeyboardEvent) => void
  disabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target?.matches?.('input, textarea, select, [contenteditable]')
      const hasModifier = e.ctrlKey || e.metaKey

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.disabled) continue

        if (isInput && !hasModifier) continue

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && metaMatch) {
          e.preventDefault()
          shortcut.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
