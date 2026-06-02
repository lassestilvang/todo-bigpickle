'use client'

import { memo, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Trash2, Move, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedIds: string[]
  onClearSelection: () => void
}

export const BulkActionBar = memo(function BulkActionBar({
  selectedIds,
  onClearSelection,
}: BulkActionBarProps) {
  const bulkCompleteTasks = useAppStore(s => s.bulkCompleteTasks)
  const bulkDeleteTasks = useAppStore(s => s.bulkDeleteTasks)
  const bulkMoveTasks = useAppStore(s => s.bulkMoveTasks)
  const lists = useAppStore(s => s.lists)

  const count = selectedIds.length
  if (count === 0) return null

  const handleComplete = useCallback(() => {
    bulkCompleteTasks(selectedIds, true)
    onClearSelection()
  }, [selectedIds, bulkCompleteTasks, onClearSelection])

  const handleDelete = useCallback(() => {
    bulkDeleteTasks(selectedIds)
    onClearSelection()
  }, [selectedIds, bulkDeleteTasks, onClearSelection])

  const handleMove = useCallback((listId: string) => {
    if (listId) {
      bulkMoveTasks(selectedIds, listId)
      onClearSelection()
    }
  }, [selectedIds, bulkMoveTasks, onClearSelection])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-fade-slide-in">
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border bg-background/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
        <span className="text-sm font-medium tabular-nums text-muted-foreground whitespace-nowrap">
          {count} selected
        </span>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComplete}
          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
        >
          <CheckCircle2 className="size-3.5 mr-1.5" />
          Complete
        </Button>
        <Select onValueChange={handleMove}>
          <SelectTrigger className="h-8 w-auto gap-1 text-xs border-dashed">
            <Move className="size-3.5" />
            <SelectValue placeholder="Move to..." />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id} className="text-xs">
                {list.icon} {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Trash2 className="size-3.5 mr-1.5" />
          Delete
        </Button>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
})
