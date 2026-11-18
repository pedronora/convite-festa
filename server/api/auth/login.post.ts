import { eq } from 'drizzle-orm'
import { loginSchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'login', 8, 15 * 60 * 1000)
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      message: zodMessage(parsed.error),
      data: { fieldErrors: parsed.error.flatten().fieldErrors },
    })
  }

  const db = useDb()
  const email = parsed.data.email.toLowerCase()
  const [admin] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
    .limit(1)

  const invalid = () =>
    createError({
      statusCode: 401,
      statusMessage: 'Credenciais inválidas',
      message: 'E-mail ou senha incorretos.',
    })

  if (!admin) {
    // Mantém custo aproximado mesmo quando o e-mail não existe.
    await hashPassword(parsed.data.password)
    throw invalid()
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash)
  if (!valid) throw invalid()

  await createAdminSession(event, admin.id)
  console.info('[auth] login', { adminId: admin.id, ip: getRequestIP(event, { xForwardedFor: true }) })

  return {
    admin: { id: admin.id, name: admin.name, email: admin.email },
  }
})
