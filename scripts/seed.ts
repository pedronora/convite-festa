import 'dotenv/config'
import { count, eq } from 'drizzle-orm'
import { createDatabase } from '../server/database/client'
import {
  adminUsers,
  guests,
  invitationSends,
  invitations,
  partySettings,
  rsvps,
} from '../server/database/schema'
import { hashPassword } from '../server/utils/password'
import { defaultPartySettings } from '../shared/config/party'
import { renderInviteMessage } from '../shared/utils/format'
import { passwordPolicyError } from '../shared/utils/password-policy'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não configurada. Copie .env.example para .env.')
  process.exit(1)
}

const { client, db } = createDatabase(url)

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@festa.local').toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || ''
const adminName = process.env.ADMIN_NAME || 'Administrador'
const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
const seedSample = process.env.SEED_SAMPLE !== 'false'

async function seedAdmin() {
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, adminEmail))
    .limit(1)
  if (existing) {
    console.log(`✓ Administrador já existe: ${adminEmail}`)
    return
  }

  const passwordError = adminPassword
    ? passwordPolicyError(adminPassword)
    : 'Defina ADMIN_PASSWORD no .env antes de rodar o seed.'
  if (passwordError) {
    console.error(passwordError)
    process.exit(1)
  }

  await db.insert(adminUsers).values({
    name: adminName,
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
  })
  console.log(`✓ Administrador criado: ${adminEmail}`)
  console.log('  Senha definida por ADMIN_PASSWORD.')
}

async function seedSettings() {
  const [existing] = await db.select({ id: partySettings.id }).from(partySettings).limit(1)
  if (existing) {
    console.log('✓ Configurações da festa já existem')
    return
  }
  await db.insert(partySettings).values({ id: 1, data: defaultPartySettings })
  console.log('✓ Configurações padrão da festa criadas')
}

interface Sample {
  name: string
  phone: string
  email?: string
  group?: string
  uuid: string
  sent: 'sent' | 'failed' | 'not_sent'
  sentDaysAgo?: number
  rsvp?: 'yes' | 'no'
  adults?: number
  children8to11?: number
  children0to7?: number
  notes?: string
}

const samples: Sample[] = [
  {
    name: 'João Silva',
    group: 'Família Silva',
    phone: '5545999911111',
    email: 'joao.silva@example.com',
    uuid: '11111111-1111-4111-8111-111111111111',
    sent: 'sent',
    sentDaysAgo: 6,
    rsvp: 'yes',
    adults: 2,
    children8to11: 1,
    children0to7: 2,
    notes: 'Obrigado pelo convite! Vamos com as crianças.',
  },
  {
    name: 'Maria Oliveira',
    group: 'Família Oliveira',
    phone: '5545999922222',
    uuid: '22222222-2222-4222-8222-222222222222',
    sent: 'sent',
    sentDaysAgo: 5,
    rsvp: 'no',
    notes: 'Infelizmente estaremos viajando nessa data.',
  },
  {
    name: 'Família Souza',
    phone: '5545999933333',
    group: 'Família Souza',
    uuid: '33333333-3333-4333-8333-333333333333',
    sent: 'sent',
    sentDaysAgo: 3,
  },
  {
    name: 'Carlos Pereira',
    phone: '5545999944444',
    uuid: '44444444-4444-4444-8444-444444444444',
    sent: 'not_sent',
  },
  {
    name: 'Ana Beatriz',
    phone: '5545999955555',
    email: 'ana@example.com',
    uuid: '55555555-5555-4555-8555-555555555555',
    sent: 'sent',
    sentDaysAgo: 2,
    rsvp: 'yes',
    adults: 1,
  },
  {
    name: 'Família Santos',
    group: 'Família Santos',
    phone: '5545999966666',
    uuid: '66666666-6666-4666-8666-666666666666',
    sent: 'failed',
    sentDaysAgo: 1,
  },
  {
    name: 'Pedro Lima',
    phone: '5545999977777',
    uuid: '77777777-7777-4777-8777-777777777777',
    sent: 'not_sent',
  },
  {
    name: 'Família Almeida',
    group: 'Família Almeida',
    phone: '5545999988888',
    uuid: '88888888-8888-4888-8888-888888888888',
    sent: 'sent',
    sentDaysAgo: 4,
    rsvp: 'yes',
    adults: 2,
    children0to7: 2,
  },
]

async function seedGuests() {
  const [guestCount] = await db.select({ value: count() }).from(guests)
  if (Number(guestCount?.value ?? 0) > 0) {
    console.log('✓ Já existem convidados cadastrados; seed de exemplo ignorado')
    return
  }
  if (!seedSample) {
    console.log('• Seed de convidados desativado (SEED_SAMPLE=false)')
    return
  }

  for (const sample of samples) {
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
    const [guest] = await db
      .insert(guests)
      .values({
        uuid: sample.uuid,
        name: sample.name,
        phone: sample.phone,
        email: sample.email ?? null,
        groupName: sample.group ?? null,
        notes: 'Contato de exemplo criado pelo seed de desenvolvimento.',
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: guests.id })
    if (!guest) continue

    const sentAt
      = sample.sent !== 'not_sent' && sample.sentDaysAgo
        ? new Date(Date.now() - 1000 * 60 * 60 * 24 * sample.sentDaysAgo)
        : null
    const [invitation] = await db
      .insert(invitations)
      .values({
        guestId: guest.id,
        uuid: sample.uuid,
        status: sample.sent,
        sentAt,
        lastSentAt: sentAt,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: invitations.id, uuid: invitations.uuid })
    if (!invitation) continue

    if (sentAt) {
      const message = renderInviteMessage(defaultPartySettings.whatsappTemplate, {
        name: sample.name.split(' ')[0]!,
        link: `${appUrl.replace(/\/$/, '')}/convite/${invitation.uuid}`,
        settings: defaultPartySettings,
      })
      await db.insert(invitationSends).values({
        invitationId: invitation.id,
        phone: sample.phone,
        message,
        method: 'whatsapp_web',
        status: sample.sent === 'failed' ? 'failed' : 'sent',
        attempt: 1,
        sentAt,
        createdAt: sentAt,
      })
    }

    if (sample.rsvp) {
      const confirmedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
      await db.insert(rsvps).values({
        invitationId: invitation.id,
        attendanceStatus: sample.rsvp,
        adultsCount: sample.rsvp === 'yes' ? sample.adults ?? 0 : 0,
        children8to11Count: sample.rsvp === 'yes' ? sample.children8to11 ?? 0 : 0,
        children0to7Count: sample.rsvp === 'yes' ? sample.children0to7 ?? 0 : 0,
        responsibleName: sample.name,
        phone: sample.phone,
        email: sample.email ?? null,
        notes: sample.notes ?? null,
        confirmedAt,
        updatedAt: confirmedAt,
      })
    }
  }
  console.log(`✓ ${samples.length} convidados de exemplo criados`)
  console.log(`  Link de teste: ${appUrl.replace(/\/$/, '')}/convite/${samples[0]!.uuid}`)
}

async function main() {
  await seedAdmin()
  await seedSettings()
  await seedGuests()
}

main()
  .catch((error) => {
    console.error('Falha no seed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end()
  })
