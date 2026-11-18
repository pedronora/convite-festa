import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const db = useDb()
    await db.execute(sql`select 1`)
    return { status: 'ok', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[health] database unavailable', error)
    throw createError({ statusCode: 503, statusMessage: 'Banco indisponível' })
  }
})
