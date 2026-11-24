export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await deleteContract(parsePositiveId(event))
  return { ok: true }
})
