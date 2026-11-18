interface ApiErrorLike {
  data?: {
    message?: string
    statusMessage?: string
    fieldErrors?: Record<string, string | string[]>
  }
  statusMessage?: string
  message?: string
}

export function apiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a ação.'): string {
  const apiError = error as ApiErrorLike
  return (
    apiError?.data?.message
    || apiError?.data?.statusMessage
    || apiError?.statusMessage
    || apiError?.message
    || fallback
  )
}

export function apiFieldErrors(error: unknown): Record<string, string> {
  const fields = (error as ApiErrorLike)?.data?.fieldErrors ?? {}
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    normalized[key] = Array.isArray(value) ? value[0] || '' : value
  }
  return normalized
}
