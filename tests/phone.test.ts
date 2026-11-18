import { describe, expect, it } from 'vitest'
import {
  formatPhoneBR,
  normalizePhoneBR,
  telUrl,
  whatsappUrl,
} from '../shared/utils/phone'

describe('normalizePhoneBR', () => {
  it('normaliza telefone local com 11 dígitos para E.164', () => {
    expect(normalizePhoneBR('(45) 99999-8888')).toBe('5545999998888')
  })

  it('normaliza telefone fixo com 10 dígitos', () => {
    expect(normalizePhoneBR('45 3222-1234')).toBe('554532221234')
  })

  it('mantém números que já têm o código do país', () => {
    expect(normalizePhoneBR('+55 (45) 99999-8888')).toBe('5545999998888')
  })

  it('remove zeros de discagem no início', () => {
    expect(normalizePhoneBR('045 99999-8888')).toBe('5545999998888')
  })

  it('rejeita entradas vazias, curtas ou com DDD inválido', () => {
    expect(normalizePhoneBR('')).toBeNull()
    expect(normalizePhoneBR('9999-8888')).toBeNull()
    expect(normalizePhoneBR('(10) 99999-8888')).toBeNull()
    expect(normalizePhoneBR('123456789012345')).toBeNull()
  })

  it('rejeita código de país diferente de 55 em números longos', () => {
    expect(normalizePhoneBR('+1 202 555 0143')).toBeNull()
  })
})

describe('formatPhoneBR', () => {
  it('formata celular e fixo no padrão brasileiro', () => {
    expect(formatPhoneBR('5545999998888')).toBe('(45) 99999-8888')
    expect(formatPhoneBR('554532221234')).toBe('(45) 3222-1234')
  })

  it('devolve o valor original quando não reconhece o formato', () => {
    expect(formatPhoneBR('123')).toBe('123')
  })
})

describe('links de telefone', () => {
  it('gera link wa.me codificando a mensagem', () => {
    const url = whatsappUrl('(45) 99999-8888', 'Olá, Luigi & Marco!')
    expect(url).toBe('https://wa.me/5545999998888?text=Ol%C3%A1%2C%20Luigi%20%26%20Marco!')
  })

  it('gera link tel: com o número normalizado', () => {
    expect(telUrl('(45) 99999-8888')).toBe('tel:+5545999998888')
  })
})
