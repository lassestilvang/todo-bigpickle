import { DatabaseService } from './database'

let dbInstance: DatabaseService | null = null

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService()
  }
  return dbInstance
}
