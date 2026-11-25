import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js'
import { onlyDigits } from './digits'

export type { CountryCode }

/** Valores salvos no banco seguem E.164 sem o "+" (ex.: "5545999998888"). */
function looksStored(value: string): boolean {
  return /^\d{8,15}$/.test(value.trim())
}

/**
 * Normaliza um telefone digitado pelo usuário para E.164 sem "+".
 *
 * Aceita o formato nacional do país informado, o código do país com "+" ou
 * "00" e, quando o número é longo demais para ser local, um DDI colado sem o
 * "+" (útil para planilhas). A validação usa o metadata do libphonenumber.
 */
export function normalizePhone(value: string, country: CountryCode = 'BR'): string | null {
  const raw = value.trim()
  if (!raw) return null

  const digits = onlyDigits(raw)
  if (!digits) return null

  const explicitInternational = raw.startsWith('+') || raw.startsWith('00')
  const text = raw.startsWith('00') ? `+${digits.slice(2)}` : raw

  let parsed = parsePhoneNumberFromString(text, explicitInternational ? undefined : country)

  if (!parsed?.isValid() && !explicitInternational) {
    if (country === 'BR') {
      const withoutTrunk = digits.replace(/^0+/, '')
      if (withoutTrunk !== digits) {
        parsed = parsePhoneNumberFromString(withoutTrunk, 'BR')
      }
    }

    // Números colados com DDI mas sem "+" (ex.: "5491112345678" em um CSV).
    if (!parsed?.isValid() && digits.length >= 12) {
      parsed = parsePhoneNumberFromString(`+${digits}`)
    }
  }

  if (!parsed?.isValid()) return null
  // O libphonenumber aceita DDDs abaixo de 11 (ex.: 10), que não são atribuídos
  // no Brasil; mantemos a regra brasileira de DDD válido.
  if (parsed.country === 'BR' && Number(parsed.nationalNumber.slice(0, 2)) < 11) return null
  return parsed.number.slice(1)
}

/** Interpreta um valor já salvo (E.164 sem "+") e devolve o E.164 canônico. */
export function normalizeStoredPhone(value: string): string | null {
  const digits = onlyDigits(value)
  if (!digits) return null
  const parsed = parsePhoneNumberFromString(`+${digits}`)
  if (!parsed?.isValid()) return null
  if (parsed.country === 'BR' && Number(parsed.nationalNumber.slice(0, 2)) < 11) return null
  return parsed.number.slice(1)
}

/**
 * Resolve um valor que pode ser um telefone salvo (só dígitos, com DDI) ou uma
 * entrada local digitada pelo usuário (com máscara ou sem DDI).
 */
export function canonicalPhone(value: string): string | null {
  if (looksStored(value)) {
    const stored = normalizeStoredPhone(value)
    if (stored) return stored
  }
  return normalizePhone(value, 'BR')
}

/**
 * Formata para exibição: Brasil no padrão nacional "`(45) 99999-8888`" e os
 * demais países no padrão internacional "`+1 202 555 0143`".
 */
export function formatPhone(value: string): string {
  const digits = canonicalPhone(value)
  if (!digits) return value

  const parsed = parsePhoneNumberFromString(`+${digits}`)
  if (!parsed) return value

  return parsed.country === 'BR' ? parsed.formatNational() : parsed.formatInternational()
}

/** Descobre o país de um telefone salvo ou digitado (para pré-selecionar o seletor). */
export function detectPhoneCountry(value: string): CountryCode | null {
  const digits = canonicalPhone(value)
  if (!digits) return null
  return parsePhoneNumberFromString(`+${digits}`)?.country ?? null
}

/** Número pronto para os links do WhatsApp (E.164 sem "+"). */
export function whatsappNumber(value: string): string {
  return canonicalPhone(value) ?? onlyDigits(value)
}
