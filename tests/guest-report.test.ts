import { describe, expect, it } from 'vitest'
import { buildGuestReportCsv, GUEST_REPORT_HEADER, guestReportStatus, type GuestReportRow } from '../shared/utils/guest-report'

const base: GuestReportRow = {
  guestName: 'João Silva',
  groupName: 'Família Silva',
  responsibleName: 'João Silva',
  attendanceStatus: 'yes',
  estimatedGuests: 4,
  adults: 2,
  children8to11: 1,
  children0to7: 2,
}

describe('guestReportStatus', () => {
  it('mapeia os três estados do relatório', () => {
    expect(guestReportStatus('yes')).toBe('Confirmado')
    expect(guestReportStatus('no')).toBe('Não comparecerá')
    expect(guestReportStatus(null)).toBe('Não confirmado')
  })
})

describe('buildGuestReportCsv', () => {
  it('monta o cabeçalho e as colunas na ordem', () => {
    const csv = buildGuestReportCsv([base])
    const [header, line] = csv.split('\r\n')
    expect(header).toBe(GUEST_REPORT_HEADER.join(';'))
    expect(line).toBe('João Silva;Família Silva;Confirmado;4;2;1;2;5')
  })

  it('zera as categorias quando o convidado não comparecerá', () => {
    const csv = buildGuestReportCsv([{ ...base, attendanceStatus: 'no' }])
    expect(csv.split('\r\n')[1]).toBe('João Silva;Família Silva;Não comparecerá;4;0;0;0;0')
  })

  it('usa o convidado como responsável e zera as categorias sem RSVP', () => {
    const csv = buildGuestReportCsv([{
      ...base,
      responsibleName: null,
      attendanceStatus: null,
      adults: null,
      children8to11: null,
      children0to7: null,
    }])
    expect(csv.split('\r\n')[1]).toBe('João Silva;Família Silva;Não confirmado;4;0;0;0;0')
  })

  it('prefere o nome do RSVP e cai para o convidado quando ele está vazio', () => {
    const withResponsible = buildGuestReportCsv([{ ...base, responsibleName: 'Maria Silva' }])
    const withBlankResponsible = buildGuestReportCsv([{ ...base, responsibleName: '   ' }])
    expect(withResponsible.split('\r\n')[1]?.startsWith('Maria Silva;')).toBe(true)
    expect(withBlankResponsible.split('\r\n')[1]?.startsWith('João Silva;')).toBe(true)
  })

  it('deixa a estimativa vazia quando não informada', () => {
    const csv = buildGuestReportCsv([{ ...base, estimatedGuests: null }])
    expect(csv.split('\r\n')[1]).toBe('João Silva;Família Silva;Confirmado;;2;1;2;5')
  })

  it('escapa fórmulas, separador, aspas e quebra de linha', () => {
    const formula = buildGuestReportCsv([{ ...base, responsibleName: '=SUM(A1)', groupName: 'Família; Silva' }])
    const quoted = buildGuestReportCsv([{ ...base, responsibleName: 'João "Jota"\nSilva' }])

    expect(formula.split('\r\n')[1]).toBe(`'=SUM(A1);"Família; Silva";Confirmado;4;2;1;2;5`)
    expect(quoted.split('\r\n')[1]).toBe(`"João ""Jota""\nSilva";Família Silva;Confirmado;4;2;1;2;5`)
  })
})
