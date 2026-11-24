import { DUE_SOON_DAYS, EXPENSE_CATEGORIES } from '../config/finance'
import type { ExpenseCategory } from '../config/finance'
import type {
  ContractPaymentRecord,
  ContractRecord,
  ContractStatus,
  ContractSummary,
  FinanceCategorySummary,
  FinanceMonthlyPoint,
  FinanceRecentPayment,
  FinanceSummary,
  FinanceUpcomingPayment,
  PaymentItem,
  PaymentStatus,
} from '../types/finance'
import { daysBetweenDateOnly } from './format'

function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

function byDueDate(a: ContractPaymentRecord, b: ContractPaymentRecord): number {
  return a.dueDate.localeCompare(b.dueDate) || a.id - b.id
}

function nextUnpaidPayment(payments: ContractPaymentRecord[]): ContractPaymentRecord | null {
  return payments
    .filter(payment => !payment.paidOn)
    .sort(byDueDate)[0] ?? null
}

/** Status derivado de uma parcela. Nunca é persistido no banco. */
export function paymentStatus(
  payment: Pick<ContractPaymentRecord, 'paidOn' | 'dueDate'>,
  today: string,
  soonDays = DUE_SOON_DAYS,
): PaymentStatus {
  if (payment.paidOn) return 'paid'
  const days = daysBetweenDateOnly(today, payment.dueDate)
  if (days === null) return 'pending'
  if (days < 0) return 'overdue'
  if (days <= soonDays) return 'due_soon'
  return 'pending'
}

/** Status derivado do contrato, considerando o total pago e as parcelas. */
export function contractStatus(
  totalCents: number,
  paidCents: number,
  payments: ContractPaymentRecord[],
  today: string,
  soonDays = DUE_SOON_DAYS,
): ContractStatus {
  if (totalCents > 0 && paidCents >= totalCents) return 'paid'
  const unpaid = payments.filter(payment => !payment.paidOn)
  const hasOverdue = unpaid.some((payment) => {
    const days = daysBetweenDateOnly(today, payment.dueDate)
    return days !== null && days < 0
  })
  if (hasOverdue) return 'overdue'
  const next = nextUnpaidPayment(payments)
  if (next) {
    const days = daysBetweenDateOnly(today, next.dueDate)
    if (days !== null && days <= soonDays) return 'due_soon'
  }
  return 'open'
}

export function toPaymentItem(payment: ContractPaymentRecord, today: string): PaymentItem {
  return {
    id: payment.id,
    contractId: payment.contractId,
    label: payment.label,
    amountCents: payment.amountCents,
    dueDate: payment.dueDate,
    paidOn: payment.paidOn,
    method: payment.method,
    notes: payment.notes,
    status: paymentStatus(payment, today),
    daysUntilDue: daysBetweenDateOnly(today, payment.dueDate),
    createdAt: toIso(payment.createdAt),
    updatedAt: toIso(payment.updatedAt),
  }
}

export function summarizeContract(
  contract: ContractRecord,
  allPayments: ContractPaymentRecord[],
  today: string,
): ContractSummary {
  const payments = allPayments.filter(payment => payment.contractId === contract.id)
  const paidCents = payments
    .filter(payment => payment.paidOn)
    .reduce((sum, payment) => sum + payment.amountCents, 0)
  const scheduledCents = payments
    .filter(payment => !payment.paidOn)
    .reduce((sum, payment) => sum + payment.amountCents, 0)
  const openCents = Math.max(0, contract.totalCents - paidCents)
  const unscheduledCents = Math.max(0, openCents - scheduledCents)
  const next = nextUnpaidPayment(payments)

  return {
    id: contract.id,
    supplierName: contract.supplierName,
    category: contract.category,
    contact: contract.contact,
    description: contract.description,
    notes: contract.notes,
    totalCents: contract.totalCents,
    paidCents,
    openCents,
    scheduledCents,
    unscheduledCents,
    paymentCount: payments.length,
    paidPaymentCount: payments.filter(payment => payment.paidOn).length,
    nextPaymentId: next?.id ?? null,
    nextDueDate: next?.dueDate ?? null,
    nextDueCents: next?.amountCents ?? null,
    status: contractStatus(contract.totalCents, paidCents, payments, today),
    progressPercent: contract.totalCents > 0
      ? Math.min(100, Math.max(0, Math.round((paidCents / contract.totalCents) * 100)))
      : 0,
    createdAt: toIso(contract.createdAt),
    updatedAt: toIso(contract.updatedAt),
  }
}

function monthKey(value: string): string | null {
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : null
}

function monthIndex(value: string): number {
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1
}

function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Série mensal acumulada: planejado por vencimento e realizado por data de
 * pagamento. Serve para a curva de evolução do dashboard.
 */
