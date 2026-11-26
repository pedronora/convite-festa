import { buildCsv } from './csv'

export interface GuestReportRow {
  guestName: string
  groupName: string | null
  responsibleName: string | null
  attendanceStatus: 'yes' | 'no' | null
  estimatedGuests: number | null
  adults: number | null
  children8to11: number | null
  children0to7: number | null
}

export const GUEST_REPORT_HEADER = [
  'Nome do responsável',
  'Grupo/Família',
  'Status',
  '# convidados',
  'Adultos',
  'Crianças 8–11',
  'Crianças 0–7',
  'Total confirmados',
] as const

const STATUS_LABEL: Record<'yes' | 'no', string> = {
  yes: 'Confirmado',
  no: 'Não comparecerá',
}

export function guestReportStatus(status: GuestReportRow['attendanceStatus']): string {
  return status ? STATUS_LABEL[status] : 'Não confirmado'
}

/**
 * Gera o relatório de confirmações: uma linha por convite, com o responsável,
 * o grupo, o status, a estimativa inicial e as pessoas confirmadas por faixa.
 */
export function buildGuestReportCsv(rows: readonly GuestReportRow[]): string {
  const body = rows.map((row) => {
    const confirmed = row.attendanceStatus === 'yes'
    const adults = confirmed ? row.adults ?? 0 : 0
    const children8to11 = confirmed ? row.children8to11 ?? 0 : 0
    const children0to7 = confirmed ? row.children0to7 ?? 0 : 0

    return [
      row.responsibleName?.trim() || row.guestName,
      row.groupName?.trim() || '',
      guestReportStatus(row.attendanceStatus),
      row.estimatedGuests ?? '',
      adults,
      children8to11,
      children0to7,
      adults + children8to11 + children0to7,
    ]
  })

  return buildCsv(GUEST_REPORT_HEADER, body)
}
