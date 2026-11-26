import { asc, eq } from 'drizzle-orm'
import { buildGuestReportCsv } from '#shared/utils/guest-report'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const rows = await db
    .select({
      guestName: schema.guests.name,
      groupName: schema.guests.groupName,
      responsibleName: schema.rsvps.responsibleName,
      attendanceStatus: schema.rsvps.attendanceStatus,
      estimatedGuests: schema.guests.estimatedGuests,
      adults: schema.rsvps.adultsCount,
      children8to11: schema.rsvps.children8to11Count,
      children0to7: schema.rsvps.children0to7Count,
    })
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .orderBy(asc(schema.guests.name))

  const date = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="confirmacoes-${date}.csv"`,
    'Cache-Control': 'no-store',
  })
  return `\uFEFF${buildGuestReportCsv(rows)}`
})
