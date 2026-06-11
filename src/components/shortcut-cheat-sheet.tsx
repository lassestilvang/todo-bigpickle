'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Command, Keyboard } from 'lucide-react'

interface ShortcutGroup {
  group: string
  shortcuts: { keys: string; description: string }[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    group: 'General',
    shortcuts: [
      { keys: '⌘N', description: 'Create new task' },
      { keys: '⌘P', description: 'Open command palette' },
      { keys: '⌘,', description: 'Open command palette' },
      { keys: '⌘?', description: 'Show keyboard shortcuts' },
      { keys: '⌘.', description: 'Toggle focus mode' },
      { keys: '⌘B', description: 'Toggle sidebar' },
      { keys: '/', description: 'Focus search' },
      { keys: '⌘F', description: 'Focus and select search' },
      { keys: '⌘⇧H', description: 'Toggle show completed' },
      { keys: '⌥1-4', description: 'Switch views: Today / 7d / Upcoming / All' },
      { keys: 'Esc', description: 'Close dialogs / modals' },
    ],
  },
  {
    group: 'Task Navigation',
    shortcuts: [
      { keys: 'j k', description: 'Navigate between tasks' },
      { keys: '↑ ↓', description: 'Navigate between tasks' },
      { keys: 'Enter', description: 'Open focused task' },
      { keys: 'n', description: 'Focus quick-add input' },
      { keys: '⌘K', description: 'Focus quick-add input' },
      { keys: '← →', description: 'Navigate task preview' },
      { keys: '1 2 3', description: 'Set date: Today / Tomorrow / Next week' },
      { keys: '?', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    group: 'Task Actions (focused)',
    shortcuts: [
      { keys: 'c', description: 'Toggle complete focused task' },
      { keys: 'd', description: 'Delete focused task' },
      { keys: 'p', description: 'Cycle priority focused task' },
    ],
  },
  {
    group: 'Selection',
    shortcuts: [
      { keys: 'Click', description: 'Select task' },
      { keys: '⌘+Click', description: 'Toggle single selection' },
      { keys: '⇧+Click', description: 'Range select tasks' },
    ],
  },
]

export function ShortcutCheatSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/5">
              <Keyboard className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Keyboard Shortcuts</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Master your workflow
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.group}>
              <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/60 mb-2.5">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys + shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <kbd className="inline-flex h-6 items-center gap-0.5 rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium text-foreground/70">
                      {shortcut.keys.split(' ').map((part, i) => (
                        <span key={i}>
                          {part === '⌘' ? (
                            <Command className="size-3" />
                          ) : part.startsWith('⌘') || part.startsWith('⇧') || part === 'Esc' ? (
                            part
                          ) : (
                            <span className="tracking-normal">{part}</span>
                          )}
                        </span>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
