import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parsePositiveId(event)
  const guest = await findGuestById(id)
  if (!guest) {
    throw createError({ statusCode: 404, statusMessage: 'Convidado não encontrado' })
  }
  const db = useDb()
  await db
    .update(schema.invitations)
    .set({
      uuid: randomUUID(),
      status: 'not_sent',
      sentAt: null,
      lastSentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.invitations.id, guest.invitationId))

  console.info('[guests] link regenerated', { guestId: id })
  return await findGuestById(id)
})
