import { describe, expect, it } from 'vitest'
import type { ContractPaymentRecord, ContractRecord } from '../shared/types'
import {
  buildMonthlySeries,
  contractStatus,
  paymentStatus,
  summarizeContract,
  summarizeFinance,
} from '../shared/utils/finance'
import {
  addDaysToDateOnly,
  addMonthsToDateOnly,
  daysBetweenDateOnly,
  formatDateOnly,
  formatMonthShort,
  todayInSaoPaulo,
  toDateOnlyInSaoPaulo,
} from '../shared/utils/format'
import { contractInputSchema, paymentInputSchema } from '../shared/validation'

const today = '2026-06-10'

function contract(overrides: Partial<ContractRecord> = {}): ContractRecord {
  return {
    id: 1,
    supplierName: 'Buffet Teste',
    category: 'buffet',
    contact: null,
    description: 'Buffet completo',
    totalCents: 100_000,
    notes: null,
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  }
}

function payment(overrides: Partial<ContractPaymentRecord> = {}): ContractPaymentRecord {
  return {
    id: 1,
    contractId: 1,
    label: 'Parcela',
    amountCents: 10_000,
    dueDate: '2026-06-01',
    paidOn: null,
    method: null,
    notes: null,
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('paymentStatus', () => {
  it('classifica pago, atrasado, a vencer e pendente', () => {
    expect(paymentStatus(payment({ paidOn: '2026-06-01' }), today)).toBe('paid')
    expect(paymentStatus(payment({ dueDate: '2026-06-09' }), today)).toBe('overdue')
    expect(paymentStatus(payment({ dueDate: '2026-06-10' }), today)).toBe('due_soon')
    expect(paymentStatus(payment({ dueDate: '2026-06-17' }), today)).toBe('due_soon')
    expect(paymentStatus(payment({ dueDate: '2026-06-18' }), today)).toBe('pending')
  })
})

describe('contractStatus', () => {
  it('marca contrato quitado quando o pago cobre o total', () => {
    expect(contractStatus(100_000, 100_000, [], today)).toBe('paid')
  })

  it('prioriza atraso, depois vencimento próximo e por fim em aberto', () => {
    const overdue = [payment({ dueDate: '2026-06-01' })]
    const soon = [payment({ dueDate: '2026-06-15' })]
    const later = [payment({ dueDate: '2026-07-15' })]
    expect(contractStatus(100_000, 0, overdue, today)).toBe('overdue')
    expect(contractStatus(100_000, 0, soon, today)).toBe('due_soon')
    expect(contractStatus(100_000, 0, later, today)).toBe('open')
  })
})

describe('summarizeContract', () => {
  it('calcula pago, agendado, sem parcela e progresso', () => {
    const payments = [
      payment({ id: 1, amountCents: 40_000, paidOn: '2026-05-01', dueDate: '2026-05-01' }),
      payment({ id: 2, amountCents: 30_000, dueDate: '2026-06-20' }),
      payment({ id: 3, amountCents: 10_000, dueDate: '2026-06-01' }),
    ]
    const summary = summarizeContract(contract(), payments, today)
    expect(summary.paidCents).toBe(40_000)
    expect(summary.scheduledCents).toBe(40_000)
    expect(summary.openCents).toBe(60_000)
    expect(summary.unscheduledCents).toBe(20_000)
    expect(summary.paymentCount).toBe(3)
    expect(summary.paidPaymentCount).toBe(1)
    expect(summary.nextPaymentId).toBe(3)
    expect(summary.nextDueDate).toBe('2026-06-01')
    expect(summary.nextDueCents).toBe(10_000)
    expect(summary.status).toBe('overdue')
    expect(summary.progressPercent).toBe(40)
  })
})

describe('summarizeFinance', () => {
  const contracts = [
    contract({ id: 1, totalCents: 100_000 }),
    contract({
      id: 2,
      supplierName: 'Salão Teste',
      category: 'espaco',
      totalCents: 50_000,
      description: 'Locação',
    }),
  ]
  const payments = [
    payment({ id: 1, contractId: 1, amountCents: 40_000, paidOn: '2026-05-01', dueDate: '2026-05-01' }),
    payment({ id: 2, contractId: 1, amountCents: 30_000, dueDate: '2026-06-20' }),
    payment({ id: 3, contractId: 1, amountCents: 10_000, dueDate: '2026-06-01' }),
    payment({ id: 4, contractId: 2, amountCents: 50_000, paidOn: '2026-06-05', dueDate: '2026-06-05' }),
  ]

  it('agrega métricas, status, categorias e próximos vencimentos', () => {
    const summary = summarizeFinance(contracts, payments, today)
    expect(summary.metrics.contractedCents).toBe(150_000)
    expect(summary.metrics.paidCents).toBe(90_000)
    expect(summary.metrics.openCents).toBe(60_000)
    expect(summary.metrics.scheduledCents).toBe(40_000)
    expect(summary.metrics.unscheduledCents).toBe(20_000)
    expect(summary.metrics.overdueCents).toBe(10_000)
    expect(summary.metrics.dueNext7DaysCents).toBe(0)
    expect(summary.metrics.dueNext30DaysCents).toBe(30_000)
    expect(summary.metrics.paidPercent).toBe(60)
    expect(summary.metrics.contractsCount).toBe(2)
    expect(summary.metrics.paidContractsCount).toBe(1)
    expect(summary.metrics.overdueContractsCount).toBe(1)
    expect(summary.byStatus.paid).toBe(1)
    expect(summary.byStatus.overdue).toBe(1)
    expect(summary.upcoming.map(item => item.id)).toEqual([3, 2])
    expect(summary.topOpenContracts).toHaveLength(1)
    expect(summary.topOpenContracts[0]!.supplierName).toBe('Buffet Teste')
    expect(summary.byCategory.find(row => row.category === 'buffet')?.contractedCents).toBe(100_000)
    expect(summary.byCategory.find(row => row.category === 'espaco')?.paidCents).toBe(50_000)
  })

  it('monta a série mensal acumulada de planejado e pago', () => {
    const series = buildMonthlySeries(payments, today)
    expect(series.map(point => point.month)).toEqual(['2026-05', '2026-06'])
    expect(series[0]).toMatchObject({
      plannedCents: 40_000,
      paidCents: 40_000,
      cumulativePlannedCents: 40_000,
      cumulativePaidCents: 40_000,
    })
    expect(series[1]).toMatchObject({
      plannedCents: 90_000,
      paidCents: 50_000,
      cumulativePlannedCents: 130_000,
      cumulativePaidCents: 90_000,
    })
  })
})

describe('datas sem hora', () => {
  it('formata sem deslocar o dia', () => {
    expect(formatDateOnly('2026-01-23')).toBe('23/01/2026')
    expect(formatDateOnly('2026-02-31')).toBe('—')
    expect(formatMonthShort('2026-01')).toBe('jan/26')
  })

  it('soma dias e meses com ajuste de fim de mês', () => {
    expect(addDaysToDateOnly('2026-01-31', 1)).toBe('2026-02-01')
    expect(addMonthsToDateOnly('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsToDateOnly('2026-01-15', 2)).toBe('2026-03-15')
  })

  it('calcula diferença e usa o fuso da festa', () => {
    expect(daysBetweenDateOnly('2026-06-10', '2026-06-17')).toBe(7)
    expect(todayInSaoPaulo(new Date('2026-01-23T02:00:00Z'))).toBe('2026-01-22')
    expect(toDateOnlyInSaoPaulo('2026-01-23T02:00:00Z')).toBe('2026-01-22')
  })
})

describe('validação financeira', () => {
  const contract = {
    supplierName: 'Buffet Teste',
    category: 'buffet',
    contact: '  ',
    description: 'Buffet completo',
    totalCents: 100_000,
    notes: '',
  }

  it('aceita um contrato válido e normaliza textos vazios', () => {
    const parsed = contractInputSchema.parse(contract)
    expect(parsed.totalCents).toBe(100_000)
    expect(parsed.contact).toBeNull()
    expect(parsed.notes).toBeNull()
  })

  it('rejeita contrato sem valor ou sem descrição', () => {
    expect(contractInputSchema.safeParse({ ...contract, totalCents: 0 }).success).toBe(false)
    expect(contractInputSchema.safeParse({ ...contract, description: '' }).success).toBe(false)
  })

  it('rejeita data impossível e aceita parcela paga', () => {
    const base = {
      label: null,
      amountCents: 10_000,
      dueDate: '2026-12-01',
      paidOn: null,
      method: null,
      notes: null,
    }
    expect(paymentInputSchema.safeParse({ ...base, dueDate: '2026-02-31' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...base, amountCents: 0 }).success).toBe(false)
    const parsed = paymentInputSchema.parse({ ...base, paidOn: '2026-11-23', method: 'pix' })
    expect(parsed.paidOn).toBe('2026-11-23')
    expect(parsed.method).toBe('pix')
  })
})
