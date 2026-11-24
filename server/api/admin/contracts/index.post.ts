import { contractInputSchema, zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = contractInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  const contract = await createContract(parsed.data)
  setResponseStatus(event, 201)
  return contract
})
