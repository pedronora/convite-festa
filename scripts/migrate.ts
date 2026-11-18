import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não configurada.')
  process.exit(1)
}

const client = postgres(url, { max: 1 })
const db = drizzle(client)

try {
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✓ Migrations aplicadas')
}
catch (error) {
  console.error('Falha ao aplicar migrations:', error)
  process.exitCode = 1
}
finally {
  await client.end()
}
