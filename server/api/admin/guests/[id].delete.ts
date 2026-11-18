import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parsePositiveId(event)
  const db = useDb()
  const [deleted] = await db
    .delete(schema.guests)
    .where(eq(schema.guests.id, id))
    .returning({ id: schema.guests.id })
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Convidado não encontrado' })
  }
  console.info('[guests] deleted', { guestId: id })
  return { ok: true }
})
