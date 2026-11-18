import { count, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm'
import type { GuestDetail, GuestListItem, GuestListResponse, RsvpStatus, SendStatus } from '#shared/types'

type GuestQuery = {
  search: string
  send: 'all' | 'not_sent' | 'sent' | 'failed'
  rsvp: 'all' | 'awaiting' | 'yes' | 'no'
  sort: 'name' | 'createdAt' | 'sentAt' | 'confirmedAt'
  order: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const guestColumns = {
  id: schema.guests.id,
  uuid: schema.guests.uuid,
  name: schema.guests.name,
  phone: schema.guests.phone,
  email: schema.guests.email,
  groupName: schema.guests.groupName,
  notes: schema.guests.notes,
  estimatedGuests: schema.guests.estimatedGuests,
  maxGuests: schema.guests.maxGuests,
  createdAt: schema.guests.createdAt,
  updatedAt: schema.guests.updatedAt,
  invitationId: schema.invitations.id,
  invitationUuid: schema.invitations.uuid,
  sendStatus: schema.invitations.status,
  sentAt: schema.invitations.sentAt,
  lastSentAt: schema.invitations.lastSentAt,
  rsvpId: schema.rsvps.id,
  attendanceStatus: schema.rsvps.attendanceStatus,
  adults: schema.rsvps.adultsCount,
  children8to11: schema.rsvps.children8to11Count,
  children0to7: schema.rsvps.children0to7Count,
  confirmedAt: schema.rsvps.confirmedAt,
  rsvpUpdatedAt: schema.rsvps.updatedAt,
  responsibleName: schema.rsvps.responsibleName,
  rsvpPhone: schema.rsvps.phone,
  rsvpEmail: schema.rsvps.email,
  rsvpNotes: schema.rsvps.notes,
}

type GuestRow = {
  id: number
  uuid: string
  name: string
  phone: string
  email: string | null
  groupName: string | null
  notes: string | null
  estimatedGuests: number | null
  maxGuests: number | null
  createdAt: Date
  updatedAt: Date
  invitationId: number | null
  invitationUuid: string | null
  sendStatus: SendStatus | null
  sentAt: Date | null
  lastSentAt: Date | null
  rsvpId: number | null
  attendanceStatus: RsvpStatus | null
  adults: number | null
  children8to11: number | null
  children0to7: number | null
  confirmedAt: Date | null
  rsvpUpdatedAt: Date | null
  responsibleName: string | null
  rsvpPhone: string | null
  rsvpEmail: string | null
  rsvpNotes: string | null
}

function toIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null
}

export function mapGuestRow(row: GuestRow): GuestListItem {
  const adults = row.adults ?? 0
  const children8to11 = row.children8to11 ?? 0
  const children0to7 = row.children0to7 ?? 0
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    phone: row.phone,
    email: row.email,
    groupName: row.groupName,
    notes: row.notes,
    estimatedGuests: row.estimatedGuests,
    maxGuests: row.maxGuests,
    createdAt: toIso(row.createdAt)!,
    updatedAt: toIso(row.updatedAt)!,
    invitationId: row.invitationId!,
    invitationUuid: row.invitationUuid!,
    sendStatus: row.sendStatus ?? 'not_sent',
    sentAt: toIso(row.sentAt),
    lastSentAt: toIso(row.lastSentAt),
    rsvpStatus: row.rsvpId ? (row.attendanceStatus as 'yes' | 'no') : 'awaiting',
    confirmedAt: toIso(row.confirmedAt),
    rsvpUpdatedAt: toIso(row.rsvpUpdatedAt),
    adults,
    children8to11,
    children0to7,
    totalPeople: adults + children8to11 + children0to7,
    responsibleName: row.responsibleName ?? null,
    rsvpPhone: row.rsvpPhone ?? null,
    rsvpEmail: row.rsvpEmail ?? null,
    rsvpNotes: row.rsvpNotes ?? null,
  }
}

function buildFilters(query: GuestQuery): SQL[] {
  const filters: SQL[] = []
  if (query.search) {
    const term = `%${query.search.replace(/[%_]/g, '')}%`
    const digits = query.search.replace(/\D/g, '')
    const clauses = [
      ilike(schema.guests.name, term),
      ilike(schema.guests.groupName, term),
    ]
    if (digits.length >= 3) clauses.push(ilike(schema.guests.phone, `%${digits}%`))
    filters.push(or(...clauses)!)
  }
  if (query.send !== 'all') {
    filters.push(eq(schema.invitations.status, query.send))
  }
  if (query.rsvp === 'awaiting') filters.push(isNull(schema.rsvps.id))
  if (query.rsvp === 'yes' || query.rsvp === 'no') {
    filters.push(eq(schema.rsvps.attendanceStatus, query.rsvp))
  }
  return filters
}

function orderBy(query: GuestQuery): SQL {
  const columns = {
    name: schema.guests.name,
    createdAt: schema.guests.createdAt,
    sentAt: schema.invitations.sentAt,
    confirmedAt: schema.rsvps.confirmedAt,
  }
  const direction = query.order === 'asc' ? sql.raw('asc') : sql.raw('desc')
  return sql`${columns[query.sort]} ${direction} nulls last`
}

export async function listGuests(query: GuestQuery) {
  const db = useDb()
  const filters = buildFilters(query)
  const where = filters.length ? sql.join(filters, sql` and `) : undefined

  const rows = await db
    .select(guestColumns)
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .where(where)
    .orderBy(orderBy(query))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)

  const [totalRow] = await db
    .select({ value: count() })
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .where(where)

  const total = Number(totalRow?.value ?? 0)
  return {
    items: rows.map(mapGuestRow),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  } satisfies GuestListResponse
}

export async function findGuestById(id: number): Promise<GuestDetail | null> {
  const db = useDb()
  const [row] = await db
    .select(guestColumns)
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .where(eq(schema.guests.id, id))
    .limit(1)
  if (!row) return null
  const sends = await db
    .select({
      id: schema.invitationSends.id,
      invitationId: schema.invitationSends.invitationId,
      phone: schema.invitationSends.phone,
      message: schema.invitationSends.message,
      method: schema.invitationSends.method,
      status: schema.invitationSends.status,
      attempt: schema.invitationSends.attempt,
      sentAt: schema.invitationSends.sentAt,
      createdAt: schema.invitationSends.createdAt,
    })
    .from(schema.invitationSends)
    .where(eq(schema.invitationSends.invitationId, row.invitationId))
    .orderBy(desc(schema.invitationSends.sentAt))
    .limit(50)

  return {
    ...mapGuestRow(row),
    sends: sends.map(send => ({
      ...send,
      guestId: row.id,
      guestName: row.name,
      method: send.method,
      sentAt: new Date(send.sentAt).toISOString(),
      createdAt: new Date(send.createdAt).toISOString(),
    })),
  }
}

export type { GuestQuery }
