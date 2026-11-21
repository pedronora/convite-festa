import { eq } from 'drizzle-orm'
import { passwordChangeSchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  enforceRateLimit(event, 'password-change', 5, 15 * 60 * 1000)
  enforceScopedRateLimit(event, `password-change:admin:${admin.id}`, 5, 15 * 60 * 1000)
  const parsed = passwordChangeSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }

  const db = useDb()
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, admin.id))
    .limit(1)
  if (!user) throw createError({ statusCode: 404, message: 'Usuário não encontrado' })

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({
      statusCode: 422,
      message: 'Senha atual incorreta',
      data: { fieldErrors: { currentPassword: 'Senha atual incorreta' } },
    })
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await db.transaction(async (tx) => {
    await tx
      .update(schema.adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, admin.id))
    await tx
      .delete(schema.adminSessions)
      .where(eq(schema.adminSessions.adminUserId, admin.id))
  })
  await createAdminSession(event, admin.id)
  console.info('[auth] password changed', { adminId: admin.id })
  return { ok: true }
})
