export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const guest = await findGuestById(parsePositiveId(event))
  if (!guest) {
    throw createError({ statusCode: 404, statusMessage: 'Convidado não encontrado' })
  }
  return guest
})
