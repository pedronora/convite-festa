export type GuestImportField = 'name' | 'phone' | 'groupName' | 'email' | 'notes' | 'maxGuests' | 'estimatedGuests'

export interface GuestImportColumn {
  key: GuestImportField
  label: string
  required: boolean
  aliases: string[]
}

/**
 * Colunas aceitas na planilha de importação. O cabeçalho é comparado sem
 * acento, sem caixa e com espaços normalizados; os aliases cobrem as
 * variações mais comuns de planilhas em português e inglês.
 */
export const GUEST_IMPORT_COLUMNS: readonly GuestImportColumn[] = [
  {
    key: 'name',
    label: 'Nome',
    required: true,
    aliases: ['nome', 'name', 'convidado'],
  },
  {
    key: 'phone',
    label: 'Telefone',
    required: true,
    aliases: ['telefone', 'whatsapp', 'celular', 'phone'],
  },
  {
    key: 'groupName',
    label: 'Família/Grupo',
    required: false,
    aliases: ['familia/grupo', 'familia', 'grupo', 'group', 'family'],
  },
  {
    key: 'email',
    label: 'E-mail',
    required: false,
    aliases: ['e-mail', 'email'],
  },
  {
    key: 'notes',
    label: 'Observações',
    required: false,
    aliases: ['observacoes', 'notas', 'observacoes internas'],
  },
  {
    key: 'maxGuests',
    label: 'Limite de pessoas',
    required: false,
    aliases: ['limite de pessoas', 'limite', 'max guests'],
  },
  {
    key: 'estimatedGuests',
    label: 'Convidados estimados',
    required: false,
    aliases: ['convidados estimados', 'estimativa', 'estimated guests'],
  },
]

export const GUEST_IMPORT_MAX_ROWS = 500

/** Modelo para download: apenas o cabeçalho, sem linha de exemplo. */
export const GUEST_IMPORT_TEMPLATE = `${GUEST_IMPORT_COLUMNS.map(column => column.label).join(';')}\r\n`

export function normalizeGuestImportHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}
