export const EXPENSE_CATEGORIES = [
  'espaco',
  'buffet',
  'bebidas',
  'bolo_doces',
  'decoracao',
  'fotografia',
  'musica_animacao',
  'convites',
  'outros',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  espaco: 'Espaço',
  buffet: 'Buffet',
  bebidas: 'Bebidas',
  bolo_doces: 'Bolo e doces',
  decoracao: 'Decoração',
  fotografia: 'Fotografia',
  musica_animacao: 'Música e animação',
  convites: 'Convites e papelaria',
  outros: 'Outros',
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  espaco: '#2d5592',
  buffet: '#c81e2b',
  bebidas: '#0ea5e9',
  bolo_doces: '#f59e0b',
  decoracao: '#8b5cf6',
  fotografia: '#14b8a6',
  musica_animacao: '#ec4899',
  convites: '#64748b',
  outros: '#94a3b8',
}

export const EXPENSE_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(value => ({
  value,
  label: EXPENSE_CATEGORY_LABELS[value],
  color: EXPENSE_CATEGORY_COLORS[value],
}))

export const PAYMENT_METHODS = [
  'pix',
  'transferencia',
  'cartao_credito',
  'cartao_debito',
  'dinheiro',
  'boleto',
  'outro',
] as const

export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  outro: 'Outro',
}

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map(value => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}))

/** Janela usada para destacar parcelas que vencem em breve. */
export const DUE_SOON_DAYS = 7

/** Janelas oferecidas no filtro de próximos vencimentos do dashboard. */
export const UPCOMING_WINDOWS = [7, 30, 60] as const

/** Limite de sanidade para um contrato (R$ 1.000.000,00). */
export const MAX_CONTRACT_CENTS = 100_000_000

/** Limite de sanidade para uma parcela (R$ 1.000.000,00). */
export const MAX_PAYMENT_CENTS = 100_000_000
