const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Formata centavos como moeda brasileira: 123456 -> R$ 1.234,56. */
export function formatCentsBRL(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—'
  return brlFormatter.format(cents / 100)
}

/** Versão compacta para eixos e espaços pequenos: R$ 1,2 mil. */
export function formatCentsCompactBRL(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—'
  return compactFormatter.format(cents / 100)
}

/** Valor sem o símbolo, para preencher o input: 123456 -> 1.234,56. */
export function formatCentsInput(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return ''
  return decimalFormatter.format(cents / 100)
}

/**
 * Converte texto digitado em centavos. Aceita os formatos mais comuns no
 * Brasil: "1.234,56", "1234,56", "1234.56", "R$ 1.234,56" e "1234".
 * Retorna null para entrada inválida ou negativa.
 */
export function parseCurrencyToCents(input: string | number | null | undefined): number | null {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) return null
    return Math.round(input * 100)
  }
  if (input == null) return null

  let value = input.trim().replace(/\s/g, '').replace(/^R\$/i, '')
  if (!value) return null
  if (value.startsWith('-')) return null
  value = value.replace(/-/g, '')

  const hasComma = value.includes(',')
  const hasDot = value.includes('.')

  if (hasComma && hasDot) {
    value = value.replace(/\./g, '').replace(',', '.')
  }
  else if (hasComma) {
    value = value.replace(',', '.')
  }
  else if (hasDot) {
    const parts = value.split('.')
    const last = parts[parts.length - 1] ?? ''
    const isThousands = parts.length > 2 || (last.length === 3 && parts[0]!.length <= 3)
    value = isThousands ? parts.join('') : `${parts.slice(0, -1).join('')}.${last}`
  }

  if (!/^\d+(\.\d+)?$/.test(value)) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}
