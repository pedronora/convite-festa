import { eq } from 'drizzle-orm'
import { guestInputSchema, zodMessage } from '#shared/validation'
import { normalizePhone } from '#shared/utils/phone'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parsePositiveId(event)
  const parsed = guestInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  const input = parsed.data
  const phone = normalizePhone(input.phone, input.phoneCountry)
  if (!phone) {
    throw createError({ statusCode: 422, message: 'Telefone inválido' })
  }
  const db = useDb()
  const [updated] = await db
    .update(schema.guests)
    .set({
      name: input.name,
      phone,
      email: input.email,
      groupName: input.groupName,
      notes: input.notes,
      estimatedGuests: input.estimatedGuests ?? null,
      maxGuests: input.maxGuests ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.guests.id, id))
    .returning({ id: schema.guests.id })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Convidado não encontrado' })
  }
  const guest = await findGuestById(id)
  console.info('[guests] updated', { guestId: id })
  return guest
})
