import { eq } from 'drizzle-orm'
import { guestInputSchema, zodMessage } from '#shared/validation'
import { normalizePhoneBR } from '#shared/utils/phone'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = guestInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      message: zodMessage(parsed.error),
      data: { fieldErrors: parsed.error.flatten().fieldErrors },
    })
  }
  const input = parsed.data
  const phone = normalizePhoneBR(input.phone)
  if (!phone) {
    throw createError({ statusCode: 422, message: 'Telefone inválido' })
  }

  const db = useDb()
  const guestId = await db.transaction(async (tx) => {
    const [guest] = await tx
      .insert(schema.guests)
      .values({
        name: input.name,
        phone,
        email: input.email,
        groupName: input.groupName,
        notes: input.notes,
        estimatedGuests: input.estimatedGuests ?? null,
        maxGuests: input.maxGuests ?? null,
      })
      .returning({ id: schema.guests.id })
    if (!guest) throw createError({ statusCode: 500, message: 'Não foi possível cadastrar' })
    await tx.insert(schema.invitations).values({ guestId: guest.id })
    return guest.id
  })

  const detail = await findGuestById(guestId)
  console.info('[guests] created', { guestId })
  setResponseStatus(event, 201)
  return detail
})
