import { eq } from 'drizzle-orm'
import type { PublicInvitation } from '#shared/types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export const publicInvitationColumns = {
  invitationId: schema.invitations.id,
  invitationUuid: schema.invitations.uuid,
  invitationStatus: schema.invitations.status,
  guestName: schema.guests.name,
  groupName: schema.guests.groupName,
  maxGuests: schema.guests.maxGuests,
  rsvpId: schema.rsvps.id,
  attendanceStatus: schema.rsvps.attendanceStatus,
  adults: schema.rsvps.adultsCount,
  children8to11: schema.rsvps.children8to11Count,
  children0to7: schema.rsvps.children0to7Count,
  responsibleName: schema.rsvps.responsibleName,
  rsvpPhone: schema.rsvps.phone,
  rsvpEmail: schema.rsvps.email,
  notes: schema.rsvps.notes,
  confirmedAt: schema.rsvps.confirmedAt,
  rsvpUpdatedAt: schema.rsvps.updatedAt,
}

export async function findInvitationByUuid(uuid: string) {
  if (!isValidUuid(uuid)) return null
  const db = useDb()
  const [row] = await db
    .select(publicInvitationColumns)
    .from(schema.invitations)
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .leftJoin(schema.rsvps, eq(schema.rsvps.invitationId, schema.invitations.id))
    .where(eq(schema.invitations.uuid, uuid))
    .limit(1)
  return row ?? null
}

export async function getPublicInvitation(uuid: string): Promise<PublicInvitation | null> {
  const row = await findInvitationByUuid(uuid)
  if (!row) return null
  const settings = await getPartySettings()
  return {
    uuid: row.invitationUuid,
    guest: {
      name: row.guestName,
      groupName: row.groupName,
      maxGuests: row.maxGuests,
    },
    settings,
    existingRsvp: row.rsvpId
      ? {
          attendanceStatus: row.attendanceStatus as 'yes' | 'no',
          adults: row.adults ?? 0,
          children8to11: row.children8to11 ?? 0,
          children0to7: row.children0to7 ?? 0,
          responsibleName: row.responsibleName!,
          phone: row.rsvpPhone!,
          email: row.rsvpEmail,
          notes: row.notes,
          confirmedAt: new Date(row.confirmedAt!).toISOString(),
          updatedAt: new Date(row.rsvpUpdatedAt!).toISOString(),
        }
      : null,
  }
}
