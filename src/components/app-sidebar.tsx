'use client'

import { memo, useMemo, useState, useEffect } from 'react'
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
  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setSelectedListId = useAppStore(s => s.setSelectedListId)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)
  const tasks = useAppStore(s => s.tasks)

  const now = useNow()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 150)

  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

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
          <CheckCircle2 className="size-6 text-primary" />
          <span className="font-semibold text-lg">Todo</span>
        </div>
        <div className="px-2 pb-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-8"
          />
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
                
                return (
                  <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                      isActive={currentView === view && !selectedListId}
                      aria-current={currentView === view && !selectedListId ? 'page' : undefined}
                      onClick={() => {
                        setCurrentView(view as ViewType)
                        setSelectedListId(undefined)
                      }}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                      {count !== undefined && count > 0 && (
                        <Badge variant="secondary" className="ml-auto">
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
              {lists.map((list) => (
                <SidebarMenuItem key={list.id}>
                  <SidebarMenuButton
                    isActive={selectedListId === list.id}
                    aria-current={selectedListId === list.id ? 'page' : undefined}
                    onClick={() => {
                      setSelectedListId(list.id)
                      setCurrentView('all')
                    }}
                  >
                    <div className="size-3 rounded-full" style={{ backgroundColor: list.color }} />
                    <span>{list.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {overdueCount > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-destructive">
                <AlertTriangle className="size-4 mr-1" />
                Overdue
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 py-1">
                  <Badge variant="destructive">{overdueCount} overdue tasks</Badge>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          <Button onClick={onCreateTask} className="w-full">
            <Plus className="size-4 mr-2" />
            New Task
          </Button>
        </div>
        <div className="px-2 pb-2">
          <label htmlFor="show-completed" className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked === true)}
            />
            <span>Show completed</span>
          </label>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
})
