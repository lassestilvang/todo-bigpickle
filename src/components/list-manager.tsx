'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label as FormLabel } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const LIST_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

const LIST_ICONS = ['📋', '📁', '⭐', '❤️', '🔥', '💼', '🎯', '📚', '🏠', '💡', '🎨', '🏋️', '✈️', '🎵', '📝']

interface ListFormProps {
  initialName?: string
  initialIcon?: string
  initialColor?: string
  onSubmit: (data: { name: string; icon: string; color: string }) => void
  onCancel: () => void
  submitLabel: string
}

function ListForm({ initialName = '', initialIcon = '📋', initialColor = LIST_COLORS[0], onSubmit, onCancel, submitLabel }: ListFormProps) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), icon, color })
  }, [name, icon, color, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <FormLabel>Name</FormLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          autoFocus
          className="h-9"
        />
      </div>
      <div className="space-y-2">
        <FormLabel>Icon</FormLabel>
        <div className="flex flex-wrap gap-1.5">
          {LIST_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`size-8 rounded-lg text-base flex items-center justify-center transition-all duration-150
                ${icon === ic ? 'bg-primary/10 ring-2 ring-primary scale-110' : 'bg-muted hover:bg-muted/80'}
              `}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <FormLabel>Color</FormLabel>
        <div className="flex flex-wrap gap-2">
          {LIST_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-7 rounded-full transition-all duration-150 ring-offset-2 ring-offset-background
                ${color === c ? 'ring-2 ring-primary scale-110' : 'hover:scale-110'}
              `}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!name.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function ListManager({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const lists = useAppStore(s => s.lists)
  const addList = useAppStore(s => s.addList)
  const updateList = useAppStore(s => s.updateList)
  const deleteList = useAppStore(s => s.deleteList)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const confirmDeleteList = lists.find(l => l.id === confirmDeleteId)

  const handleAdd = useCallback(async (data: { name: string; icon: string; color: string }) => {
    try {
      setError(null)
      await addList({
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: false,
      })
      setShowAddForm(false)
    } catch {
      setError('Failed to create list')
    }
  }, [addList])

  const handleUpdate = useCallback(async (id: string, data: { name: string; icon: string; color: string }) => {
    try {
      setError(null)
      await updateList(id, data)
      setEditingId(null)
    } catch {
      setError('Failed to update list')
    }
  }, [updateList])

  const handleDelete = useCallback(async (id: string) => {
    try {
      setError(null)
      await deleteList(id)
    } catch {
      setError('Failed to delete list')
    }
  }, [deleteList])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Lists</DialogTitle>
          <DialogDescription>
            Create, edit, or delete your task lists
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {error && (
            <div className="p-2 text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          {!showAddForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="w-full border-dashed"
            >
              <Plus className="size-3.5 mr-1.5" />
              New List
            </Button>
          ) : (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">New List</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ListForm
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
                submitLabel="Create"
              />
            </div>
          )}

          <div className="space-y-1">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                {editingId === list.id ? (
                  <div className="flex-1">
                    <ListForm
                      initialName={list.name}
                      initialIcon={list.icon}
                      initialColor={list.color}
                      onSubmit={(data) => handleUpdate(list.id, data)}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-base shrink-0">{list.icon}</span>
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="flex-1 text-sm font-medium truncate">{list.name}</span>
                    {list.isDefault && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(list.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all"
                      aria-label={`Edit ${list.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {!list.isDefault && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(list.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        aria-label={`Delete ${list.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>

        {confirmDeleteList && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-lg">
            <div className="bg-card border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-base">Delete list?</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the list{' '}
                  <span className="font-medium text-foreground">{confirmDeleteList.icon} {confirmDeleteList.name}</span>{' '}
                  and all tasks within it. This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={() => {
                  handleDelete(confirmDeleteList.id)
                  setConfirmDeleteId(null)
                }}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
