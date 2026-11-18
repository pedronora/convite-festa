export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Normaliza um telefone brasileiro para o formato E.164 sem "+".
 * Ex.: "(45) 99999-8888" -> "5545999998888"
 *
 * Aceita números locais (DDD + número), com ou sem o código do país e com
 * zeros de discagem. Entradas com código internacional diferente de +55
 * são rejeitadas em vez de interpretadas como número local.
 */
export function normalizePhoneBR(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  let digits = onlyDigits(raw)
  if (!digits) return null

  if (raw.startsWith('+') || digits.startsWith('00')) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (!digits.startsWith('55')) return null
    digits = digits.slice(2)
  } else if (digits.length >= 12 && digits.startsWith('55')) {
    digits = digits.slice(2)
  }

  // Remove o zero de discagem (0 + DDD + número).
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '')

  if (digits.length !== 10 && digits.length !== 11) return null

  const ddd = Number(digits.slice(0, 2))
  if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) return null

  // Celulares brasileiros têm 11 dígitos e começam com 9 após o DDD.
  if (digits.length === 11 && digits[2] !== '9') return null

  return `55${digits}`
}

export function formatPhoneBR(value: string): string {
  const digits = onlyDigits(value)
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return value
}

export function whatsappNumber(value: string): string {
  return normalizePhoneBR(value) ?? onlyDigits(value)
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(message)}`
}

export function telUrl(phone: string): string {
  return `tel:+${whatsappNumber(phone)}`
}
