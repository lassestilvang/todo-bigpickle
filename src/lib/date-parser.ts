import { addDays, addWeeks, addMonths, nextDay, getDay, addHours, setHours, setMinutes, startOfHour } from 'date-fns'
import { Priority } from '@/types'

const dayNames: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

export interface ParsedTask {
  name: string
  date?: Date
  deadline?: Date
  estimate?: number // in minutes
  priority: Priority
  listName?: string
  labels: string[]
}

export function parseQuickAddTask(input: string): ParsedTask {
  let text = input.trim()
  const result: ParsedTask = {
    name: '',
    priority: 'none',
    labels: [],
  }

  // 1. Extract Priority: !high, !medium, !low, !none or !1, !2, !3
  const priorityMatch = text.match(/\!(high|medium|low|none|1|2|3)\b/i)
  if (priorityMatch) {
    const p = priorityMatch[1].toLowerCase()
    if (p === 'high' || p === '1') result.priority = 'high'
    else if (p === 'medium' || p === '2') result.priority = 'medium'
    else if (p === 'low' || p === '3') result.priority = 'low'
    else result.priority = 'none'
    text = text.replace(priorityMatch[0], '').trim()
  }

  // 2. Extract List: @listname (can be quoted if it has spaces, e.g. @"Work Stuff")
  const listMatch = text.match(/@(?:"([^"]+)"|(\S+))/i)
  if (listMatch) {
    result.listName = listMatch[1] || listMatch[2]
    text = text.replace(listMatch[0], '').trim()
  }

  // 3. Extract Labels: #label1 #label2
  const labelMatches = Array.from(text.matchAll(/#(?:"([^"]+)"|(\S+))/gi))
  for (const match of labelMatches) {
    result.labels.push(match[1] || match[2])
    text = text.replace(match[0], '').trim()
  }

  // 4. Extract Estimates: "takes 30m", "for 2h", "estimate 1.5h"
  const estimateMatch = text.match(/\b(?:takes|for|estimate|est)\s+(\d+(?:\.\d+)?)\s*(m|min|mins|h|hour|hours|hr|hrs)\b/i)
  if (estimateMatch) {
    const num = parseFloat(estimateMatch[1])
    const unit = estimateMatch[2].toLowerCase()
    result.estimate = unit.startsWith('h') ? Math.round(num * 60) : Math.round(num)
    text = text.replace(estimateMatch[0], '').trim()
  }

  // 5. Extract Dates and Deadlines
  const now = new Date()
  
  const datePatterns = [
    // "in N hours"
    { regex: /\bin\s+(\d+)\s+(hour|hours|hr|hrs)\b/i, handler: (num: string) => addHours(now, parseInt(num)) },
    // "at 5pm", "at 5:30am"
    { regex: /\bat\s+(\d+)(?::(\d+))?\s*(am|pm)?\b/i, handler: (h: string, m: string, ampm: string) => {
      let hours = parseInt(h)
      const mins = m ? parseInt(m) : 0
      if (ampm?.toLowerCase() === 'pm' && hours < 12) hours += 12
      if (ampm?.toLowerCase() === 'am' && hours === 12) hours = 0
      const d = new Date(now)
      return setMinutes(setHours(d, hours), mins)
    }},
    // "next [dayname]"
    { regex: /\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/i, handler: (dayStr: string) => {
      const dayIndex = dayNames[dayStr.toLowerCase()]
      return dayIndex !== undefined ? nextDay(now, dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6) : undefined
    }},
    // "this [dayname]" or "on [dayname]" or "due [dayname]" or "by [dayname]"
    { regex: /\b(?:this|on|due|by)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/i, handler: (dayStr: string) => {
      const dayIndex = dayNames[dayStr.toLowerCase()]
      if (dayIndex === undefined) return undefined
      const currentDay = getDay(now)
      return currentDay <= dayIndex ? addDays(now, dayIndex - currentDay) : nextDay(now, dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6)
    }},
    // "in [N] [days/weeks/months]"
    { regex: /\bin\s+(\d+)\s+(day|days|week|weeks|month|months)\b/i, handler: (num: string, unit: string) => {
      const n = parseInt(num)
      const unitLower = unit.toLowerCase()
      if (unitLower.startsWith('day')) return addDays(now, n)
      if (unitLower.startsWith('week')) return addWeeks(now, n)
      if (unitLower.startsWith('month')) return addMonths(now, n)
      return undefined
    }},
    // "next week"
    { regex: /\bnext\s+week\b/i, handler: () => addWeeks(now, 1) },
    // "next month"
    { regex: /\bnext\s+month\b/i, handler: () => addMonths(now, 1) },
    // "today"
    { regex: /\btoday\b/i, handler: () => now },
    // "tomorrow"
    { regex: /\btomorrow\b/i, handler: () => addDays(now, 1) },
  ]

  for (const { regex, handler } of datePatterns) {
    const match = text.match(regex)
    if (match) {
      const parsedDate = (handler as any)(...match.slice(1))
      if (parsedDate) {
        // If it was prefixed by "by" or "due", it's a deadline
        const fullMatch = match[0].toLowerCase()
        if (fullMatch.includes('by') || fullMatch.includes('due')) {
          result.deadline = parsedDate
        } else {
          result.date = parsedDate
        }
        text = text.replace(match[0], '').trim()
        break // Only one date/deadline for now
      }
    }
  }

  // Final name is whatever is left, cleaned up
  result.name = text.replace(/\s+/g, ' ').trim()
  
  // Fallback: If name became empty but original input wasn't, use original
  if (!result.name && input.trim()) {
    result.name = input.trim()
  }

  return result
}
