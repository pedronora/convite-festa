import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type Database = ReturnType<typeof createDatabase>

export function createDatabase(url: string) {
  if (!url) {
    throw new Error('DATABASE_URL não configurada.')
  }
  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  })
  return { client, db: drizzle(client, { schema, casing: 'snake_case' }) }
}
