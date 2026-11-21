import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { createDatabase } from '../server/database/client'
import { adminUsers } from '../server/database/schema'
import { hashPassword } from '../server/utils/password'
import { passwordPolicyError } from '../shared/utils/password-policy'

function arg(name: string): string | undefined {
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
  console.error('Informe um e-mail válido: npm run admin:create -- --email admin@exemplo.com --password "senha-forte"')
  process.exit(1)
}
const passwordError = password
  ? passwordPolicyError(password)
  : 'Informe a senha com --password ou ADMIN_PASSWORD.'
if (passwordError) {
  console.error(passwordError)
  process.exit(1)
}

const { client, db } = createDatabase(url)

async function main() {
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (existing) {
    await db
      .update(adminUsers)
      .set({ name, passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(adminUsers.id, existing.id))
    console.log(`✓ Senha atualizada para ${email}`)
    return
  }

  await db.insert(adminUsers).values({
    name,
    email,
    passwordHash: await hashPassword(password),
  })
  console.log(`✓ Administrador criado: ${email}`)
}

main()
  .catch((error) => {
    console.error('Falha ao criar administrador:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end()
  })
