import 'dotenv/config'
import { count, eq } from 'drizzle-orm'
import { createDatabase } from '../server/database/client'
import {
  adminUsers,
  contractPayments,
  contracts,
  guests,
  invitationSends,
  invitations,
  partySettings,
  rsvps,
} from '../server/database/schema'
import { hashPassword } from '../server/utils/password'
import { defaultPartySettings } from '../shared/config/party'
import { addDaysToDateOnly, renderInviteMessage, todayInSaoPaulo } from '../shared/utils/format'
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

interface FinanceSample {
  supplierName: string
  category: 'espaco' | 'buffet' | 'bebidas' | 'bolo_doces' | 'decoracao' | 'fotografia' | 'musica_animacao' | 'convites' | 'outros'
  contact: string
  description: string
  totalCents: number
  notes?: string
  payments: Array<{
    label: string
    amountCents: number
    dueInDays: number
    paidInDays?: number
    method?: 'pix' | 'transferencia' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto' | 'outro'
  }>
}

const financeSamples: FinanceSample[] = [
  {
    supplierName: 'Sabor da Festa Buffet',
    category: 'buffet',
    contact: 'Ana Paula · (45) 99999-1010',
    description: 'Buffet completo para 80 convidados, incluindo salgados, doces, bebidas não alcoólicas e equipe de apoio.',
    totalCents: 480_000,
    notes: 'Cardápio fechado em reunião. Confirmar número final de pessoas uma semana antes.',
    payments: [
      { label: 'Entrada', amountCents: 160_000, dueInDays: -35, paidInDays: -35, method: 'pix' },
      { label: 'Parcela 2/3', amountCents: 160_000, dueInDays: 3, method: 'transferencia' },
      { label: 'Parcela 3/3', amountCents: 160_000, dueInDays: 35, method: 'pix' },
    ],
  },
  {
    supplierName: 'Ateliê Aranha Decoração',
    category: 'decoracao',
    contact: 'Marcos · (45) 98888-2020',
    description: 'Decoração temática do Homem-Aranha, painel de fundo, balões e mesa dos aniversariantes.',
    totalCents: 220_000,
    notes: 'Montagem a partir das 10h. Retirada no mesmo dia após a festa.',
    payments: [
      { label: 'Sinal', amountCents: 110_000, dueInDays: -25, paidInDays: -25, method: 'pix' },
      { label: 'Saldo na montagem', amountCents: 110_000, dueInDays: -5, method: 'dinheiro' },
    ],
  },
  {
    supplierName: 'Click Feliz Fotografia',
    category: 'fotografia',
    contact: 'Juliana · (45) 97777-3030',
    description: 'Cobertura fotográfica de 4 horas e entrega de 200 fotos tratadas em galeria digital.',
    totalCents: 180_000,
    payments: [
      { label: 'Reserva de data', amountCents: 90_000, dueInDays: -18, paidInDays: -18, method: 'transferencia' },
      { label: 'Saldo', amountCents: 90_000, dueInDays: 20, method: 'pix' },
    ],
  },
  {
    supplierName: 'Doce Teia Confeitaria',
    category: 'bolo_doces',
    contact: 'Camila · (45) 96666-4040',
    description: 'Bolo temático de 3 andares e mesa de doces finos para 80 pessoas.',
    totalCents: 95_000,
    notes: 'Ainda sem parcelas cadastradas: o saldo aparece como “sem parcelamento” no painel.',
    payments: [],
  },
  {
    supplierName: 'Salão Teia de Heróis',
    category: 'espaco',
    contact: 'Recepção · (45) 95555-5050',
    description: 'Locação do salão por 6 horas, com mesas, cadeiras, som básico e estacionamento.',
    totalCents: 350_000,
    notes: 'Contrato quitado. Entrada liberada às 9h para a equipe de decoração.',
    payments: [
      { label: 'Entrada', amountCents: 175_000, dueInDays: -40, paidInDays: -40, method: 'pix' },
      { label: 'Saldo', amountCents: 175_000, dueInDays: -10, paidInDays: -10, method: 'transferencia' },
    ],
  },
  {
    supplierName: 'DJ Teioso',
    category: 'musica_animacao',
    contact: 'Rafael · (45) 94444-6060',
    description: 'Som, iluminação e animação infantil por 5 horas.',
    totalCents: 120_000,
    payments: [
      { label: 'Pagamento único', amountCents: 120_000, dueInDays: 45, method: 'pix' },
    ],
  },
]

async function seedFinances() {
  const [contractCount] = await db.select({ value: count() }).from(contracts)
  if (Number(contractCount?.value ?? 0) > 0) {
    console.log('✓ Já existem contratos cadastrados; seed financeiro ignorado')
    return
  }
  if (!seedSample) {
    console.log('• Seed financeiro desativado (SEED_SAMPLE=false)')
    return
  }

  const today = todayInSaoPaulo()
  for (const sample of financeSamples) {
    const [contract] = await db
      .insert(contracts)
      .values({
        supplierName: sample.supplierName,
        category: sample.category,
        contact: sample.contact,
        description: sample.description,
        totalCents: sample.totalCents,
        notes: sample.notes ?? null,
      })
      .returning({ id: contracts.id })
    if (!contract) continue

    for (const payment of sample.payments) {
      const dueDate = addDaysToDateOnly(today, payment.dueInDays)
      const paidOn = payment.paidInDays === undefined
        ? null
        : addDaysToDateOnly(today, payment.paidInDays)
      if (!dueDate || (payment.paidInDays !== undefined && !paidOn)) continue
      await db.insert(contractPayments).values({
        contractId: contract.id,
        label: payment.label,
        amountCents: payment.amountCents,
        dueDate,
        paidOn,
        method: payment.method ?? null,
      })
    }
  }
  console.log(`✓ ${financeSamples.length} fornecedores de exemplo com parcelas criados`)
}

async function main() {
  await seedAdmin()
  await seedSettings()
  await seedGuests()
  await seedFinances()
}

main()
  .catch((error) => {
    console.error('Falha no seed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end()
  })
