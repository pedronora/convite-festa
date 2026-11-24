import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import type { PartySettings } from '../../shared/config/party'
import type { ExpenseCategory, PaymentMethod } from '../../shared/config/finance'

export const invitationStatusEnum = pgEnum('invitation_status', ['not_sent', 'sent', 'failed'])
export const sendResultEnum = pgEnum('send_result', ['sent', 'failed'])
export const sendMethodEnum = pgEnum('send_method', ['whatsapp_web', 'whatsapp_business'])
export const rsvpAttendanceEnum = pgEnum('rsvp_attendance', ['yes', 'no'])

export const adminUsers = pgTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 160 }).notNull(),
    email: varchar('email', { length: 200 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [uniqueIndex('admin_users_email_unique').on(table.email)],
)

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: integer('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex('admin_sessions_token_hash_unique').on(table.tokenHash),
    index('admin_sessions_admin_user_idx').on(table.adminUserId),
  ],
)

export const guests = pgTable(
  'guests',
  {
    id: serial('id').primaryKey(),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    name: varchar('name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 200 }),
    groupName: varchar('group_name', { length: 160 }),
    notes: text('notes'),
    estimatedGuests: integer('estimated_guests'),
    maxGuests: integer('max_guests'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('guests_name_idx').on(table.name),
    index('guests_phone_idx').on(table.phone),
  ],
)

export const invitations = pgTable(
  'invitations',
  {
    id: serial('id').primaryKey(),
    guestId: integer('guest_id')
      .notNull()
      .references(() => guests.id, { onDelete: 'cascade' }),
    uuid: uuid('uuid').notNull().defaultRandom().unique(),
    status: invitationStatusEnum('status').notNull().default('not_sent'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex('invitations_guest_id_unique').on(table.guestId),
    index('invitations_status_idx').on(table.status),
  ],
)

export const rsvps = pgTable(
  'rsvps',
  {
    id: serial('id').primaryKey(),
    invitationId: integer('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    attendanceStatus: rsvpAttendanceEnum('attendance_status').notNull(),
    adultsCount: integer('adults_count').notNull().default(0),
    children8to11Count: integer('children_8_11_count').notNull().default(0),
    children0to7Count: integer('children_0_7_count').notNull().default(0),
    responsibleName: varchar('responsible_name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 200 }),
    notes: text('notes'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    uniqueIndex('rsvps_invitation_id_unique').on(table.invitationId),
    index('rsvps_attendance_status_idx').on(table.attendanceStatus),
  ],
)

export const invitationSends = pgTable(
  'invitation_sends',
  {
    id: serial('id').primaryKey(),
    invitationId: integer('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 20 }).notNull(),
    message: text('message').notNull(),
    method: sendMethodEnum('method').notNull().default('whatsapp_web'),
    status: sendResultEnum('status').notNull(),
    attempt: integer('attempt').notNull().default(1),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('invitation_sends_invitation_idx').on(table.invitationId),
    index('invitation_sends_sent_at_idx').on(table.sentAt),
  ],
)

export const partySettings = pgTable('party_settings', {
  id: integer('id').primaryKey().default(1),
  data: jsonb('data').$type<PartySettings>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const contracts = pgTable(
  'contracts',
  {
    id: serial('id').primaryKey(),
    supplierName: varchar('supplier_name', { length: 160 }).notNull(),
    category: varchar('category', { length: 40 }).$type<ExpenseCategory>().notNull().default('outros'),
    contact: varchar('contact', { length: 160 }),
    description: text('description').notNull(),
    totalCents: integer('total_cents').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('contracts_supplier_name_idx').on(table.supplierName),
    index('contracts_category_idx').on(table.category),
  ],
)

export const contractPayments = pgTable(
  'contract_payments',
  {
    id: serial('id').primaryKey(),
    contractId: integer('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 80 }),
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date').notNull(),
    paidOn: date('paid_on'),
    method: varchar('method', { length: 30 }).$type<PaymentMethod>(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('contract_payments_contract_idx').on(table.contractId),
    index('contract_payments_due_date_idx').on(table.dueDate),
    index('contract_payments_paid_on_idx').on(table.paidOn),
  ],
)

export type AdminUser = typeof adminUsers.$inferSelect
export type Guest = typeof guests.$inferSelect
export type Invitation = typeof invitations.$inferSelect
export type Rsvp = typeof rsvps.$inferSelect
export type InvitationSend = typeof invitationSends.$inferSelect
export type Contract = typeof contracts.$inferSelect
export type ContractPayment = typeof contractPayments.$inferSelect
