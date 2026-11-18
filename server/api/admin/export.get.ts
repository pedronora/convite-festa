import { asc, eq } from 'drizzle-orm'
import { buildInvitationLink, formatDateTime } from '#shared/utils/format'
import { formatPhoneBR } from '#shared/utils/phone'

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  if (/[;"\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

const SEND_LABEL: Record<string, string> = {
  not_sent: 'Não enviado',
  sent: 'Enviado',
  failed: 'Falha no envio',
}
const RSVP_LABEL: Record<string, string> = {
  yes: 'Confirmado',
  no: 'Não comparecerá',
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const rows = await db
    .select({
      name: schema.guests.name,
      groupName: schema.guests.groupName,
      phone: schema.guests.phone,
      email: schema.guests.email,
      sendStatus: schema.invitations.status,
      lastSentAt: schema.invitations.lastSentAt,
      invitationUuid: schema.invitations.uuid,
      attendanceStatus: schema.rsvps.attendanceStatus,
      confirmedAt: schema.rsvps.confirmedAt,
      adults: schema.rsvps.adultsCount,
      children8to11: schema.rsvps.children8to11Count,
      children0to7: schema.rsvps.children0to7Count,
      responsibleName: schema.rsvps.responsibleName,
      rsvpNotes: schema.rsvps.notes,
      notes: schema.guests.notes,
      createdAt: schema.guests.createdAt,
    })
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .orderBy(asc(schema.guests.name))

  const appUrl = (useRuntimeConfig().public.appUrl as string) || ''
  const header = [
    'Nome',
    'Família/Grupo',
    'Telefone',
    'E-mail',
    'Status do envio',
    'Último envio',
    'Status da confirmação',
    'Data da confirmação',
    'Adultos',
    'Crianças 8-11',
    'Crianças 0-7',
    'Total de pessoas',
    'Responsável',
    'Observações do RSVP',
    'Observações internas',
    'Link do convite',
    'Cadastrado em',
  ]
  const lines = [header.join(';')]
  for (const row of rows) {
    const adults = row.adults ?? 0
    const children8to11 = row.children8to11 ?? 0
    const children0to7 = row.children0to7 ?? 0
    const alreadyDeclined = row.attendanceStatus === 'no'
    lines.push(
      [
        row.name,
        row.groupName ?? '',
        formatPhoneBR(row.phone),
        row.email ?? '',
        SEND_LABEL[row.sendStatus] ?? row.sendStatus,
        formatDateTime(row.lastSentAt ? row.lastSentAt.toISOString() : null),
        row.attendanceStatus ? RSVP_LABEL[row.attendanceStatus] : 'Aguardando resposta',
        formatDateTime(row.confirmedAt ? row.confirmedAt.toISOString() : null),
        alreadyDeclined ? 0 : adults,
        alreadyDeclined ? 0 : children8to11,
        alreadyDeclined ? 0 : children0to7,
        alreadyDeclined ? 0 : adults + children8to11 + children0to7,
        row.responsibleName ?? '',
        row.rsvpNotes ?? '',
        row.notes ?? '',
        buildInvitationLink(appUrl, row.invitationUuid),
        formatDateTime(row.createdAt.toISOString()),
      ]
        .map(csvCell)
        .join(';'),
    )
  }

  const date = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="convidados-${date}.csv"`,
    'Cache-Control': 'no-store',
  })
  return `\uFEFF${lines.join('\r\n')}`
})
