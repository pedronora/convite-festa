export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contractId = parsePositiveId(event)
  const paymentId = parsePositiveId(event, 'paymentId')
  await deletePayment(contractId, paymentId)
  return { ok: true }
})
