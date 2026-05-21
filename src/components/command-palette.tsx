'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useAppStore } from '@/store'
import { useTheme } from '@/components/theme-provider'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ViewType } from '@/types'
import {
  CalendarDays,
  CalendarRange,
  List,
  LayoutList,
  Plus,
  CheckSquare,
  Sun,
  Moon,
  Monitor,
  Search,
  type LucideIcon,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onCreateTask: () => void
}

export const CommandPalette = memo(function CommandPalette({ open, onClose, onCreateTask }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setSelectedListId = useAppStore(s => s.setSelectedListId)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const showCompleted = useAppStore(s => s.showCompleted)
  const lists = useAppStore(s => s.lists)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const getCommands = useCallback((): Command[] => {
    const cmds: Command[] = [
      { id: 'go-today', label: 'Go to Today', icon: CalendarDays, action: () => { setCurrentView('today'); setSelectedListId(undefined) } },
      { id: 'go-next7', label: 'Go to Next 7 Days', icon: CalendarRange, action: () => { setCurrentView('next7days'); setSelectedListId(undefined) } },
      { id: 'go-upcoming', label: 'Go to Upcoming', icon: List, action: () => { setCurrentView('upcoming'); setSelectedListId(undefined) } },
      { id: 'go-all', label: 'Go to All Tasks', icon: LayoutList, action: () => { setCurrentView('all'); setSelectedListId(undefined) } },
      ...lists.map(list => ({
        id: `list-${list.id}`,
        label: `Go to ${list.name}`,
        description: `${list.icon} ${list.name}`,
        icon: LayoutList,
        action: () => { setSelectedListId(list.id); setCurrentView('all') },
      })),
      { id: 'create', label: 'Create New Task', icon: Plus, action: onCreateTask },
      { id: 'toggle-completed', label: showCompleted ? 'Hide completed tasks' : 'Show completed tasks', icon: CheckSquare, action: () => setShowCompleted(!showCompleted) },
      { id: 'theme-light', label: 'Theme: Light', icon: Sun, action: () => setTheme('light') },
      { id: 'theme-dark', label: 'Theme: Dark', icon: Moon, action: () => setTheme('dark') },
      { id: 'theme-system', label: 'Theme: System', icon: Monitor, action: () => setTheme('system') },
    ]
    return cmds
  }, [setCurrentView, setSelectedListId, lists, onCreateTask, setShowCompleted, showCompleted, setTheme])

  const filtered = getCommands().filter(cmd => {
    if (!query) return true
    const q = query.toLowerCase()
    return cmd.label.toLowerCase().includes(q) || (cmd.description?.toLowerCase().includes(q) ?? false)
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      filtered[selectedIndex].action()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg top-[15%] -translate-y-0 p-0 gap-0 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            className="border-0 rounded-none h-14 pl-11 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto border-t p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((cmd, idx) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                      idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => { cmd.action(); onClose() }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span>{cmd.label}</span>
                      {cmd.description && (
                        <span className="ml-2 text-xs text-muted-foreground">{cmd.description}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})
