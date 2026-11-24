import { and, asc, eq, ne, sql } from 'drizzle-orm'
import type { Contract, ContractPayment } from '../database/schema'
import type {
  ContractDetail,
  ContractListResponse,
  FinanceSummary,
} from '#shared/types'
import type { ContractInput, ContractListQuery, PaymentInput } from '#shared/validation'
import { EXPENSE_CATEGORY_LABELS } from '#shared/config/finance'
import { todayInSaoPaulo } from '#shared/utils/format'
import { summarizeContract, summarizeFinance, toPaymentItem } from '#shared/utils/finance'

type ContractRow = Contract
type PaymentRow = ContractPayment

async function fetchAll(): Promise<{ contracts: ContractRow[], payments: PaymentRow[] }> {
  const db = useDb()
  const [contracts, payments] = await Promise.all([
    db.select().from(schema.contracts).orderBy(asc(schema.contracts.supplierName)),
    db
      .select()
      .from(schema.contractPayments)
      .orderBy(asc(schema.contractPayments.dueDate), asc(schema.contractPayments.id)),
  ])
  return { contracts, payments }
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { contracts, payments } = await fetchAll()
  return summarizeFinance(contracts, payments, todayInSaoPaulo())
}

export async function listContracts(query: ContractListQuery): Promise<ContractListResponse> {
  const today = todayInSaoPaulo()
  const { contracts, payments } = await fetchAll()
  let items = contracts.map(contract => summarizeContract(contract, payments, today))

  const search = query.search.trim().toLowerCase()
  if (search) {
    items = items.filter((item) => {
      const category = EXPENSE_CATEGORY_LABELS[item.category]
      return [
        item.supplierName,
        item.description,
        item.contact ?? '',
        category,
      ].some(value => value.toLowerCase().includes(search))
    })
  }
  if (query.category !== 'all') {
    items = items.filter(item => item.category === query.category)
  }
  if (query.status !== 'all') {
    items = items.filter(item => item.status === query.status)
  }

  items = [...items].sort((a, b) => {
    switch (query.sort) {
      case 'next_due':
        if (a.nextDueDate && b.nextDueDate) return a.nextDueDate.localeCompare(b.nextDueDate) || a.supplierName.localeCompare(b.supplierName, 'pt-BR')
        if (a.nextDueDate) return -1
        if (b.nextDueDate) return 1
        return a.supplierName.localeCompare(b.supplierName, 'pt-BR')
      case 'highest':
        return b.totalCents - a.totalCents || a.supplierName.localeCompare(b.supplierName, 'pt-BR')
      case 'name':
        return a.supplierName.localeCompare(b.supplierName, 'pt-BR')
      case 'recent':
      default:
        return b.createdAt.localeCompare(a.createdAt) || a.supplierName.localeCompare(b.supplierName, 'pt-BR')
    }
  })

  const totals = items.reduce(
    (acc, item) => {
      acc.contractedCents += item.totalCents
      acc.paidCents += item.paidCents
      acc.openCents += item.openCents
      return acc
    },
    { count: items.length, contractedCents: 0, paidCents: 0, openCents: 0 },
  )

  return { items, totals }
}

export async function getContractDetail(id: number): Promise<ContractDetail | null> {
  const db = useDb()
  const [contract] = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.id, id))
    .limit(1)
  if (!contract) return null

  const payments = await db
    .select()
    .from(schema.contractPayments)
    .where(eq(schema.contractPayments.contractId, id))
    .orderBy(asc(schema.contractPayments.dueDate), asc(schema.contractPayments.id))
  const today = todayInSaoPaulo()
  return {
    ...summarizeContract(contract, payments, today),
    payments: payments.map(payment => toPaymentItem(payment, today)),
  }
}

export async function requireContract(id: number): Promise<ContractRow> {
  const db = useDb()
  const [contract] = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.id, id))
    .limit(1)
  if (!contract) {
    throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  }
  return contract
}

async function requirePayment(contractId: number, paymentId: number): Promise<PaymentRow> {
  const db = useDb()
  const [payment] = await db
    .select()
    .from(schema.contractPayments)
    .where(and(
      eq(schema.contractPayments.id, paymentId),
      eq(schema.contractPayments.contractId, contractId),
    ))
    .limit(1)
  if (!payment) {
    throw createError({ statusCode: 404, message: 'Parcela não encontrada' })
  }
  return payment
}

async function paymentSum(contractId: number, excludePaymentId?: number): Promise<number> {
  const db = useDb()
  const conditions = [eq(schema.contractPayments.contractId, contractId)]
  if (excludePaymentId) conditions.push(ne(schema.contractPayments.id, excludePaymentId))
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.contractPayments.amountCents}), 0)::int` })
    .from(schema.contractPayments)
    .where(and(...conditions))
  return Number(row?.total ?? 0)
}

async function assertPaymentFitsContract(
  contract: ContractRow,
  amountCents: number,
  excludePaymentId?: number,
): Promise<void> {
  const scheduled = await paymentSum(contract.id, excludePaymentId)
  const remaining = Math.max(0, contract.totalCents - scheduled)
  if (amountCents > remaining) {
    throw createError({
      statusCode: 422,
      message: remaining > 0
        ? `O valor ultrapassa o saldo disponível de ${(remaining / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
        : 'As parcelas já somam o valor total do contrato.',
      data: { fieldErrors: { amountCents: 'Valor acima do saldo disponível.' } },
    })
  }
}

