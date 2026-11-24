import { describe, expect, it } from 'vitest'
import {
  formatCentsBRL,
  formatCentsCompactBRL,
  formatCentsInput,
  parseCurrencyToCents,
} from '../shared/utils/money'

function plain(value: string): string {
  return value.replace(/\u00A0/g, ' ')
}

describe('parseCurrencyToCents', () => {
  it('aceita os formatos mais comuns no Brasil', () => {
    expect(parseCurrencyToCents('1.234,56')).toBe(123456)
    expect(parseCurrencyToCents('1234,56')).toBe(123456)
    expect(parseCurrencyToCents('1234.56')).toBe(123456)
    expect(parseCurrencyToCents('R$ 1.234,56')).toBe(123456)
    expect(parseCurrencyToCents('1234')).toBe(123400)
    expect(parseCurrencyToCents('1.234')).toBe(123400)
    expect(parseCurrencyToCents('0,99')).toBe(99)
  })

  it('aceita número em reais', () => {
    expect(parseCurrencyToCents(1234.56)).toBe(123456)
    expect(parseCurrencyToCents(0)).toBe(0)
  })

  it('rejeita entradas inválidas', () => {
    expect(parseCurrencyToCents('')).toBeNull()
    expect(parseCurrencyToCents('abc')).toBeNull()
    expect(parseCurrencyToCents('-10')).toBeNull()
    expect(parseCurrencyToCents(Number.NaN)).toBeNull()
  })
})

describe('formatação de moeda', () => {
  it('formata centavos como reais', () => {
    expect(plain(formatCentsBRL(123456))).toBe('R$ 1.234,56')
    expect(plain(formatCentsBRL(0))).toBe('R$ 0,00')
    expect(formatCentsBRL(null)).toBe('—')
  })

  it('formata o valor do input sem o símbolo', () => {
    expect(formatCentsInput(123456)).toBe('1.234,56')
    expect(formatCentsInput(null)).toBe('')
  })

  it('tem versão compacta para gráficos', () => {
    expect(plain(formatCentsCompactBRL(120_000_00))).toContain('mil')
  })
})
