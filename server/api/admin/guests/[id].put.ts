import { eq } from 'drizzle-orm'
import { guestInputSchema, zodMessage } from '#shared/validation'
import { normalizePhoneBR } from '#shared/utils/phone'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parsePositiveId(event)
  const parsed = guestInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }
  const input = parsed.data
  const phone = normalizePhoneBR(input.phone)
  if (!phone) {
    throw createError({ statusCode: 422, statusMessage: 'Telefone inválido' })
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
    throw createError({ statusCode: 404, statusMessage: 'Convidado não encontrado' })
  }
  const guest = await findGuestById(id)
  console.info('[guests] updated', { guestId: id })
  return guest
})
