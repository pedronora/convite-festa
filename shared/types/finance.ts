import type { ExpenseCategory, PaymentMethod } from '../config/finance'

export type PaymentStatus = 'paid' | 'pending' | 'due_soon' | 'overdue'
export type ContractStatus = 'open' | 'paid' | 'due_soon' | 'overdue'

/** Linha crua da tabela `contracts`, usada também pelos cálculos compartilhados. */
export interface ContractRecord {
  id: number
  supplierName: string
  category: ExpenseCategory
  contact: string | null
  description: string
  totalCents: number
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

/** Linha crua da tabela `contract_payments`. */
export interface ContractPaymentRecord {
  id: number
  contractId: number
  label: string | null
  amountCents: number
  dueDate: string
  paidOn: string | null
  method: PaymentMethod | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PaymentItem {
  id: number
  contractId: number
  label: string | null
  amountCents: number
  dueDate: string
  paidOn: string | null
  method: PaymentMethod | null
  notes: string | null
  status: PaymentStatus
  /** Dias até o vencimento. Negativo quando está atrasada. */
  daysUntilDue: number | null
  createdAt: string
  updatedAt: string
}

export interface ContractSummary {
  id: number
  supplierName: string
  category: ExpenseCategory
  contact: string | null
  description: string
  notes: string | null
  totalCents: number
  paidCents: number
  openCents: number
  /** Soma das parcelas ainda não pagas. */
  scheduledCents: number
  /** Saldo em aberto que ainda não tem parcela cadastrada. */
  unscheduledCents: number
  paymentCount: number
  paidPaymentCount: number
  nextPaymentId: number | null
  nextDueDate: string | null
  nextDueCents: number | null
  status: ContractStatus
  progressPercent: number
  createdAt: string
  updatedAt: string
}

export interface ContractDetail extends ContractSummary {
  payments: PaymentItem[]
}

export interface ContractListResponse {
  items: ContractSummary[]
  totals: {
    count: number
    contractedCents: number
    paidCents: number
    openCents: number
  }
}

export interface FinanceUpcomingPayment {
  id: number
  contractId: number
  supplierName: string
  category: ExpenseCategory
  label: string | null
  amountCents: number
  dueDate: string
  status: PaymentStatus
  daysUntilDue: number | null
}

export interface FinanceRecentPayment {
  id: number
  contractId: number
  supplierName: string
  label: string | null
  amountCents: number
  paidOn: string
}

export interface FinanceCategorySummary {
  category: ExpenseCategory
  count: number
  contractedCents: number
  paidCents: number
  openCents: number
}

export interface FinanceMonthlyPoint {
  /** YYYY-MM */
  month: string
  plannedCents: number
  paidCents: number
  cumulativePlannedCents: number
  cumulativePaidCents: number
}

export interface FinanceMetrics {
  contractedCents: number
  paidCents: number
  openCents: number
  scheduledCents: number
  unscheduledCents: number
  overdueCents: number
  dueNext7DaysCents: number
  dueNext30DaysCents: number
  paidPercent: number
  contractsCount: number
  openContractsCount: number
  paidContractsCount: number
  overdueContractsCount: number
  dueSoonContractsCount: number
  paymentsCount: number
  paidPaymentsCount: number
}

export interface FinanceSummary {
  today: string
  metrics: FinanceMetrics
  byStatus: Record<ContractStatus, number>
  byCategory: FinanceCategorySummary[]
  monthly: FinanceMonthlyPoint[]
  /** Todas as parcelas em aberto, ordenadas por vencimento. */
  upcoming: FinanceUpcomingPayment[]
  recentPayments: FinanceRecentPayment[]
  topOpenContracts: ContractSummary[]
}
