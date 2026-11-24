import { paymentInputSchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contractId = parsePositiveId(event)
  const paymentId = parsePositiveId(event, 'paymentId')
  const parsed = paymentInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  return await updatePayment(contractId, paymentId, parsed.data)
})
