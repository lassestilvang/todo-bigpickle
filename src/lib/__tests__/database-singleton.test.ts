import { describe, expect, it } from 'bun:test'
import { getDatabase } from '@/lib/database-singleton'

describe('database-singleton', () => {
  it('should return a DatabaseService instance', () => {
    const db = getDatabase()
    expect(db).toBeDefined()
    expect(typeof db.getLists).toBe('function')
    expect(typeof db.getTasks).toBe('function')
  })

  it('should return the same instance on repeated calls', () => {
    const db1 = getDatabase()
    const db2 = getDatabase()
    expect(db1).toBe(db2)
  })
})
