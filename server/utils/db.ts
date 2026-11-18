import { createDatabase } from '../database/client'
import * as schema from '../database/schema'

let instance: ReturnType<typeof createDatabase> | undefined

/** Cliente único do banco por processo. */
export function useDb() {
  if (!instance) {
    const config = useRuntimeConfig()
    const url = process.env.NUXT_DATABASE_URL
      || process.env.DATABASE_URL
      || (config.databaseUrl as string)
    instance = createDatabase(url)
  }
  return instance.db
}

export { schema }
