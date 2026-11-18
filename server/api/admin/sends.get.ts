import { and, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const status = query.status === 'sent' || query.status === 'failed' ? query.status : 'all'
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : ''

  const db = useDb()
  const filters: SQL[] = []
  if (status !== 'all') filters.push(eq(schema.invitationSends.status, status))
  if (search) {
    const term = `%${search.replace(/[%_]/g, '')}%`
    filters.push(or(ilike(schema.guests.name, term), ilike(schema.guests.phone, term))!)
  }
  const where = filters.length ? and(...filters) : undefined

  const rows = await db
    .select({
      id: schema.invitationSends.id,
      invitationId: schema.invitationSends.invitationId,
      guestId: schema.guests.id,
      guestName: schema.guests.name,
      invitationUuid: schema.invitations.uuid,
      phone: schema.invitationSends.phone,
      message: schema.invitationSends.message,
      method: schema.invitationSends.method,
      status: schema.invitationSends.status,
      attempt: schema.invitationSends.attempt,
      sentAt: schema.invitationSends.sentAt,
      createdAt: schema.invitationSends.createdAt,
    })
    .from(schema.invitationSends)
    .innerJoin(schema.invitations, eq(schema.invitationSends.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .where(where)
    .orderBy(desc(schema.invitationSends.sentAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const [totalRow] = await db
    .select({ value: count() })
    .from(schema.invitationSends)
    .innerJoin(schema.invitations, eq(schema.invitationSends.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .where(where)

  const [stats] = await db
    .select({
      sent: sql<number>`count(*) filter (where ${schema.invitationSends.status} = 'sent')::int`,
      failed: sql<number>`count(*) filter (where ${schema.invitationSends.status} = 'failed')::int`,
    })
    .from(schema.invitationSends)

  return {
    items: rows.map(row => ({
      ...row,
      sentAt: new Date(row.sentAt).toISOString(),
      createdAt: new Date(row.createdAt).toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total: Number(totalRow?.value ?? 0),
      totalPages: Math.max(1, Math.ceil(Number(totalRow?.value ?? 0) / pageSize)),
    },
    stats: {
      sent: Number(stats?.sent ?? 0),
      failed: Number(stats?.failed ?? 0),
    },
  }
})
