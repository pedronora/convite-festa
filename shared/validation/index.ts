import { z } from 'zod'
import type { CountryCode } from 'libphonenumber-js'
import { DEFAULT_PHONE_COUNTRY, isCountryCode } from '../config/countries'
import { canonicalPhone, normalizePhone } from '../utils/phone'
import { passwordPolicyError } from '../utils/password-policy'

export const PHONE_ERROR = 'Telefone inválido. Confira o DDD e o código do país.'

const phoneField = z
  .string()
  .trim()
  .min(4, 'Informe o telefone')
  .max(25, 'Telefone muito longo')

const phoneCountryField = z
  .string()
  .trim()
  .optional()
  .transform(value => (value ? value.toUpperCase() : DEFAULT_PHONE_COUNTRY))
  .refine((value): value is CountryCode => isCountryCode(value), 'País inválido')

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .nullable()
    .transform(value => (value ? value : null))

const optionalEmail = z
  .string()
  .trim()
  .max(200, 'E-mail muito longo')
  .refine(
    value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value),
    'E-mail inválido',
  )
  .optional()
  .nullable()
  .transform(value => (value ? value.toLowerCase() : null))

export const guestInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome').max(160),
    phone: phoneField,
    phoneCountry: phoneCountryField,
    email: optionalEmail,
    groupName: optionalText(160),
    notes: optionalText(2000),
    estimatedGuests: z.coerce.number().int().min(0).max(100).nullable().optional(),
    maxGuests: z.coerce.number().int().min(1, 'O limite deve ser ao menos 1').max(50).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!normalizePhone(data.phone, data.phoneCountry)) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: PHONE_ERROR })
    }
  })

export type GuestInput = z.infer<typeof guestInputSchema>

export const guestListQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  send: z.enum(['all', 'not_sent', 'sent', 'failed']).catch('all'),
  rsvp: z.enum(['all', 'awaiting', 'yes', 'no']).catch('all'),
  sort: z.enum(['name', 'createdAt', 'sentAt', 'confirmedAt']).catch('createdAt'),
  order: z.enum(['asc', 'desc']).catch('desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
})

export const rsvpInputSchema = z
  .object({
    attendanceStatus: z.enum(['yes', 'no'], { message: 'Escolha uma opção' }),
    responsibleName: z.string().trim().min(2, 'Informe o nome do responsável').max(160),
    phone: phoneField,
    phoneCountry: phoneCountryField,
    email: optionalEmail,
    adults: z.coerce.number().int('Use números inteiros').min(0).max(100),
    children8to11: z.coerce.number().int('Use números inteiros').min(0).max(100),
    children0to7: z.coerce.number().int('Use números inteiros').min(0).max(100),
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (!normalizePhone(data.phone, data.phoneCountry)) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: PHONE_ERROR })
    }
    if (data.attendanceStatus === 'no') return
    const total = data.adults + data.children8to11 + data.children0to7
    if (total < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['adults'],
        message: 'Confirme ao menos uma pessoa para participar',
      })
    }
  })

export type RsvpInput = z.infer<typeof rsvpInputSchema>

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido').max(200),
  password: z.string().min(1, 'Informe a senha').max(200),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .max(200, 'A nova senha é muito longa')
      .superRefine((value, ctx) => {
        const error = passwordPolicyError(value)
        if (error) ctx.addIssue({ code: 'custom', message: error })
      }),
    confirmPassword: z.string().min(1),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

export const sendRegistrationSchema = z.object({
  phone: phoneField.refine(value => canonicalPhone(value) !== null, PHONE_ERROR),
  message: z.string().trim().min(1, 'A mensagem não pode ficar vazia').max(4000),
  method: z.enum(['whatsapp_web', 'whatsapp_business']).default('whatsapp_web'),
  status: z.enum(['sent', 'failed']),
})

export function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message || 'Dados inválidos'
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

export * from './finance'