export async function createContract(input: ContractInput): Promise<ContractDetail> {
  const db = useDb()
  const [contract] = await db
    .insert(schema.contracts)
    .values({
      supplierName: input.supplierName,
      category: input.category,
      contact: input.contact,
      description: input.description,
      totalCents: input.totalCents,
      notes: input.notes,
    })
    .returning({ id: schema.contracts.id })
  if (!contract) {
    throw createError({ statusCode: 500, message: 'Não foi possível cadastrar o fornecedor' })
  }
  const detail = await getContractDetail(contract.id)
  if (!detail) {
    throw createError({ statusCode: 500, message: 'Não foi possível carregar o fornecedor' })
  }
  console.info('[contracts] created', { contractId: contract.id })
  return detail
}

export async function updateContract(id: number, input: ContractInput): Promise<ContractDetail> {
  const contract = await requireContract(id)
  const scheduled = await paymentSum(id)
  if (input.totalCents < scheduled) {
    throw createError({
      statusCode: 422,
      message: 'O valor contratado não pode ser menor que a soma das parcelas já cadastradas.',
      data: { fieldErrors: { totalCents: 'Reduza ou remova parcelas antes de diminuir o contrato.' } },
    })
  }

  const db = useDb()
  await db
    .update(schema.contracts)
    .set({
      supplierName: input.supplierName,
      category: input.category,
      contact: input.contact,
      description: input.description,
      totalCents: input.totalCents,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(eq(schema.contracts.id, contract.id))

  const detail = await getContractDetail(id)
  if (!detail) throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  console.info('[contracts] updated', { contractId: id })
  return detail
}

export async function deleteContract(id: number): Promise<void> {
  const db = useDb()
  const [deleted] = await db
    .delete(schema.contracts)
    .where(eq(schema.contracts.id, id))
    .returning({ id: schema.contracts.id })
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  }
  console.info('[contracts] deleted', { contractId: id })
}

export async function createPayment(contractId: number, input: PaymentInput): Promise<ContractDetail> {
  const contract = await requireContract(contractId)
  await assertPaymentFitsContract(contract, input.amountCents)

  const db = useDb()
  const [payment] = await db
    .insert(schema.contractPayments)
    .values({
      contractId,
      label: input.label,
      amountCents: input.amountCents,
      dueDate: input.dueDate,
      paidOn: input.paidOn,
      method: input.method,
      notes: input.notes,
    })
    .returning({ id: schema.contractPayments.id })
  if (!payment) {
    throw createError({ statusCode: 500, message: 'Não foi possível cadastrar a parcela' })
  }
  const detail = await getContractDetail(contractId)
  if (!detail) throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  console.info('[contracts] payment created', { contractId, paymentId: payment.id })
  return detail
}

export async function updatePayment(
  contractId: number,
  paymentId: number,
  input: PaymentInput,
): Promise<ContractDetail> {
  const contract = await requireContract(contractId)
  await requirePayment(contractId, paymentId)
  await assertPaymentFitsContract(contract, input.amountCents, paymentId)

  const db = useDb()
  await db
    .update(schema.contractPayments)
    .set({
      label: input.label,
      amountCents: input.amountCents,
      dueDate: input.dueDate,
      paidOn: input.paidOn,
      method: input.method,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(
      eq(schema.contractPayments.id, paymentId),
      eq(schema.contractPayments.contractId, contractId),
    ))

  const detail = await getContractDetail(contractId)
  if (!detail) throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  console.info('[contracts] payment updated', { contractId, paymentId })
  return detail
}

export async function deletePayment(contractId: number, paymentId: number): Promise<void> {
  await requireContract(contractId)
  const db = useDb()
  const [deleted] = await db
    .delete(schema.contractPayments)
    .where(and(
      eq(schema.contractPayments.id, paymentId),
      eq(schema.contractPayments.contractId, contractId),
    ))
    .returning({ id: schema.contractPayments.id })
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Parcela não encontrada' })
  }
  console.info('[contracts] payment deleted', { contractId, paymentId })
}

export async function payPayment(
  contractId: number,
  paymentId: number,
  paidOn: string | null | undefined,
): Promise<ContractDetail> {
  await requireContract(contractId)
  await requirePayment(contractId, paymentId)
  const value = paidOn === undefined ? todayInSaoPaulo() : paidOn

  const db = useDb()
  await db
    .update(schema.contractPayments)
    .set({ paidOn: value, updatedAt: new Date() })
    .where(and(
      eq(schema.contractPayments.id, paymentId),
      eq(schema.contractPayments.contractId, contractId),
    ))

  const detail = await getContractDetail(contractId)
  if (!detail) throw createError({ statusCode: 404, message: 'Fornecedor não encontrado' })
  console.info('[contracts] payment settled', { contractId, paymentId, paid: Boolean(value) })
  return detail
}
