import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const status = query.status === 'yes' || query.status === 'no' ? query.status : 'all'
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : ''

  const db = useDb()
  const filters: SQL[] = []
  if (status !== 'all') filters.push(eq(schema.rsvps.attendanceStatus, status))
  if (search) {
    const term = `%${search.replace(/[%_]/g, '')}%`
    filters.push(
      or(
        ilike(schema.guests.name, term),
        ilike(schema.guests.groupName, term),
        ilike(schema.rsvps.responsibleName, term),
        ilike(schema.guests.phone, term),
      )!,
    )
  }
  const where = filters.length ? and(...filters) : undefined

  const base = db
    .select({
      id: schema.rsvps.id,
      guestId: schema.guests.id,
      invitationUuid: schema.invitations.uuid,
      guestName: schema.guests.name,
      groupName: schema.guests.groupName,
      phone: schema.rsvps.phone,
      responsibleName: schema.rsvps.responsibleName,
      attendanceStatus: schema.rsvps.attendanceStatus,
      adults: schema.rsvps.adultsCount,
      children8to11: schema.rsvps.children8to11Count,
      children0to7: schema.rsvps.children0to7Count,
      notes: schema.rsvps.notes,
      confirmedAt: schema.rsvps.confirmedAt,
      updatedAt: schema.rsvps.updatedAt,
    })
    .from(schema.rsvps)
    .innerJoin(schema.invitations, eq(schema.rsvps.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))

  const rows = await base
    .where(where)
    .orderBy(desc(schema.rsvps.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const [totalRow] = await db
    .select({ value: count() })
    .from(schema.rsvps)
    .innerJoin(schema.invitations, eq(schema.rsvps.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .where(where)

  const [stats] = await db
    .select({
      confirmed: sql<number>`count(*) filter (where ${schema.rsvps.attendanceStatus} = 'yes')::int`,
      declined: sql<number>`count(*) filter (where ${schema.rsvps.attendanceStatus} = 'no')::int`,
      people: sql<number>`coalesce(sum(${schema.rsvps.adultsCount} + ${schema.rsvps.children8to11Count} + ${schema.rsvps.children0to7Count}) filter (where ${schema.rsvps.attendanceStatus} = 'yes'), 0)::int`,
    })
    .from(schema.rsvps)

  return {
    items: rows.map(row => ({
      ...row,
      totalPeople: row.adults + row.children8to11 + row.children0to7,
      confirmedAt: new Date(row.confirmedAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total: Number(totalRow?.value ?? 0),
      totalPages: Math.max(1, Math.ceil(Number(totalRow?.value ?? 0) / pageSize)),
    },
    stats: {
      confirmed: Number(stats?.confirmed ?? 0),
      declined: Number(stats?.declined ?? 0),
      people: Number(stats?.people ?? 0),
    },
  }
})
