import { contractListQuerySchema } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = contractListQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Filtros inválidos' })
  }
  return await listContracts(parsed.data)
})
