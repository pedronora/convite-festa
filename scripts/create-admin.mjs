import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import postgres from 'postgres'

const scrypt = promisify(scryptCallback)

function arg(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não configurada.')
  process.exit(1)
}

const email = (arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = arg('password') || process.env.ADMIN_PASSWORD || ''
const name = arg('name') || process.env.ADMIN_NAME || 'Administrador'

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error('Informe um e-mail válido: node scripts/create-admin.mjs --email admin@exemplo.com --password "senha-forte"')
  process.exit(1)
}
if (password.length < 10) {
  console.error('A senha precisa ter ao menos 10 caracteres.')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const derived = await scrypt(password, salt, 64)
const passwordHash = `scrypt$${salt}$${derived.toString('hex')}`

const sql = postgres(url, { max: 1 })

try {
  const [admin] = await sql`
    insert into admin_users (name, email, password_hash)
    values (${name}, ${email}, ${passwordHash})
    on conflict (email) do update
      set name = excluded.name,
          password_hash = excluded.password_hash,
          updated_at = now()
    returning id, email
  `
  console.log(`✓ Administrador disponível: ${admin.email} (id ${admin.id})`)
}
catch (error) {
  console.error('Falha ao criar administrador:', error)
  process.exitCode = 1
}
finally {
  await sql.end()
}
