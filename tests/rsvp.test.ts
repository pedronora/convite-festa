import { describe, expect, it } from 'vitest'
import {
  exceedsGuestLimit,
  guestsSummary,
  resolveGuestLimit,
  totalGuests,
} from '../shared/utils/format'
import { rsvpInputSchema } from '../shared/validation'

const base = {
  attendanceStatus: 'yes' as const,
  responsibleName: 'Maria da Silva',
  phone: '(45) 99999-8888',
  email: '',
  adults: 2,
  children8to11: 1,
  children0to7: 1,
  notes: '',
}

describe('rsvpInputSchema', () => {
  it('aceita confirmação com pelo menos uma pessoa', () => {
    const parsed = rsvpInputSchema.safeParse(base)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.email).toBeNull()
      expect(parsed.data.notes).toBeNull()
      expect(parsed.data.phone).toBe('(45) 99999-8888')
    }
  })

  it('aceita recusa mesmo com todas as quantidades zeradas', () => {
    const parsed = rsvpInputSchema.safeParse({
      ...base,
      attendanceStatus: 'no',
      adults: 0,
      children8to11: 0,
      children0to7: 0,
    })
    expect(parsed.success).toBe(true)
  })

  it('rejeita confirmação sem nenhuma pessoa', () => {
    const parsed = rsvpInputSchema.safeParse({
      ...base,
      adults: 0,
      children8to11: 0,
      children0to7: 0,
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe('Confirme ao menos uma pessoa para participar')
    }
  })

  it('rejeita quantidades negativas ou fracionadas', () => {
    expect(rsvpInputSchema.safeParse({ ...base, adults: -1 }).success).toBe(false)
    expect(rsvpInputSchema.safeParse({ ...base, adults: 1.5 }).success).toBe(false)
  })

  it('rejeita telefone inválido e e-mail malformado', () => {
    expect(rsvpInputSchema.safeParse({ ...base, phone: '1234' }).success).toBe(false)
    expect(rsvpInputSchema.safeParse({ ...base, email: 'maria@' }).success).toBe(false)
  })

  it('aceita telefone internacional com o país selecionado', () => {
    expect(rsvpInputSchema.safeParse({
      ...base,
      phone: '11 4123-4567',
      phoneCountry: 'AR',
    }).success).toBe(true)
    expect(rsvpInputSchema.safeParse({
      ...base,
      phone: '202-555-0143',
      phoneCountry: 'US',
    }).success).toBe(true)
  })

  it('usa o Brasil como país padrão e rejeita país desconhecido', () => {
    const parsed = rsvpInputSchema.safeParse(base)
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.phoneCountry).toBe('BR')
    expect(rsvpInputSchema.safeParse({ ...base, phoneCountry: 'XX' }).success).toBe(false)
  })

  it('rejeita telefone brasileiro quando o país selecionado é outro', () => {
    expect(rsvpInputSchema.safeParse({
      ...base,
      phone: '(45) 99999-8888',
      phoneCountry: 'US',
    }).success).toBe(false)
  })

  it('normaliza e-mail para minúsculas', () => {
    const parsed = rsvpInputSchema.safeParse({ ...base, email: 'Maria@Exemplo.COM' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('maria@exemplo.com')
  })

  it('rejeita status de presença inválido', () => {
    expect(rsvpInputSchema.safeParse({ ...base, attendanceStatus: 'talvez' }).success).toBe(false)
  })
})

describe('totais e limite de convidados', () => {
  it('soma adultos e crianças das duas faixas', () => {
    expect(totalGuests(2, 1, 3)).toBe(6)
    expect(totalGuests(0, 0, 0)).toBe(0)
  })

  it('prioriza o limite individual sobre o padrão global', () => {
    expect(resolveGuestLimit(4, 6)).toBe(4)
    expect(resolveGuestLimit(null, 6)).toBe(6)
    expect(resolveGuestLimit(undefined, null)).toBeNull()
  })

  it('detecta quando o total ultrapassa o limite', () => {
    expect(exceedsGuestLimit(3, 4)).toBe(false)
    expect(exceedsGuestLimit(4, 4)).toBe(false)
    expect(exceedsGuestLimit(5, 4)).toBe(true)
    expect(exceedsGuestLimit(10, null)).toBe(false)
  })

  it('descreve o grupo de convidados em português', () => {
    expect(guestsSummary(1, 1, 0)).toBe('1 adulto · 1 criança de 8 a 11 anos')
    expect(guestsSummary(2, 0, 3)).toBe('2 adultos · 3 crianças de 0 a 7 anos')
    expect(guestsSummary(0, 0, 0)).toBe('')
  })
})
