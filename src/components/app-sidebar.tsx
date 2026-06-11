'use client'

import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { useAppStore, useShallow } from '@/store'
import { useNow } from '@/hooks/use-now'
import { useDebounce } from '@/hooks/use-debounce'
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
  AlertTriangle,
  Settings2,
  Target,
} from 'lucide-react'
import { ListManager } from '@/components/list-manager'
import { LabelManager } from '@/components/label-manager'
import { StatsDashboard } from '@/components/stats-dashboard'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Celebration } from '@/components/celebration'
import { exportTasksAsCSV } from '@/lib/csv-export'

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
  const [listManagerOpen, setListManagerOpen] = useState(false)
  const [labelManagerOpen, setLabelManagerOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [goalReachedCelebration, setGoalReachedCelebration] = useState(false)
  const prevCompletedToday = useRef(0)

  const { lists, currentView, selectedListId, showCompleted, tasks } = useAppStore(
    useShallow(s => ({
      lists: s.lists,
      currentView: s.currentView,
      selectedListId: s.selectedListId,
      showCompleted: s.showCompleted,
      tasks: s.tasks,
    }))
  )

  const dailyGoal = 5
  const completedTodayCount = useMemo(() => {
    const today = new Date().toDateString()
    return tasks.filter(t => 
      t.completed && t.completedAt && 
      new Date(t.completedAt).toDateString() === today
    ).length
  }, [tasks])

  useEffect(() => {
    if (completedTodayCount >= dailyGoal && prevCompletedToday.current < dailyGoal) {
      setGoalReachedCelebration(true)
      const timer = setTimeout(() => setGoalReachedCelebration(false), 2000)
      return () => clearTimeout(timer)
    }
    prevCompletedToday.current = completedTodayCount
  }, [completedTodayCount, dailyGoal])
  const searchQuery = useAppStore(s => s.searchQuery)
  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setSelectedListId = useAppStore(s => s.setSelectedListId)
  const setShowCompleted = useAppStore(s => s.setShowCompleted)
  const setSearchQuery = useAppStore(s => s.setSearchQuery)

  const now = useNow()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 150)

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

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

  const goalProgress = Math.min(completedTodayCount / dailyGoal, 1)

  const listTaskCounts = useMemo(() => {
    const total: Record<string, number> = {}
    const completed: Record<string, number> = {}
    
    for (const t of tasks) {
      total[t.listId] = (total[t.listId] || 0) + 1
      if (t.completed) completed[t.listId] = (completed[t.listId] || 0) + 1
    }
    
    return { total, completed }
  }, [tasks])

  const viewTaskCounts = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const counts = {
      today: { total: 0, completed: 0 },
      next7days: { total: 0, completed: 0 },
      upcoming: { total: 0, completed: 0 },
      all: { total: 0, completed: 0 },
    }

    for (const t of tasks) {
      counts.all.total++
      if (t.completed) counts.all.completed++

      if (!t.date) continue
      const taskDate = new Date(t.date)
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())

      if (taskDateOnly.getTime() === today.getTime()) {
        counts.today.total++
        if (t.completed) counts.today.completed++
      }
      
      if (taskDateOnly >= today && taskDateOnly <= nextWeek) {
        counts.next7days.total++
        if (t.completed) counts.next7days.completed++
      }

      if (taskDateOnly > today) {
        counts.upcoming.total++
        if (t.completed) counts.upcoming.completed++
      }
    }

    return counts
  }, [tasks, now])

  const streak = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const completedDates = new Set<string>()
    for (const t of tasks) {
      if (!t.completed || !t.completedAt) continue
      completedDates.add(fmt(new Date(t.completedAt)))
    }
    let count = 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      if (completedDates.has(fmt(date))) {
        count++
      } else if (i > 0) {
        break
      }
    }
    return count
  }, [tasks, now])

  return (
    <Sidebar>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-primary/[0.01] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <SidebarHeader className="pb-0">
        <div className="flex items-center gap-2.5 p-2 pb-1">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10 transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-primary/10">
            <CheckCircle2 className="size-5 text-primary" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Todo</span>
            <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide uppercase">Big Pickle</p>
          </div>
        </div>
        <div className="px-2 pb-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={localSearch}
            onChange={handleSetSearchQuery}
            className="w-full pl-8 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-primary/40 transition-all duration-200 [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/50">
            /
          </kbd>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/60">Views</SidebarGroupLabel>
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
                      className="group relative"
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {count !== undefined && count > 0 && (
                          <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">{count}</span>
                        )}
                        {view === 'today' && overdueCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 h-5"
                          >
                            {overdueCount}
                          </Badge>
                        )}
                        <ProgressRing
                          progress={
                            viewTaskCounts[view as keyof typeof viewTaskCounts].total > 0
                              ? viewTaskCounts[view as keyof typeof viewTaskCounts].completed / viewTaskCounts[view as keyof typeof viewTaskCounts].total
                              : 0
                          }
                          size={14}
                          strokeWidth={2}
                          active={isActive}
                        />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 py-3 mx-2 my-2 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in duration-700 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-50">
            <Celebration active={goalReachedCelebration} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Target className="size-3.5" />
              Daily Goal
            </div>
            <span className="text-[10px] font-bold text-primary tabular-nums">
              {completedTodayCount}/{dailyGoal}
            </span>
          </div>
          <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${goalProgress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground/70 font-medium leading-tight">
            {completedTodayCount >= dailyGoal 
              ? "Goal achieved! You're crushing it! 🚀" 
              : `${dailyGoal - completedTodayCount} more to reach your daily goal.`}
          </p>
        </div>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/60 flex items-center justify-between pr-2">
            <span>Lists</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setListManagerOpen(true) }}
              className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
              aria-label="Manage lists"
            >
              <Settings2 className="size-3" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lists.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground animate-fade-in">
                  No lists yet
                </div>
              ) : (
                lists.map((list, i) => (
                  <div
                    key={list.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={selectedListId === list.id}
                        aria-current={selectedListId === list.id ? 'page' : undefined}
                        onClick={() => handleListClick(list.id)}
                      >
                        <div
                          className="size-2.5 rounded-full shrink-0 transition-transform duration-200 hover:scale-[1.3]"
                          style={{ backgroundColor: list.color }}
                        />
                        <span>{list.icon} {list.name}</span>
                        <div className="ml-auto">
                          <ProgressRing
                            progress={
                              listTaskCounts.total[list.id] > 0
                                ? listTaskCounts.completed[list.id] / listTaskCounts.total[list.id]
                                : 0
                            }
                            size={14}
                            strokeWidth={2}
                            active={selectedListId === list.id}
                          />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
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
                    <span key={overdueCount} className="animate-count-in">
                      {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </Badge>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Stats section */}
      <div className="px-3 py-3 border-t border-border/50">
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="text-center group cursor-pointer"
          >
            <div className="text-lg font-bold tabular-nums group-hover:text-primary transition-colors">{tasks.length}</div>
            <div className="text-[10px] text-muted-foreground/70 font-medium">Total</div>
          </button>
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="text-center group cursor-pointer"
          >
            <div className="text-lg font-bold tabular-nums text-emerald-500 group-hover:text-emerald-400 transition-colors">{tasks.filter(t => t.completed).length}</div>
            <div className="text-[10px] text-muted-foreground/70 font-medium">Done</div>
          </button>
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="text-center group cursor-pointer"
          >
            <div className="text-lg font-bold tabular-nums group-hover:text-primary transition-colors">
              {tasks.length > 0
                ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
                : 0}%
            </div>
            <div className="text-[10px] text-muted-foreground/70 font-medium">Rate</div>
          </button>
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="text-center group cursor-pointer"
          >
            <div className={`text-lg font-bold tabular-nums transition-colors ${streak > 0 ? 'text-amber-500 group-hover:text-amber-400' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`}>
              {streak}
            </div>
            <div className="text-[10px] text-muted-foreground/70 font-medium">Streak</div>
          </button>
        </div>
      </div>

      <SidebarFooter>
        <div className="p-2">
          <Button onClick={onCreateTask} className="w-full group transition-all duration-200 active:scale-[0.98] hover:scale-[1.02]">
            <Plus className="size-4 mr-2 transition-transform group-hover:rotate-90 duration-200" />
            New Task
            <kbd className="ml-auto hidden md:inline-flex h-5 items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium">
              ⌘N
            </kbd>
          </Button>
        </div>
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setLabelManagerOpen(true)}
            className="w-full text-xs text-muted-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 px-1 py-1.5"
          >
            <Settings2 className="size-3" />
            Manage Labels
          </button>
          <button
            type="button"
            onClick={() => exportTasksAsCSV(tasks, lists)}
            className="w-full text-xs text-muted-foreground/70 hover:text-foreground transition-colors flex items-center gap-2 px-1 py-1.5"
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="px-3 pb-3">
          <label htmlFor="show-completed" className="flex items-center gap-2.5 text-sm cursor-pointer group">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => handleShowCompleted(checked === true)}
              className="transition-all duration-200 group-hover:border-primary/50 data-[state=checked]:bg-primary"
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              Show completed
            </span>
          </label>
        </div>
      </SidebarFooter>
      <ListManager open={listManagerOpen} onClose={() => setListManagerOpen(false)} />
      <LabelManager open={labelManagerOpen} onClose={() => setLabelManagerOpen(false)} />
      <StatsDashboard open={statsOpen} onClose={() => setStatsOpen(false)} />
    </Sidebar>
  )
})
