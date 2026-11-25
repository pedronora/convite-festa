import { describe, expect, it } from 'vitest'
import {
  canonicalPhone,
  detectPhoneCountry,
  formatPhone,
  normalizePhone,
  normalizeStoredPhone,
  whatsappNumber,
} from '../shared/utils/phone'

describe('normalizePhone', () => {
  it('normaliza telefone local brasileiro com 11 dígitos para E.164', () => {
    expect(normalizePhone('(45) 99999-8888')).toBe('5545999998888')
  })

  it('normaliza telefone fixo brasileiro com 10 dígitos', () => {
    expect(normalizePhone('45 3222-1234')).toBe('554532221234')
  })

  it('mantém números que já têm o código do país', () => {
    expect(normalizePhone('+55 (45) 99999-8888')).toBe('5545999998888')
  })

  it('remove zeros de discagem no início', () => {
    expect(normalizePhone('045 99999-8888')).toBe('5545999998888')
  })

  it('aceita o DDI "00" no lugar do "+"', () => {
    expect(normalizePhone('00 54 9 11 1234 5678')).toBe('5491112345678')
  })

  it('rejeita entradas vazias, curtas ou com DDD inválido', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('9999-8888')).toBeNull()
    expect(normalizePhone('(10) 99999-8888')).toBeNull()
    expect(normalizePhone('123456789012345')).toBeNull()
  })

  it('rejeita um telefone brasileiro quando o país selecionado é outro', () => {
    expect(normalizePhone('(45) 99999-8888', 'US')).toBeNull()
  })

  it('aceita números argentinos fixos e celulares', () => {
    expect(normalizePhone('+54 9 11 1234-5678')).toBe('5491112345678')
    expect(normalizePhone('+54 11 4123-4567')).toBe('541141234567')
    expect(normalizePhone('011 15 1234-5678', 'AR')).toBe('5491112345678')
    expect(normalizePhone('11 4123-4567', 'AR')).toBe('541141234567')
  })

  it('aceita números dos Estados Unidos com e sem o código do país', () => {
    expect(normalizePhone('+1 (202) 555-0143')).toBe('12025550143')
    expect(normalizePhone('202-555-0143', 'US')).toBe('12025550143')
  })

  it('aceita outros países pela validação E.164', () => {
    expect(normalizePhone('+351 912 345 678')).toBe('351912345678')
  })

  it('aceita DDI colado sem "+" em números longos', () => {
    expect(normalizePhone('5491112345678')).toBe('5491112345678')
  })
})

describe('normalizeStoredPhone', () => {
  it('interpreta valores salvos como E.164', () => {
    expect(normalizeStoredPhone('5545999998888')).toBe('5545999998888')
    expect(normalizeStoredPhone('12025550143')).toBe('12025550143')
    expect(normalizeStoredPhone('5491112345678')).toBe('5491112345678')
  })

  it('rejeita valores inválidos', () => {
    expect(normalizeStoredPhone('')).toBeNull()
    expect(normalizeStoredPhone('123')).toBeNull()
  })
})

describe('canonicalPhone', () => {
  it('distingue número salvo de entrada local', () => {
    expect(canonicalPhone('12025550143')).toBe('12025550143')
    expect(canonicalPhone('5545999998888')).toBe('5545999998888')
    expect(canonicalPhone('(45) 99999-8888')).toBe('5545999998888')
    expect(canonicalPhone('45999998888')).toBe('5545999998888')
  })

  it('devolve null quando não reconhece o número', () => {
    expect(canonicalPhone('1234')).toBeNull()
  })
})

describe('whatsappNumber', () => {
  it('devolve o número pronto para o link', () => {
    expect(whatsappNumber('(45) 99999-8888')).toBe('5545999998888')
    expect(whatsappNumber('12025550143')).toBe('12025550143')
  })
})

describe('detectPhoneCountry', () => {
  it('descobre o país de números salvos', () => {
    expect(detectPhoneCountry('5545999998888')).toBe('BR')
    expect(detectPhoneCountry('12025550143')).toBe('US')
    expect(detectPhoneCountry('5491112345678')).toBe('AR')
  })

  it('devolve null quando não reconhece', () => {
    expect(detectPhoneCountry('123')).toBeNull()
  })
})

describe('formatPhone', () => {
  it('formata celular e fixo brasileiros no padrão nacional', () => {
    expect(formatPhone('5545999998888')).toBe('(45) 99999-8888')
    expect(formatPhone('554532221234')).toBe('(45) 3222-1234')
  })

  it('formata números internacionais no padrão internacional', () => {
    expect(formatPhone('12025550143')).toBe('+1 202 555 0143')
    expect(formatPhone('5491112345678')).toBe('+54 9 11 1234 5678')
  })

  it('devolve o valor original quando não reconhece o formato', () => {
    expect(formatPhone('123')).toBe('123')
  })
})
