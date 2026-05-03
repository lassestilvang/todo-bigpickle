'use client'

import { memo } from 'react'
import { useAppStore } from '@/store'
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
  List, 
  Plus, 
  Search, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

const viewIcons = {
  today: CalendarDays,
  next7days: CalendarDays,
  upcoming: List,
  all: List,
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
  const { 
    lists, 
    currentView, 
    selectedListId, 
    showCompleted, 
    searchQuery,
    setCurrentView,
    setSelectedListId,
    setShowCompleted,
    setSearchQuery,
    getOverdueTaskCount,
    getTasksByView
  } = useAppStore()

  const overdueCount = getOverdueTaskCount()
  const todayCount = getTasksByView('today').filter(t => !t.completed).length
  const next7Count = getTasksByView('next7days').filter(t => !t.completed).length

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Todo</span>
        </div>
        <div className="px-2 pb-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                      onClick={() => {
                        setCurrentView(view as ViewType)
                        setSelectedListId(undefined)
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      {count !== undefined && count > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {count}
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
                    onClick={() => {
                      setSelectedListId(list.id)
                      setCurrentView('all')
                    }}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
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
                <AlertTriangle className="h-4 w-4 mr-1" />
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
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
        <div className="px-2 pb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
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
