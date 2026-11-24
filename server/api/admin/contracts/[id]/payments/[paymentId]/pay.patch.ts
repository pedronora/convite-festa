import { paymentPaySchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contractId = parsePositiveId(event)
  const paymentId = parsePositiveId(event, 'paymentId')
  const parsed = paymentPaySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  return await payPayment(contractId, paymentId, parsed.data.paidOn)
})
