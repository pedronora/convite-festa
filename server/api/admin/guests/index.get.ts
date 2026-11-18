import { guestListQuerySchema } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const parsed = guestListQuerySchema.safeParse(query)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Filtros inválidos' })
  }
  return await listGuests(parsed.data)
})
