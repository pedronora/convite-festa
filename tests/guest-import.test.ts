import { describe, expect, it } from 'vitest'
import { parseCsv } from '../shared/utils/csv'
import { GuestImportError, planGuestImport, type ExistingGuest } from '../shared/utils/guest-import'

function plan(rows: string, existing: ExistingGuest[] = []) {
  return planGuestImport(parseCsv(rows), existing)
}

const HEADER = 'Nome;Telefone;Família/Grupo;E-mail;Observações;Limite de pessoas;Convidados estimados'

describe('planGuestImport', () => {
  it('mapeia as colunas e normaliza os dados', () => {
    const result = plan(`${HEADER}\nJoão Silva;(45) 99999-8888;Família Silva;JOAO@EXAMPLE.COM;Sem restrições;4;2`)

    expect(result.total).toBe(1)
    expect(result.skipped).toEqual([])
    expect(result.imported[0]).toEqual({
      line: 2,
      name: 'João Silva',
      phone: '5545999998888',
      groupName: 'Família Silva',
      email: 'joao@example.com',
      notes: 'Sem restrições',
      maxGuests: 4,
      estimatedGuests: 2,
    })
  })

  it('aceita aliases e cabeçalhos sem acento ou caixa', () => {
    const result = plan('nome;WHATSAPP;familia;email\nAna;45988887777;Padrinhos;ana@example.com')
    expect(result.imported[0]).toMatchObject({
      name: 'Ana',
      phone: '5545988887777',
      groupName: 'Padrinhos',
      email: 'ana@example.com',
    })
  })

  it('trata limite e estimativa vazios como nulos', () => {
    const result = plan('Nome;Telefone;Limite de pessoas;Convidados estimados\nAna;45988887777;;')
    expect(result.imported[0]?.maxGuests).toBeNull()
    expect(result.imported[0]?.estimatedGuests).toBeNull()
  })

  it('exige os cabeçalhos obrigatórios', () => {
    try {
      plan('Nome;E-mail\nJoão;joao@example.com')
      throw new Error('deveria falhar')
    }
    catch (error) {
      expect(error).toBeInstanceOf(GuestImportError)
      expect((error as GuestImportError).code).toBe('missing_headers')
      expect((error as GuestImportError).missing).toEqual(['Telefone'])
    }
  })

  it('ignora telefone inválido com o motivo da validação', () => {
    const result = plan('Nome;Telefone\nJoão;123')
    expect(result.imported).toEqual([])
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0]?.line).toBe(2)
    expect(result.skipped[0]?.reason).toMatch(/telefone/i)
  })

  it('ignora telefone repetido no arquivo e aponta a primeira linha', () => {
    const result = plan('Nome;Telefone\nJoão;(45) 99999-8888\nJoão de novo;45999998888')

    expect(result.imported).toHaveLength(1)
    expect(result.skipped).toEqual([
      {
        line: 3,
        name: 'João de novo',
        phone: '45999998888',
        reason: 'Telefone repetido no arquivo (linha 2)',
      },
    ])
  })

  it('ignora convidado já cadastrado pelo telefone normalizado', () => {
    const result = plan(
      'Nome;Telefone\nJoão;(45) 99999-8888',
      [{ phone: '5545999998888', name: 'João Antigo' }],
    )

    expect(result.imported).toEqual([])
    expect(result.skipped[0]?.reason).toBe('Já cadastrado como João Antigo')
  })

  it('não usa o e-mail como chave de duplicidade', () => {
    const result = plan('Nome;Telefone;E-mail\nAna;45988887777;familia@example.com\nBia;45977776666;familia@example.com')
    expect(result.imported).toHaveLength(2)
    expect(result.skipped).toEqual([])
  })

  it('recusa mais de 500 linhas', () => {
    const rows = Array.from({ length: 501 }, (_, index) => `Convidado ${index};45999998888`).join('\n')
    expect(() => plan(`Nome;Telefone\n${rows}`)).toThrow(GuestImportError)
  })
})
