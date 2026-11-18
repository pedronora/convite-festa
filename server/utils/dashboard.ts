import { desc, eq, sql } from 'drizzle-orm'
import type { DashboardData } from '#shared/types'

export async function getDashboardData(): Promise<DashboardData> {
  const db = useDb()

  const [invitationStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      sent: sql<number>`count(*) filter (where ${schema.invitations.status} = 'sent')::int`,
      failed: sql<number>`count(*) filter (where ${schema.invitations.status} = 'failed')::int`,
      notSent: sql<number>`count(*) filter (where ${schema.invitations.status} = 'not_sent')::int`,
    })
    .from(schema.invitations)

  const [rsvpStats] = await db
    .select({
      confirmed: sql<number>`count(*) filter (where ${schema.rsvps.attendanceStatus} = 'yes')::int`,
      declined: sql<number>`count(*) filter (where ${schema.rsvps.attendanceStatus} = 'no')::int`,
      adults: sql<number>`coalesce(sum(${schema.rsvps.adultsCount}) filter (where ${schema.rsvps.attendanceStatus} = 'yes'), 0)::int`,
      children8to11: sql<number>`coalesce(sum(${schema.rsvps.children8to11Count}) filter (where ${schema.rsvps.attendanceStatus} = 'yes'), 0)::int`,
      children0to7: sql<number>`coalesce(sum(${schema.rsvps.children0to7Count}) filter (where ${schema.rsvps.attendanceStatus} = 'yes'), 0)::int`,
    })
    .from(schema.rsvps)

  const recentRsvps = await db
    .select({
      guestName: schema.guests.name,
      groupName: schema.guests.groupName,
      attendanceStatus: schema.rsvps.attendanceStatus,
      adults: schema.rsvps.adultsCount,
      children8to11: schema.rsvps.children8to11Count,
      children0to7: schema.rsvps.children0to7Count,
      confirmedAt: schema.rsvps.updatedAt,
    })
    .from(schema.rsvps)
    .innerJoin(schema.invitations, eq(schema.rsvps.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .orderBy(desc(schema.rsvps.updatedAt))
    .limit(6)

  const recentSends = await db
    .select({
      guestName: schema.guests.name,
      phone: schema.invitationSends.phone,
      status: schema.invitationSends.status,
      sentAt: schema.invitationSends.sentAt,
    })
    .from(schema.invitationSends)
    .innerJoin(schema.invitations, eq(schema.invitationSends.invitationId, schema.invitations.id))
    .innerJoin(schema.guests, eq(schema.invitations.guestId, schema.guests.id))
    .orderBy(desc(schema.invitationSends.sentAt))
    .limit(6)

  const totalInvites = Number(invitationStats?.total ?? 0)
  const sentInvites = Number(invitationStats?.sent ?? 0)
  const failedInvites = Number(invitationStats?.failed ?? 0)
  const confirmedInvites = Number(rsvpStats?.confirmed ?? 0)
  const declinedInvites = Number(rsvpStats?.declined ?? 0)
  const adults = Number(rsvpStats?.adults ?? 0)
  const children8to11 = Number(rsvpStats?.children8to11 ?? 0)
  const children0to7 = Number(rsvpStats?.children0to7 ?? 0)
  const totalPeople = adults + children8to11 + children0to7
  const awaitingInvites = Math.max(0, totalInvites - confirmedInvites - declinedInvites)
  const pendingInvites = Number(invitationStats?.notSent ?? 0)

  return {
    metrics: {
      totalInvites,
      sentInvites,
      pendingInvites,
      failedInvites,
      totalConfirmedInvites: confirmedInvites,
      totalDeclinedInvites: declinedInvites,
      awaitingInvites,
      totalPeople,
      adults,
      children8to11,
      children0to7,
      confirmationRate: sentInvites > 0 ? Math.round((confirmedInvites / sentInvites) * 100) : 0,
      awaitingRate: totalInvites > 0 ? Math.round((awaitingInvites / totalInvites) * 100) : 0,
    },
    charts: {
      confirmationStatus: {
        confirmed: confirmedInvites,
        declined: declinedInvites,
        awaiting: awaitingInvites,
      },
      ageGroups: { adults, children8to11, children0to7 },
      sendStatus: {
        sent: sentInvites,
        notSent: Number(invitationStats?.notSent ?? 0),
        failed: failedInvites,
      },
    },
    recentRsvps: recentRsvps.map(item => ({
      guestName: item.guestName,
      groupName: item.groupName,
      attendanceStatus: item.attendanceStatus,
      totalPeople: item.adults + item.children8to11 + item.children0to7,
      confirmedAt: new Date(item.confirmedAt).toISOString(),
    })),
    recentSends: recentSends.map(item => ({
      guestName: item.guestName,
      phone: item.phone,
      status: item.status,
      sentAt: new Date(item.sentAt).toISOString(),
    })),
  }
}
