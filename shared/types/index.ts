export type SendStatus = 'not_sent' | 'sent' | 'failed'
export type RsvpStatus = 'awaiting' | 'yes' | 'no'
export type SendMethod = 'whatsapp_web' | 'whatsapp_business'

export interface GuestListItem {
  id: number
  uuid: string
  name: string
  phone: string
  email: string | null
  groupName: string | null
  notes: string | null
  estimatedGuests: number | null
  maxGuests: number | null
  createdAt: string
  updatedAt: string
  invitationId: number
  invitationUuid: string
  sendStatus: SendStatus
  sentAt: string | null
  lastSentAt: string | null
  rsvpStatus: RsvpStatus
  confirmedAt: string | null
  rsvpUpdatedAt: string | null
  adults: number
  children8to11: number
  children0to7: number
  totalPeople: number
  responsibleName: string | null
  rsvpPhone: string | null
  rsvpEmail: string | null
  rsvpNotes: string | null
}

export interface GuestDetail extends GuestListItem {
  sends: SendHistoryItem[]
}

export interface GuestListResponse {
  items: GuestListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface SendHistoryItem {
  id: number
  invitationId: number
  guestId: number
  guestName: string
  phone: string
  message: string
  method: SendMethod
  status: 'sent' | 'failed'
  attempt: number
  sentAt: string
  createdAt: string
}

export interface DashboardMetrics {
  totalInvites: number
  sentInvites: number
  pendingInvites: number
  failedInvites: number
  totalConfirmedInvites: number
  totalDeclinedInvites: number
  awaitingInvites: number
  totalPeople: number
  adults: number
  children8to11: number
  children0to7: number
  confirmationRate: number
  awaitingRate: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  charts: {
    confirmationStatus: { confirmed: number, declined: number, awaiting: number }
    ageGroups: { adults: number, children8to11: number, children0to7: number }
    sendStatus: { sent: number, notSent: number, failed: number }
  }
  recentRsvps: Array<{
    guestName: string
    groupName: string | null
    attendanceStatus: 'yes' | 'no'
    totalPeople: number
    confirmedAt: string
  }>
  recentSends: Array<{
    guestName: string
    phone: string
    status: 'sent' | 'failed'
    sentAt: string
  }>
}

export interface RsvpSummary {
  attendanceStatus: 'yes' | 'no'
  adults: number
  children8to11: number
  children0to7: number
  totalPeople: number
  responsibleName: string
  phone: string
  email: string | null
  notes: string | null
  confirmedAt: string
  updatedAt: string
  wasUpdate?: boolean
}

export interface PublicInvitation {
  uuid: string
  guest: {
    name: string
    groupName: string | null
    maxGuests: number | null
  }
  settings: import('../config/party').PartySettings
  existingRsvp: {
    attendanceStatus: 'yes' | 'no'
    adults: number
    children8to11: number
    children0to7: number
    responsibleName: string
    phone: string
    email: string | null
    notes: string | null
    confirmedAt: string
    updatedAt: string
  } | null
}
