import { eq } from 'drizzle-orm'
import { rsvpInputSchema, zodMessage } from '#shared/validation'
import { normalizePhoneBR } from '#shared/utils/phone'
import { exceedsGuestLimit, resolveGuestLimit, totalGuests } from '#shared/utils/format'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'rsvp-write', 12, 10 * 60 * 1000)
  const uuid = getRouterParam(event, 'uuid') || ''
  enforceRateLimit(event, `rsvp-write-invite:${uuid}`, 30, 60 * 60 * 1000)

  const row = await findInvitationByUuid(uuid)
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Convite não encontrado',
      message: 'Não encontramos este convite. Verifique o link recebido no WhatsApp.',
    })
  }

  const parsed = rsvpInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }

  const input = parsed.data
  const attendanceStatus = input.attendanceStatus
  const adults = attendanceStatus === 'yes' ? input.adults : 0
  const children8to11 = attendanceStatus === 'yes' ? input.children8to11 : 0
  const children0to7 = attendanceStatus === 'yes' ? input.children0to7 : 0
  const total = totalGuests(adults, children8to11, children0to7)

  const settings = await getPartySettings()
  const guestLimit = resolveGuestLimit(row.maxGuests, settings.maxGuestsDefault)
  if (attendanceStatus === 'yes' && exceedsGuestLimit(total, guestLimit)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Limite de pessoas excedido',
      message: `Este convite permite até ${guestLimit} ${guestLimit === 1 ? 'pessoa' : 'pessoas'}. Ajuste as quantidades.`,
      data: { fieldErrors: { adults: `Limite de ${guestLimit} pessoas por convite` } },
    })
  }

  const phone = normalizePhoneBR(input.phone)
  if (!phone) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Telefone inválido',
      data: { fieldErrors: { phone: 'Telefone inválido' } },
    })
  }

  const db = useDb()
  const now = new Date()
  const values = {
    invitationId: row.invitationId,
    attendanceStatus,
    adultsCount: adults,
    children8to11Count: children8to11,
    children0to7Count: children0to7,
    responsibleName: input.responsibleName,
    phone,
    email: input.email,
    notes: input.notes,
    confirmedAt: now,
    updatedAt: now,
  }
  const [saved] = await db
    .insert(schema.rsvps)
    .values(values)
    .onConflictDoUpdate({
      target: schema.rsvps.invitationId,
      set: {
        attendanceStatus: values.attendanceStatus,
        adultsCount: values.adultsCount,
        children8to11Count: values.children8to11Count,
        children0to7Count: values.children0to7Count,
        responsibleName: values.responsibleName,
        phone: values.phone,
        email: values.email,
        notes: values.notes,
        updatedAt: now,
      },
    })
    .returning()

  if (!saved) {
    throw createError({ statusCode: 500, statusMessage: 'Não foi possível salvar a confirmação' })
  }

  await db
    .update(schema.invitations)
    .set({ updatedAt: now })
    .where(eq(schema.invitations.id, row.invitationId))

  console.info('[rsvp] saved', {
    invitationId: row.invitationId,
    attendanceStatus,
    total,
    updated: Boolean(row.rsvpId),
  })

  return {
    ok: true,
    rsvp: {
      attendanceStatus: saved.attendanceStatus,
      adults: saved.adultsCount,
      children8to11: saved.children8to11Count,
      children0to7: saved.children0to7Count,
      totalPeople: saved.adultsCount + saved.children8to11Count + saved.children0to7Count,
      responsibleName: saved.responsibleName,
      phone: saved.phone,
      email: saved.email,
      notes: saved.notes,
      confirmedAt: new Date(saved.confirmedAt).toISOString(),
      updatedAt: new Date(saved.updatedAt).toISOString(),
      wasUpdate: Boolean(row.rsvpId),
    },
  }
})
