import { z } from 'zod'
import {
  EXPENSE_CATEGORIES,
  MAX_CONTRACT_CENTS,
  MAX_PAYMENT_CENTS,
  PAYMENT_METHODS,
} from '../config/finance'
import { parseDateOnly } from '../utils/format'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .nullable()
    .transform(value => (value ? value : null))

const dateOnlyField = z
  .string()
  .trim()
  .refine(value => parseDateOnly(value) !== null, 'Data inválida')

const optionalDateOnly = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(value => (value == null || value === '' ? null : value))
  .refine(value => value === null || parseDateOnly(value) !== null, 'Data inválida')

export const contractInputSchema = z.object({
  supplierName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do fornecedor')
    .max(160, 'Máximo de 160 caracteres'),
  category: z.enum(EXPENSE_CATEGORIES).default('outros'),
  contact: optionalText(160),
  description: z
    .string()
    .trim()
    .min(3, 'Descreva o objeto do contrato')
    .max(2000, 'Máximo de 2000 caracteres'),
  totalCents: z.coerce
    .number()
    .int('Use um valor válido')
    .min(1, 'Informe o valor contratado')
    .max(MAX_CONTRACT_CENTS, 'Valor acima do limite permitido'),
  notes: optionalText(2000),
})

export type ContractInput = z.infer<typeof contractInputSchema>

export const paymentInputSchema = z.object({
  label: optionalText(80),
  amountCents: z.coerce
    .number()
    .int('Use um valor válido')
    .min(1, 'Informe o valor da parcela')
    .max(MAX_PAYMENT_CENTS, 'Valor acima do limite permitido'),
  dueDate: dateOnlyField,
  paidOn: optionalDateOnly,
  method: z
    .enum(PAYMENT_METHODS)
    .nullable()
    .optional()
    .transform(value => value ?? null),
  notes: optionalText(500),
})

export type PaymentInput = z.infer<typeof paymentInputSchema>

export const paymentPaySchema = z.object({
  paidOn: dateOnlyField.nullable().optional(),
})

export type PaymentPayInput = z.infer<typeof paymentPaySchema>

export const contractStatusFilterSchema = z
  .enum(['all', 'open', 'paid', 'due_soon', 'overdue'])
  .catch('all')

export const contractListQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  category: z
    .union([z.literal('all'), z.enum(EXPENSE_CATEGORIES)])
    .catch('all'),
  status: contractStatusFilterSchema,
  sort: z.enum(['recent', 'next_due', 'highest', 'name']).catch('recent'),
})

export type ContractListQuery = z.infer<typeof contractListQuerySchema>
