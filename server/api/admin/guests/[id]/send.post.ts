import { eq, sql } from 'drizzle-orm'
import { sendRegistrationSchema, zodMessage } from '#shared/validation'
import { normalizePhoneBR } from '#shared/utils/phone'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parsePositiveId(event)
  const parsed = sendRegistrationSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  const guest = await findGuestById(id)
  if (!guest) {
    throw createError({ statusCode: 404, statusMessage: 'Convidado não encontrado' })
  }
  const phone = normalizePhoneBR(parsed.data.phone)
  if (!phone) {
    throw createError({ statusCode: 422, statusMessage: 'Telefone inválido' })
  }

  const db = useDb()
  const now = new Date()
  const attemptRow = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(schema.invitationSends)
    .where(eq(schema.invitationSends.invitationId, guest.invitationId))
  const attempt = Number(attemptRow[0]?.value ?? 0) + 1

  const [history] = await db
    .insert(schema.invitationSends)
    .values({
      invitationId: guest.invitationId,
      phone,
      message: parsed.data.message,
      method: parsed.data.method,
      status: parsed.data.status,
      attempt,
      sentAt: now,
    })
    .returning()

  if (parsed.data.status === 'sent') {
    await db
      .update(schema.invitations)
      .set({
        status: 'sent',
        sentAt: guest.sentAt ? new Date(guest.sentAt) : now,
        lastSentAt: now,
        updatedAt: now,
      })
      .where(eq(schema.invitations.id, guest.invitationId))
  } else if (guest.sendStatus !== 'sent') {
    await db
      .update(schema.invitations)
      .set({ status: 'failed', updatedAt: now })
      .where(eq(schema.invitations.id, guest.invitationId))
  }

  console.info('[sends] registered', {
    guestId: id,
    status: parsed.data.status,
    method: parsed.data.method,
    attempt,
  })

  return {
    ok: true,
    send: history
      ? {
          id: history.id,
          status: history.status,
          attempt: history.attempt,
          sentAt: new Date(history.sentAt).toISOString(),
        }
      : null,
    guest: await findGuestById(id),
  }
})
