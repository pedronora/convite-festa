import { describe, expect, it } from 'vitest'
import { buildCsv, CsvParseError, csvCell, detectDelimiter, parseCsv } from '../shared/utils/csv'

describe('detectDelimiter', () => {
  it('prefere ponto e vírgula no empate', () => {
    expect(detectDelimiter('Nome;Telefone')).toBe(';')
    expect(detectDelimiter('Nome,Telefone')).toBe(',')
  })

  it('ignora separadores dentro de aspas', () => {
    expect(detectDelimiter('"Nome, completo";Telefone')).toBe(';')
  })
})

describe('csvCell', () => {
  it('neutraliza fórmulas e preserva números e vazios', () => {
    expect(csvCell('=1+1')).toBe(`'=1+1`)
    expect(csvCell(0)).toBe('0')
    expect(csvCell(null)).toBe('')
  })

  it('escapa separador, aspas e quebra de linha', () => {
    expect(csvCell('a;b')).toBe(`"a;b"`)
    expect(csvCell('a"b')).toBe(`"a""b"`)
    expect(csvCell('a\nb')).toBe(`"a\nb"`)
  })
})

describe('buildCsv', () => {
  it('monta cabeçalho e linhas com CRLF', () => {
    expect(buildCsv(['Nome', 'Total'], [['Ana', 2]])).toBe('Nome;Total\r\nAna;2')
  })
})

describe('parseCsv', () => {
  it('lê cabeçalho e linhas com ponto e vírgula', () => {
    const parsed = parseCsv('Nome;Telefone\nJoão;(45) 99999-8888\nAna;(45) 98888-7777')
    expect(parsed.delimiter).toBe(';')
    expect(parsed.headers).toEqual(['Nome', 'Telefone'])
    expect(parsed.records).toEqual([
      { line: 2, cells: ['João', '(45) 99999-8888'] },
      { line: 3, cells: ['Ana', '(45) 98888-7777'] },
    ])
  })

  it('detecta vírgula como separador', () => {
    const parsed = parseCsv('Nome,Telefone\nJoão,(45) 99999-8888')
    expect(parsed.delimiter).toBe(',')
    expect(parsed.records[0]?.cells).toEqual(['João', '(45) 99999-8888'])
  })

  it('aceita BOM e CRLF', () => {
    const parsed = parseCsv('\uFEFFNome;Telefone\r\nJoão;45999998888\r\n')
    expect(parsed.headers).toEqual(['Nome', 'Telefone'])
    expect(parsed.records).toHaveLength(1)
  })

  it('respeita aspas, separador e quebra de linha dentro do campo', () => {
    const parsed = parseCsv('Nome;Observações\n"João; Silva";"Linha 1\nLinha 2"')
    expect(parsed.records[0]?.cells).toEqual(['João; Silva', 'Linha 1\nLinha 2'])
    expect(parsed.records[0]?.line).toBe(2)
  })

  it('desescapa aspas duplicadas', () => {
    const parsed = parseCsv('Nome;Observações\nJoão;"Ele disse ""oi"""')
    expect(parsed.records[0]?.cells[1]).toBe('Ele disse "oi"')
  })

  it('ignora linhas vazias e mantém a linha física', () => {
    const parsed = parseCsv('Nome;Telefone\n\nJoão;45999998888\n\nAna;45988887777')
    expect(parsed.records).toEqual([
      { line: 3, cells: ['João', '45999998888'] },
      { line: 5, cells: ['Ana', '45988887777'] },
    ])
  })

  it('recusa arquivo vazio', () => {
    expect(() => parseCsv('  \n')).toThrow(CsvParseError)
  })

  it('recusa aspas sem fechamento', () => {
    expect(() => parseCsv('Nome;Telefone\n"João;45999998888')).toThrow(CsvParseError)
  })
})
