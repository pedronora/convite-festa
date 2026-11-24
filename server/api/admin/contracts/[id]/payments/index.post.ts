import { paymentInputSchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contractId = parsePositiveId(event)
  const parsed = paymentInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  const contract = await createPayment(contractId, parsed.data)
  setResponseStatus(event, 201)
  return contract
})
