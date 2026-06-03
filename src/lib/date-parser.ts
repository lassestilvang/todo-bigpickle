import { addDays, addWeeks, addMonths, nextDay, getDay } from 'date-fns'

const dayNames: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

export function parseDateFromText(input: string): { name: string; date?: Date } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try "name on [day]" or "name [day]"
  const dayPatterns = [
    // "next [dayname]"
    { regex: /^(.*?)\s+next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\s*$/i, handler: (name: string, dayStr: string) => {
      const dayIndex = dayNames[dayStr.toLowerCase()]
      if (dayIndex === undefined) return null
      return { name, date: nextDay(new Date(), dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6) }
    }},
    // "this [dayname]" or "on [dayname]"
    { regex: /^(.*?)\s+(?:this|on)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\s*$/i, handler: (name: string, dayStr: string) => {
      const dayIndex = dayNames[dayStr.toLowerCase()]
      if (dayIndex === undefined) return null
      const today = new Date()
      const currentDay = getDay(today)
      if (currentDay <= dayIndex) {
        return { name, date: addDays(today, dayIndex - currentDay) }
      }
      return { name, date: nextDay(today, dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6) }
    }},
    // "in [N] [days/weeks/months]"
    { regex: /^(.*?)\s+in\s+(\d+)\s+(day|days|week|weeks|month|months)\s*$/i, handler: (name: string, num: string, unit: string) => {
      const n = parseInt(num)
      const unitLower = unit.toLowerCase()
      if (unitLower.startsWith('day')) return { name, date: addDays(new Date(), n) }
      if (unitLower.startsWith('week')) return { name, date: addWeeks(new Date(), n) }
      if (unitLower.startsWith('month')) return { name, date: addMonths(new Date(), n) }
      return null
    }},
    // "next week"
    { regex: /^(.*?)\s+next\s+week\s*$/i, handler: (name: string) => {
      return { name, date: addWeeks(new Date(), 1) }
    }},
    // "next month"
    { regex: /^(.*?)\s+next\s+month\s*$/i, handler: (name: string) => {
      return { name, date: addMonths(new Date(), 1) }
    }},
    // "today" at the end
    { regex: /^(.*?)\s+today\s*$/i, handler: (name: string) => {
      return { name, date: new Date() }
    }},
    // "tomorrow" at the end
    { regex: /^(.*?)\s+tomorrow\s*$/i, handler: (name: string) => {
      return { name, date: addDays(new Date(), 1) }
    }},
  ]

  for (const { regex, handler } of dayPatterns) {
    const match = trimmed.match(regex)
    if (match) {
      const name = match[1].trim()
      if (name) {
        const result = handler(name, match[2], match[3])
        if (result) return result
      }
    }
  }

  // "today" as the entire text
  if (/^today\s*$/i.test(trimmed)) {
    return { name: trimmed, date: new Date() }
  }

  // "tomorrow" as the entire text
  if (/^tomorrow\s*$/i.test(trimmed)) {
    return { name: trimmed, date: addDays(new Date(), 1) }
  }

  return null
}
