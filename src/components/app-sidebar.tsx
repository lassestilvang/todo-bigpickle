'use client'

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
  SidebarGroupContent
} from '@/components/ui/sidebar'
import { 
  CalendarDays, 
  List, 
  Plus, 
  Search, 
  Tag,
  CheckCircle,
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

export function AppSidebar({ onCreateTask }: AppSidebarProps) {
  const { 
    lists, 
    labels, 
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

  const getTaskCount = (view: ViewType, listId?: string) => {
    const tasks = getTasksByView(view)
    const filtered = listId 
      ? tasks.filter(task => task.listId === listId)
      : tasks
    return filtered.filter(task => !task.completed).length
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded">
            <CheckCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Task Planner</span>
        </div>
        
        <Button 
          onClick={onCreateTask} 
          className="w-full mt-4" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(Object.keys(viewIcons) as ViewType[]).map((view) => {
                const Icon = viewIcons[view]
                const count = getTaskCount(view)
                const isActive = currentView === view && !selectedListId

                return (
                  <SidebarMenuItem key={view}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setCurrentView(view)
                        setSelectedListId(undefined)
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{viewLabels[view]}</span>
                      {count > 0 && (
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

        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists.map((list) => {
                const count = getTaskCount(currentView, list.id)
                const isActive = selectedListId === list.id

                return (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setSelectedListId(list.id)
                      }}
                    >
                      <span className="text-lg">{list.icon}</span>
                      <span>{list.name}</span>
                      {count > 0 && (
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

        {labels.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Labels</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {labels.map((label) => (
                  <SidebarMenuItem key={label.id}>
                    <SidebarMenuButton>
                      <Tag className="h-4 w-4" />
                      <span>{label.icon} {label.name}</span>
                      <div 
                        className="ml-auto w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <label htmlFor="show-completed" className="text-sm font-medium">
              Show completed tasks
            </label>
          </div>
          
          {overdueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span>{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}