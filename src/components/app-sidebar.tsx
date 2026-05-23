'use client'

import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { useNow } from '@/hooks/use-now'
import { useDebounce } from '@/hooks/use-debounce'
import { motion } from 'framer-motion'
import { ViewType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarFooter
} from '@/components/ui/sidebar'
import { 
  CalendarDays, 
  CalendarRange,
  List, 
  LayoutList,
  Plus, 
  Search, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

const viewIcons = {
  today: CalendarDays,
  next7days: CalendarRange,
  upcoming: List,
  all: LayoutList,
}

const viewLabels = {
  today: 'Today',
  next7days: 'Next 7 Days',
  upcoming: 'Upcoming',
  all: 'All Tasks',
}

interface AppSidebarProps {
  onCreateTask: () => void
}

export const AppSidebar = memo(function AppSidebar({ onCreateTask }: AppSidebarProps) {
  const lists = useAppStore(s => s.lists)
  const currentView = useAppStore(s => s.currentView)
  const selectedListId = useAppStore(s => s.selectedListId)
  const showCompleted = useAppStore(s => s.showCompleted)
  const searchQuery = useAppStore(s => s.searchQuery)
  const tasks = useAppStore(s => s.tasks)
  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setSelectedListId = useAppStore(s => s.setSelectedListId)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)

  const now = useNow()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 150)

  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const handleSetSearchQuery = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
  }, [])

  const handleViewClick = useCallback((view: ViewType) => {
    setCurrentView(view)
    setSelectedListId(undefined)
  }, [setCurrentView, setSelectedListId])

  const handleListClick = useCallback((listId: string) => {
    setSelectedListId(listId)
    setCurrentView('all')
  }, [setSelectedListId, setCurrentView])

  const handleShowCompleted = useCallback((checked: boolean) => {
    setShowCompleted(checked)
  }, [setShowCompleted])

  const { overdueCount, todayCount, next7Count } = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    let overdue = 0
    let todayCount = 0
    let next7Count = 0

    for (const t of tasks) {
      if (!t.completed && t.deadline && t.deadline < now) overdue++

      if (!t.date || t.completed) continue
      const taskDate = new Date(t.date)
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())

      if (taskDateOnly.getTime() === today.getTime()) todayCount++
      if (taskDateOnly >= today && taskDateOnly <= nextWeek) next7Count++
    }

    return { overdueCount: overdue, todayCount, next7Count }
  }, [tasks, now])

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <CheckCircle2 className="size-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Todo</span>
        </div>
        <div className="px-2 pb-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={localSearch}
            onChange={handleSetSearchQuery}
            className="w-full pl-8 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all duration-200"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/50">
            ⌘/
          </kbd>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(viewLabels).map(([view, label]) => {
                const Icon = viewIcons[view as ViewType]
                const count = view === 'today' ? todayCount : view === 'next7days' ? next7Count : undefined
                const isActive = currentView === view && !selectedListId
                
                return (
                  <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                      isActive={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleViewClick(view as ViewType)}
                      className="group"
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                      {count !== undefined && count > 0 && (
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className="ml-auto text-[10px] px-1.5 min-w-5 h-5 flex items-center justify-center"
                        >
                          <motion.span
                            key={count}
                            initial={{ scale: 1.3, y: -2 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            {count}
                          </motion.span>
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No lists yet
                </div>
              ) : (
                lists.map((list) => (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton
                      isActive={selectedListId === list.id}
                      aria-current={selectedListId === list.id ? 'page' : undefined}
                      onClick={() => handleListClick(list.id)}
                    >
                      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                      <span>{list.icon} {list.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {overdueCount > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-destructive">
                <AlertTriangle className="size-3.5 mr-1.5" />
                Overdue
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 py-1">
                  <Badge variant="destructive" className="w-full justify-center gap-1.5">
                    <AlertTriangle className="size-3" />
                    <motion.span
                      key={overdueCount}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
                    </motion.span>
                  </Badge>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          <Button onClick={onCreateTask} className="w-full group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="size-4 mr-2 transition-transform group-hover:rotate-90 duration-200" />
            New Task
            <kbd className="ml-auto hidden md:inline-flex h-5 items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium">
              ⌘N
            </kbd>
          </Button>
        </div>
        <div className="px-3 pb-3">
          <label htmlFor="show-completed" className="flex items-center gap-2.5 text-sm cursor-pointer group">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => handleShowCompleted(checked === true)}
              className="transition-all duration-200 group-hover:border-primary/50"
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              Show completed
            </span>
          </label>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
})
