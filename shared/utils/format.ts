import type { PartySettings } from '../config/party'
import { defaultPartySettings } from '../config/party'

const TIME_ZONE = 'America/Sao_Paulo'

export function formatDateLong(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** Data curta sem ano, no fuso da festa. */
export function formatDayMonth(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Converte uma data sem hora (YYYY-MM-DD) em Date UTC. Retorna null para
 * datas inválidas, incluindo dias que não existem (ex.: 2026-02-31).
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = DATE_ONLY_PATTERN.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

/** Formata uma data sem hora (YYYY-MM-DD) sem deslocar o dia pelo fuso. */
export function formatDateOnly(value: string | null | undefined): string {
  const date = parseDateOnly(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Data sem hora por extenso: 2026-01-23 -> 23 de janeiro de 2026. */
export function formatDateOnlyLong(value: string | null | undefined): string {
  const date = parseDateOnly(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Rótulo curto de um mês YYYY-MM: 2026-01 -> jan/26. */
export function formatMonthShort(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim())
  if (!match) return '—'
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return '—'
  const date = new Date(Date.UTC(year, month - 1, 1))
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: 'UTC',
  }).format(date).replace('.', '')
  return `${label}/${String(year).slice(-2)}`
}

/** Data de hoje (YYYY-MM-DD) no fuso da festa, independente do fuso do servidor. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIME_ZONE,
  }).format(now)
}

/** Extrai a data sem hora de um timestamp ISO no fuso da festa. */
export function toDateOnlyInSaoPaulo(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** Diferença em dias entre duas datas sem hora. Positivo quando `to` é futuro. */
export function daysBetweenDateOnly(from: string | null | undefined, to: string | null | undefined): number | null {
  const start = parseDateOnly(from)
  const end = parseDateOnly(to)
  if (!start || !end) return null
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/** Soma dias a uma data sem hora, preservando o formato YYYY-MM-DD. */
export function addDaysToDateOnly(value: string | null | undefined, days: number): string | null {
  const date = parseDateOnly(value)
  if (!date || !Number.isInteger(days)) return null
  return new Date(date.getTime() + days * 86_400_000).toISOString().slice(0, 10)
}

/** Soma meses a uma data sem hora, ajustando o dia para o fim do mês quando necessário. */
export function addMonthsToDateOnly(value: string | null | undefined, months: number): string | null {
  const date = parseDateOnly(value)
  if (!date || !Number.isInteger(months)) return null
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return target.toISOString().slice(0, 10)
}

export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
  return parts.replace(' ', 'T')
}

export function fromDateTimeLocalValue(value: string): string {
  // O input datetime-local é interpretado no fuso de Brasília (UTC-3).
  return `${value}:00-03:00`
}

export function partyEnd(iso: string, hours = 4): Date {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000)
}

function googleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function googleCalendarUrl(settings: PartySettings, invitationUuid?: string): string {
  const start = new Date(settings.partyDate)
  const end = partyEnd(settings.partyDate)
  const celebrants = settings.celebrants.map(c => `${c.name} (${c.age} ${c.age === 1 ? 'ano' : 'anos'})`).join(' e ')
  const details = `Aniversário de ${celebrants}. Confirme sua presença pelo convite individual.`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Aniversário de ${settings.celebrants.map(c => c.name).join(' & ')}`,
    dates: `${googleDate(start)}/${googleDate(end)}`,
    details: invitationUuid ? `${details}\nConvite: ${invitationUuid}` : details,
    location: `${settings.venue} — ${settings.address}, ${settings.neighborhood}, ${settings.city} - ${settings.state}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function mapsUrl(settings: PartySettings): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapsQuery)}`
}

export interface MessageVariables {
  name: string
  link: string
  settings: PartySettings
  /** Família/grupo do convidado. Sem grupo, [GRUPO] usa o nome. */
  groupName?: string | null
}

/**
 * Substitui marcadores tipo [Nome], [GRUPO], [LINK], [DATA], [HORARIO],
 * [LOCAL], [ENDERECO] e [CIDADE] no modelo de mensagem.
 */
export function renderInviteMessage(template: string, vars: MessageVariables): string {
  const { settings } = vars
  const tokens: Record<string, string> = {
    nome: vars.name,
    grupo: vars.groupName?.trim() || vars.name,
    link: vars.link,
    festa: settings.celebrants.map(c => c.name).join(' e '),
    data: settings.dateLabel,
    horario: settings.timeLabel,
    local: settings.venue,
    endereco: settings.address,
    cidade: `${settings.city} — ${settings.state}`,
  }
  return template.replace(/\[([a-zç]+)\]/gi, (match, key: string) => {
    return tokens[key.toLowerCase()] ?? match
  })
}

/**
 * Link individual entregue ao convidado. A âncora leva direto ao formulário
 * de confirmação, para o convidado não precisar rolar a página inteira.
 */
export function buildInvitationLink(appUrl: string, uuid: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/convite/${uuid}#rsvp`
}

export function whatsappPreview(settings: PartySettings, name: string, link: string): string {
  return renderInviteMessage(settings.whatsappTemplate, { name, link, settings })
}

export function inviteeFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

/** Rótulo de idade usado nos convites: 1 vira "1 aninho". */
export function celebrantAgeLabel(age: number): string {
  return age === 1 ? '1 aninho' : `${age} anos`
}

export function celebrantsAgesLabel(celebrants: Array<{ age: number }>): string {
  return celebrants.map(celebrant => celebrantAgeLabel(celebrant.age)).join(' & ')
}

export function celebrantNames(celebrants: Array<{ name: string }>): string {
  return celebrants.map(celebrant => celebrant.name).join(' e ')
}

export function guestsSummary(adults: number, children8to11: number, children0to7: number): string {
  const parts: string[] = []
  if (adults) parts.push(`${adults} ${adults === 1 ? 'adulto' : 'adultos'}`)
  if (children8to11) parts.push(`${children8to11} ${children8to11 === 1 ? 'criança de 8 a 11 anos' : 'crianças de 8 a 11 anos'}`)
  if (children0to7) parts.push(`${children0to7} ${children0to7 === 1 ? 'criança de 0 a 7 anos' : 'crianças de 0 a 7 anos'}`)
  return parts.join(' · ')
}

export function totalGuests(adults: number, children8to11: number, children0to7: number): number {
  return adults + children8to11 + children0to7
}

/** Limite efetivo do convite: o individual tem prioridade sobre o padrão global. */
export function resolveGuestLimit(
  maxGuests: number | null | undefined,
  defaultLimit: number | null | undefined,
): number | null {
  return maxGuests ?? defaultLimit ?? null
}

export function exceedsGuestLimit(total: number, limit: number | null | undefined): boolean {
  return typeof limit === 'number' && limit > 0 && total > limit
}

export { defaultPartySettings }
