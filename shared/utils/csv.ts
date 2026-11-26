export type CsvErrorCode = 'empty' | 'unterminated_quote'

export class CsvParseError extends Error {
  readonly code: CsvErrorCode

  constructor(code: CsvErrorCode, message: string) {
    super(message)
    this.name = 'CsvParseError'
    this.code = code
  }
}

export interface CsvRecord {
  /** Linha física do arquivo onde o registro começa (1 = cabeçalho). */
  line: number
  cells: string[]
}

export interface ParsedCsv {
  delimiter: ';' | ','
  headers: string[]
  records: CsvRecord[]
}

function firstLine(text: string): string {
  const index = text.search(/\r?\n/)
  return index === -1 ? text : text.slice(0, index)
}

/**
 * Escolhe o separador contando `;` e `,` fora de aspas na primeira linha.
 * Empate fica com `;`, o padrão do Excel em português.
 */
export function detectDelimiter(line: string): ';' | ',' {
  let semicolons = 0
  let commas = 0
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        index++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (inQuotes) continue
    if (char === ';') semicolons++
    else if (char === ',') commas++
  }

  return semicolons >= commas ? ';' : ','
}

/**
 * Parser CSV mínimo no padrão RFC 4180: aceita BOM, CRLF/LF, campos entre
 * aspas, `""` escapado e quebra de linha dentro de aspas. Linhas vazias são
 * ignoradas e cada registro guarda a linha física de origem.
 */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^\uFEFF/, '')
  if (!text.trim()) throw new CsvParseError('empty', 'O arquivo está vazio.')

  const delimiter = detectDelimiter(firstLine(text))
  const records: CsvRecord[] = []
  let field = ''
  let cells: string[] = []
  let inQuotes = false
  let line = 1
  let rowLine = 1
  let index = 0

  function endRow(): void {
    cells.push(field)
    field = ''
    if (cells.some(cell => cell.trim() !== '')) {
      records.push({ line: rowLine, cells })
    }
    cells = []
  }

  while (index < text.length) {
    const char = text[index]!

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index++
        continue
      }
      if (char === '\n') line++
      field += char
      index++
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      index++
      continue
    }
    if (char === delimiter) {
      cells.push(field)
      field = ''
      index++
      continue
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && text[index + 1] === '\n') index++
      index++
      endRow()
      line++
      rowLine = line
      continue
    }

    field += char
    index++
  }

  if (inQuotes) {
    throw new CsvParseError('unterminated_quote', 'Há aspas abertas sem fechamento no arquivo.')
  }
  if (field !== '' || cells.length > 0) endRow()
  if (!records.length) throw new CsvParseError('empty', 'O arquivo não tem linhas para importar.')

  const [headerRecord, ...dataRecords] = records
  if (!headerRecord) throw new CsvParseError('empty', 'O arquivo não tem cabeçalho.')

  return {
    delimiter,
    headers: headerRecord.cells.map(cell => cell.trim()),
    records: dataRecords,
  }
}

/**
 * Escapa uma célula no padrão do Excel em português: neutraliza fórmulas de
 * planilha e coloca entre aspas quando há separador, aspas ou quebra de linha.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  if (/[;"\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

/** Monta um CSV com `;` e CRLF, sem BOM. */
export function buildCsv(header: readonly unknown[], rows: readonly (readonly unknown[])[]): string {
  return [header, ...rows]
    .map(row => row.map(csvCell).join(';'))
    .join('\r\n')
}
