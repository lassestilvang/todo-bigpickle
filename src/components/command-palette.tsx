'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { useAppStore } from '@/store'
import { useTheme } from '@/components/theme-provider'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
  shortcut?: string
  action: () => void
}

interface CommandGroup {
  label: string
  commands: Command[]
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
  const listRef = useRef<HTMLDivElement>(null)

  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setSelectedListId = useAppStore(s => s.setSelectedListId)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const showCompleted = useAppStore(s => s.showCompleted)
  const lists = useAppStore(s => s.lists)
  const { setTheme } = useTheme()

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setQuery('')
        setSelectedIndex(0)
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  const groups = useMemo((): CommandGroup[] => {
    return [
      {
        label: 'Views',
        commands: [
          { id: 'go-today', label: 'Today', icon: CalendarDays, shortcut: '', action: () => { setCurrentView('today'); setSelectedListId(undefined) } },
          { id: 'go-next7', label: 'Next 7 Days', icon: CalendarRange, shortcut: '', action: () => { setCurrentView('next7days'); setSelectedListId(undefined) } },
          { id: 'go-upcoming', label: 'Upcoming', icon: List, shortcut: '', action: () => { setCurrentView('upcoming'); setSelectedListId(undefined) } },
          { id: 'go-all', label: 'All Tasks', icon: LayoutList, shortcut: '', action: () => { setCurrentView('all'); setSelectedListId(undefined) } },
        ],
      },
      {
        label: 'Lists',
        commands: lists.map(list => ({
          id: `list-${list.id}`,
          label: list.name,
          description: 'Filter by list',
          icon: LayoutList,
          shortcut: '',
          action: () => { setSelectedListId(list.id); setCurrentView('all') },
        })),
      },
      {
        label: 'Actions',
        commands: [
          { id: 'create', label: 'Create New Task', icon: Plus, shortcut: '⌘N', action: onCreateTask },
          { id: 'toggle-completed', label: showCompleted ? 'Hide completed tasks' : 'Show completed tasks', icon: CheckSquare, shortcut: '', action: () => setShowCompleted(!showCompleted) },
        ],
      },
      {
        label: 'Theme',
        commands: [
          { id: 'theme-light', label: 'Light', icon: Sun, shortcut: '', action: () => setTheme('light') },
          { id: 'theme-dark', label: 'Dark', icon: Moon, shortcut: '', action: () => setTheme('dark') },
          { id: 'theme-system', label: 'System', icon: Monitor, shortcut: '', action: () => setTheme('system') },
        ],
      },
    ]
  }, [setCurrentView, setSelectedListId, lists, onCreateTask, setShowCompleted, showCompleted, setTheme])

  const filtered = useMemo(() => {
    const allCmds = groups.flatMap(g => g.commands)
    if (!query) return allCmds
    const q = query.toLowerCase()
    return allCmds.filter(cmd =>
      cmd.label.toLowerCase().includes(q) || (cmd.description?.toLowerCase().includes(q) ?? false)
    )
  }, [groups, query])

  const flatIndexLookup = useMemo(() => {
    if (query) return null
    return groups.flatMap(g => g.commands)
  }, [groups, query])

  useEffect(() => {
    if (!listRef.current || filtered.length === 0) return
    const selected = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, filtered.length])

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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="max-w-lg top-[15%] -translate-y-0 p-0 gap-0 overflow-hidden shadow-2xl"
        aria-describedby={undefined}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            className="border-0 rounded-none h-14 pl-11 pr-4 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto border-t p-2" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
          ) : (
            <div className="space-y-3">
              {query ? (
                <div className="space-y-0.5">
                  {filtered.map((cmd, idx) => {
                    const Icon = cmd.icon
                    return (
                      <button
                        type="button"
                        key={cmd.id}
                        data-index={idx}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => { cmd.action(); onClose() }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                groups.map((group) =>
                  group.commands.length > 0 && (
                    <div key={group.label}>
                      <p className="px-3 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">{group.label}</p>
                      <div className="space-y-0.5">
                        {group.commands.map((cmd) => {
                          const Icon = cmd.icon
                          const globalIdx = flatIndexLookup!.indexOf(cmd)
                          return (
                            <button
                              type="button"
                              key={cmd.id}
                              data-index={globalIdx}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                globalIdx === selectedIndex
                                  ? 'bg-accent text-accent-foreground shadow-sm'
                                  : 'hover:bg-accent/50'
                              }`}
                              onClick={() => { cmd.action(); onClose() }}
                              onMouseEnter={() => setSelectedIndex(globalIdx)}
                            >
                              <Icon className="size-4 shrink-0 text-muted-foreground" />
                              <span className="flex-1">{cmd.label}</span>
                              {cmd.shortcut && (
                                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium">↑</kbd>
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border bg-muted font-mono text-[10px] font-medium">↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">esc</kbd>
            <span>close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
