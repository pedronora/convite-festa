import type { GuestImportAccepted, GuestImportResult, GuestImportSkipped } from '../types'
import {
  GUEST_IMPORT_COLUMNS,
  GUEST_IMPORT_MAX_ROWS,
  normalizeGuestImportHeader,
  type GuestImportField,
} from '../config/guest-import'
import { guestInputSchema, zodMessage } from '../validation'
import { normalizePhone, normalizeStoredPhone } from './phone'
import type { ParsedCsv } from './csv'

export type GuestImportErrorCode = 'missing_headers' | 'too_many_rows'

export class GuestImportError extends Error {
  readonly code: GuestImportErrorCode
  readonly missing: string[]

  constructor(code: GuestImportErrorCode, message: string, missing: string[] = []) {
    super(message)
    this.name = 'GuestImportError'
    this.code = code
    this.missing = missing
  }
}

export interface ExistingGuest {
  phone: string
  name: string
}

const FIELD_BY_HEADER = new Map<string, GuestImportField>()
for (const column of GUEST_IMPORT_COLUMNS) {
  for (const alias of [column.label, ...column.aliases]) {
    FIELD_BY_HEADER.set(normalizeGuestImportHeader(alias), column.key)
  }
}

function headerIndexes(headers: string[]): Map<GuestImportField, number> {
  const indexes = new Map<GuestImportField, number>()
  headers.forEach((header, index) => {
    const field = FIELD_BY_HEADER.get(normalizeGuestImportHeader(header))
    if (field && !indexes.has(field)) indexes.set(field, index)
  })

  const missing = GUEST_IMPORT_COLUMNS
    .filter(column => column.required && !indexes.has(column.key))
    .map(column => column.label)
  if (missing.length) {
    throw new GuestImportError(
      'missing_headers',
      `Cabeçalhos obrigatórios ausentes: ${missing.join(', ')}.`,
      missing,
    )
  }

  return indexes
}

/**
 * Valida as linhas e separa o que pode ser importado do que deve ser
 * ignorado. Duplicidade é decidida pelo telefone normalizado: primeiro
 * dentro do arquivo, depois contra os convidados já cadastrados.
 */
export function planGuestImport(csv: ParsedCsv, existing: ExistingGuest[]): GuestImportResult {
  const indexes = headerIndexes(csv.headers)
  if (csv.records.length > GUEST_IMPORT_MAX_ROWS) {
    throw new GuestImportError(
      'too_many_rows',
      `Envie no máximo ${GUEST_IMPORT_MAX_ROWS} linhas por arquivo.`,
    )
  }

  const existingByPhone = new Map<string, string>()
  for (const guest of existing) {
    const phone = normalizeStoredPhone(guest.phone)
    if (phone && !existingByPhone.has(phone)) existingByPhone.set(phone, guest.name)
  }

  const seenPhones = new Map<string, number>()
  const imported: GuestImportAccepted[] = []
  const skipped: GuestImportSkipped[] = []

  for (const record of csv.records) {
    const cell = (field: GuestImportField): string => {
      const index = indexes.get(field)
      return index === undefined ? '' : (record.cells[index] ?? '').trim()
    }

    const maxGuests = cell('maxGuests')
    const estimatedGuests = cell('estimatedGuests')
    const raw = {
      name: cell('name'),
      phone: cell('phone'),
      email: cell('email'),
      groupName: cell('groupName'),
      notes: cell('notes'),
      maxGuests: maxGuests === '' ? null : maxGuests,
      estimatedGuests: estimatedGuests === '' ? null : estimatedGuests,
    }
    const parsed = guestInputSchema.safeParse(raw)
    const name = raw.name || '—'
    const phone = raw.phone || '—'

    if (!parsed.success) {
      skipped.push({ line: record.line, name, phone, reason: zodMessage(parsed.error) })
      continue
    }

    const normalizedPhone = normalizePhone(parsed.data.phone, parsed.data.phoneCountry)
    if (!normalizedPhone) {
      skipped.push({ line: record.line, name, phone, reason: 'Telefone inválido' })
      continue
    }

    const firstLine = seenPhones.get(normalizedPhone)
    if (firstLine) {
      skipped.push({
        line: record.line,
        name,
        phone,
        reason: `Telefone repetido no arquivo (linha ${firstLine})`,
      })
      continue
    }

    const existingName = existingByPhone.get(normalizedPhone)
    if (existingName) {
      skipped.push({
        line: record.line,
        name,
        phone,
        reason: `Já cadastrado como ${existingName}`,
      })
      continue
    }

    seenPhones.set(normalizedPhone, record.line)
    imported.push({
      line: record.line,
      name: parsed.data.name,
      phone: normalizedPhone,
      groupName: parsed.data.groupName,
      email: parsed.data.email,
      notes: parsed.data.notes,
      maxGuests: parsed.data.maxGuests ?? null,
      estimatedGuests: parsed.data.estimatedGuests ?? null,
    })
  }

  return { total: csv.records.length, imported, skipped }
}
