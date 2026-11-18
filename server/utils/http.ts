import type { H3Event } from 'h3'

export function parsePositiveId(event: H3Event, name = 'id'): number {
  const raw = getRouterParam(event, name)
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Identificador inválido' })
  }
  return id
}

export function bodyFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

export function requestIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'desconhecido'
}
