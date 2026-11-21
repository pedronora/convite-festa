import { buildInvitationLink, partyEnd } from '#shared/utils/format'
import { resolveAppBaseUrl } from '#shared/utils/social'

function icsEscape(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid') || ''
  const row = await findInvitationByUuid(uuid)
  if (!row) {
    throw createError({ statusCode: 404, message: 'Convite não encontrado' })
  }
  const settings = await getPartySettings()
  const start = new Date(settings.partyDate)
  const end = partyEnd(settings.partyDate)
  const names = settings.celebrants.map(c => c.name).join(' & ')
  const baseUrl = resolveAppBaseUrl(
    String(useRuntimeConfig().public.appUrl || ''),
    getRequestURL(event).origin,
  )
  const host = new URL(baseUrl).host
  const description = [
    `Aniversário de ${names}.`,
    `${settings.dateLabel}, às ${settings.timeLabel}.`,
    `${settings.venue} — ${settings.address}, ${settings.neighborhood}, ${settings.city} - ${settings.state}.`,
    `Confirme sua presença: ${buildInvitationLink(baseUrl, uuid)}`,
  ].join('\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Convite Festa Luigi e Marco Antonio//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uuid}@${host}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${icsEscape(`Aniversário de ${names}`)}`,
    `LOCATION:${icsEscape(`${settings.venue} — ${settings.address}, ${settings.neighborhood}, ${settings.city} - ${settings.state}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape('Festa do Luigi e do Marco Antonio')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  setResponseHeaders(event, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="festa-luigi-marco.ics"',
    'Cache-Control': 'no-store',
  })
  return ics
})
