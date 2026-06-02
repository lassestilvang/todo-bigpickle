'use client'

import { memo, useMemo } from 'react'
import { useAppStore } from '@/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  BarChart3,
  CheckCircle2,
  List,
  Flag,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'

interface StatsDashboardProps {
  open: boolean
  onClose: () => void
}

export const StatsDashboard = memo(function StatsDashboard({ open, onClose }: StatsDashboardProps) {
  const tasks = useAppStore(s => s.tasks)
  const lists = useAppStore(s => s.lists)

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const active = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Priority distribution
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
      none: tasks.filter(t => t.priority === 'none').length,
    }

    // List distribution
    const byList: Record<string, number> = {}
    for (const t of tasks) byList[t.listId] = (byList[t.listId] || 0) + 1

    // Overdue
    const now = new Date()
    const overdue = tasks.filter(t => t.deadline && t.deadline < now && !t.completed).length

    // With deadlines
    const withDeadlines = tasks.filter(t => t.deadline).length

    // With due dates
    const withDates = tasks.filter(t => t.date).length

    // Tasks completed in last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(startOfDay(now), 6 - i)
      const count = tasks.filter(t =>
        t.completed && t.completedAt && isSameDay(t.completedAt, day)
      ).length
      return { date: day, count }
    })

    const completedThisWeek = last7Days.reduce((sum, d) => sum + d.count, 0)

    // Average completion time (if we have estimate data)
    const tasksWithActual = tasks.filter(t => t.completed && t.actualTime)
    const avgCompletionTime = tasksWithActual.length > 0
      ? Math.round(tasksWithActual.reduce((sum, t) => sum + (t.actualTime || 0), 0) / tasksWithActual.length)
      : null

    // Subtask stats
    const totalSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.length, 0)
    const completedSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.filter(st => st.completed).length, 0)

    return {
      total, completed, active, completionRate,
      byPriority, byList, overdue, withDeadlines, withDates,
      last7Days, completedThisWeek, avgCompletionTime,
      totalSubtasks, completedSubtasks,
    }
  }, [tasks])

  const max7DayCount = Math.max(...stats.last7Days.map(d => d.count), 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="size-5" />
            Insights &amp; Stats
          </DialogTitle>
          <DialogDescription>
            Your productivity at a glance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Top summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 border border-border/40 text-center">
              <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total</p>
            </div>
            <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-500">{stats.completed}</p>
              <p className="text-[10px] text-emerald-500/70 font-medium mt-0.5">Done</p>
            </div>
            <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/20 text-center">
              <p className="text-2xl font-bold tabular-nums text-amber-500">{stats.active}</p>
              <p className="text-[10px] text-amber-500/70 font-medium mt-0.5">Active</p>
            </div>
            <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20 text-center">
              <p className="text-2xl font-bold tabular-nums text-red-500">{stats.overdue}</p>
              <p className="text-[10px] text-red-500/70 font-medium mt-0.5">Overdue</p>
            </div>
          </div>

          {/* Completion rate */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="size-4 text-primary" />
                Completion Rate
              </div>
              <span className="text-2xl font-bold tabular-nums">{stats.completionRate}%</span>
            </div>
            <div className="h-3 bg-muted/70 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* 7-day trend */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4 text-primary" />
                Last 7 Days
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{stats.completedThisWeek}</span> completed
              </span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {stats.last7Days.map((day) => (
                <div key={day.date.toISOString()} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
                    {day.count || ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary/30 transition-all duration-500 min-h-[4px]"
                    style={{ height: `${Math.max((day.count / max7DayCount) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground/50 font-medium">
                    {format(day.date, 'EEE')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority & List distribution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Flag className="size-4 text-primary" />
                By Priority
              </div>
              <div className="space-y-2.5">
                {(['high', 'medium', 'low', 'none'] as const).map(p => {
                  const count = stats.byPriority[p]
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                  const colors = {
                    high: 'from-red-500 to-red-400',
                    medium: 'from-amber-500 to-amber-400',
                    low: 'from-emerald-500 to-emerald-400',
                    none: 'from-zinc-400 to-zinc-300',
                  }
                  return (
                    <div key={p}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize font-medium">{p}</span>
                        <span className="tabular-nums text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[p]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <List className="size-4 text-primary" />
                By List
              </div>
              <div className="space-y-2.5">
                {lists.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No lists</p>
                ) : (
                  lists.map(list => {
                    const count = stats.byList[list.id] || 0
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                    return (
                      <div key={list.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{list.icon} {list.name}</span>
                          <span className="tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted/70 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: list.color }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sub-task stats */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Subtask Completion
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold tabular-nums text-emerald-500">
                {stats.completedSubtasks}
                <span className="text-base text-muted-foreground font-normal">/{stats.totalSubtasks}</span>
              </div>
              <div className="flex-1 h-2 bg-muted/70 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.totalSubtasks > 0 ? (stats.completedSubtasks / stats.totalSubtasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom summary */}
          <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
              <Clock className="size-3.5" />
              {stats.withDates} with dates
            </div>
            <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
              <AlertTriangle className="size-3.5" />
              {stats.withDeadlines} with deadlines
            </div>
            <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
              <Sparkles className="size-3.5" />
              {stats.avgCompletionTime ? `${Math.floor(stats.avgCompletionTime / 60)}h avg` : 'N/A'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
