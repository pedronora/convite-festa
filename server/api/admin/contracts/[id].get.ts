export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contract = await getContractDetail(parsePositiveId(event))
  if (!contract) {
    throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  }
  return contract
})
