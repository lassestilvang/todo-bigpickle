'use client'

import { useAppStore } from '@/store'
import { ViewType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, Checkbox, Separator, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar'
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

export const AppSidebar = memo(function AppSidebar({ onCreateTask }: AppSidebarProps) {
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
  }
})
