import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não configurada.')
  process.exit(1)
}

const retries = Number(process.env.DB_MIGRATE_RETRIES || 30)
const waitMs = Number(process.env.DB_MIGRATE_RETRY_DELAY_MS || 2000)
const migrationsFolder = process.env.MIGRATIONS_FOLDER || './drizzle'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForDatabase(client) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await client`select 1`
      return
    }
    catch (error) {
      if (attempt === retries) throw error
      console.warn(`[migrate] banco indisponível (tentativa ${attempt}/${retries}), aguardando…`)
      await sleep(waitMs)
    }
  }
}

const client = postgres(url, { max: 1, connect_timeout: 10 })

try {
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')

  await waitForDatabase(client)
  const db = drizzle(client)
  await migrate(db, { migrationsFolder })
  console.log('✓ Migrations aplicadas')
}
catch (error) {
  console.error('Falha ao aplicar migrations:', error)
  process.exitCode = 1
}
finally {
  await client.end()
}