export function buildMonthlySeries(
  payments: ContractPaymentRecord[],
  today: string,
): FinanceMonthlyPoint[] {
  const months = new Set<string>()
  for (const payment of payments) {
    const due = monthKey(payment.dueDate)
    if (due) months.add(due)
    if (payment.paidOn) {
      const paid = monthKey(payment.paidOn)
      if (paid) months.add(paid)
    }
  }
  if (!months.size) return []

  const currentMonth = monthKey(today)
  if (currentMonth) months.add(currentMonth)

  const sorted = [...months].sort()
  const first = monthIndex(sorted[0]!)
  const last = monthIndex(sorted[sorted.length - 1]!)

  const planned = new Map<string, number>()
  const paid = new Map<string, number>()
  for (const payment of payments) {
    const due = monthKey(payment.dueDate)
    if (due) planned.set(due, (planned.get(due) ?? 0) + payment.amountCents)
    if (payment.paidOn) {
      const paidMonth = monthKey(payment.paidOn)
      if (paidMonth) paid.set(paidMonth, (paid.get(paidMonth) ?? 0) + payment.amountCents)
    }
  }

  let cumulativePlannedCents = 0
  let cumulativePaidCents = 0
  const points: FinanceMonthlyPoint[] = []
  for (let index = first; index <= last; index++) {
    const month = monthFromIndex(index)
    const plannedCents = planned.get(month) ?? 0
    const paidCents = paid.get(month) ?? 0
    cumulativePlannedCents += plannedCents
    cumulativePaidCents += paidCents
    points.push({
      month,
      plannedCents,
      paidCents,
      cumulativePlannedCents,
      cumulativePaidCents,
    })
  }
  return points
}

export function summarizeFinance(
  contracts: ContractRecord[],
  payments: ContractPaymentRecord[],
  today: string,
): FinanceSummary {
  const summaries = contracts.map(contract => summarizeContract(contract, payments, today))
  const contractById = new Map(contracts.map(contract => [contract.id, contract]))
  const byStatus: Record<ContractStatus, number> = {
    open: 0,
    paid: 0,
    due_soon: 0,
    overdue: 0,
  }
  for (const summary of summaries) byStatus[summary.status] += 1

  const categoryMap = new Map<ExpenseCategory, FinanceCategorySummary>()
  for (const category of EXPENSE_CATEGORIES) {
    categoryMap.set(category, {
      category,
      count: 0,
      contractedCents: 0,
      paidCents: 0,
      openCents: 0,
    })
  }
  for (const summary of summaries) {
    const row = categoryMap.get(summary.category)
    if (!row) continue
    row.count += 1
    row.contractedCents += summary.totalCents
    row.paidCents += summary.paidCents
    row.openCents += summary.openCents
  }

  const metrics = summaries.reduce(
    (acc, summary) => {
      acc.contractedCents += summary.totalCents
      acc.paidCents += summary.paidCents
      acc.openCents += summary.openCents
      acc.scheduledCents += summary.scheduledCents
      acc.unscheduledCents += summary.unscheduledCents
      return acc
    },
    {
      contractedCents: 0,
      paidCents: 0,
      openCents: 0,
      scheduledCents: 0,
      unscheduledCents: 0,
    },
  )

  const unpaid = payments
    .filter(payment => !payment.paidOn)
    .sort(byDueDate)
  const paymentItems = unpaid.map(payment => toPaymentItem(payment, today))
  const upcoming: FinanceUpcomingPayment[] = paymentItems.flatMap((payment) => {
    const contract = contractById.get(payment.contractId)
    if (!contract) return []
    return [{
      id: payment.id,
      contractId: payment.contractId,
      supplierName: contract.supplierName,
      category: contract.category,
      label: payment.label,
      amountCents: payment.amountCents,
      dueDate: payment.dueDate,
      status: payment.status,
      daysUntilDue: payment.daysUntilDue,
    }]
  })

  let overdueCents = 0
  let dueNext7DaysCents = 0
  let dueNext30DaysCents = 0
  for (const payment of paymentItems) {
    if (payment.status === 'overdue') overdueCents += payment.amountCents
    const days = payment.daysUntilDue
    if (days !== null && days >= 0 && days <= 7) dueNext7DaysCents += payment.amountCents
    if (days !== null && days >= 0 && days <= 30) dueNext30DaysCents += payment.amountCents
  }

  const recentPayments: FinanceRecentPayment[] = payments
    .filter(payment => payment.paidOn)
    .sort((a, b) => (b.paidOn ?? '').localeCompare(a.paidOn ?? '') || b.id - a.id)
    .slice(0, 6)
    .flatMap((payment) => {
      const contract = contractById.get(payment.contractId)
      if (!contract || !payment.paidOn) return []
      return [{
        id: payment.id,
        contractId: payment.contractId,
        supplierName: contract.supplierName,
        label: payment.label,
        amountCents: payment.amountCents,
        paidOn: payment.paidOn,
      }]
    })

  const topOpenContracts = summaries
    .filter(summary => summary.openCents > 0)
    .sort((a, b) => b.openCents - a.openCents)
    .slice(0, 5)

  return {
    today,
    metrics: {
      ...metrics,
      overdueCents,
      dueNext7DaysCents,
      dueNext30DaysCents,
      paidPercent: metrics.contractedCents > 0
        ? Math.min(100, Math.max(0, Math.round((metrics.paidCents / metrics.contractedCents) * 100)))
        : 0,
      contractsCount: summaries.length,
      openContractsCount: summaries.filter(summary => summary.status !== 'paid').length,
      paidContractsCount: byStatus.paid,
      overdueContractsCount: byStatus.overdue,
      dueSoonContractsCount: byStatus.due_soon,
      paymentsCount: payments.length,
      paidPaymentsCount: payments.filter(payment => payment.paidOn).length,
    },
    byStatus,
    byCategory: [...categoryMap.values()]
      .filter(row => row.count > 0)
      .sort((a, b) => b.contractedCents - a.contractedCents),
    monthly: buildMonthlySeries(payments, today),
    upcoming,
    recentPayments,
    topOpenContracts,
  }
}
