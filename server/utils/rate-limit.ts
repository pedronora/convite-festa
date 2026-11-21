import { createError, setResponseHeader, type H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Teto de buckets em memória. Ao atingir o limite, os expirados são
 * removidos e, se ainda faltar espaço, os mais antigos são descartados em
 * lote para manter o custo amortizado.
 */
const MAX_BUCKETS = 20_000
const PRUNE_TARGET = Math.floor(MAX_BUCKETS * 0.9)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * IP confiável para o rate limit. Atrás do Cloudflare, `CF-Connecting-IP` é
 * definido pelo proxy; sem ele, usa o último salto do `X-Forwarded-For`
 * (o valor acrescentado pelo proxy mais próximo), nunca o primeiro, que é
 * controlado pelo cliente.
 *
 * A origem deve aceitar tráfego apenas do proxy/Cloudflare; caso contrário,
 * esses headers podem ser forjados por quem acessar o container diretamente.
 */
export function clientIpFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  remoteAddress?: string,
): string {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue
    normalized[key.toLowerCase()] = Array.isArray(value) ? value[0] ?? '' : value
  }

  const cloudflare = normalized['cf-connecting-ip']?.trim()
  if (cloudflare) return cloudflare

  const forwarded = normalized['x-forwarded-for']
  if (forwarded) {
    const hops = forwarded.split(',').map(hop => hop.trim()).filter(Boolean)
    const last = hops.at(-1)
    if (last) return last
  }

  return remoteAddress?.trim() || 'desconhecido'
}

export function trustedClientIp(event: H3Event): string {
  return clientIpFromHeaders(
    event.node.req.headers,
    event.node.req.socket?.remoteAddress,
  )
}

function pruneBuckets(now: number): void {
  if (buckets.size < MAX_BUCKETS) return

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  while (buckets.size > PRUNE_TARGET) {
    const oldest = buckets.keys().next().value
    if (oldest === undefined) break
    buckets.delete(oldest)
  }
}

export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  pruneBuckets(now)

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

function rejectIfBlocked(event: H3Event, result: RateLimitResult): void {
  if (result.allowed) return
  setResponseHeader(event, 'Retry-After', result.retryAfterSeconds)
  throw createError({
    statusCode: 429,
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  })
}

/** Limite por IP confiável (Cloudflare/proxy), usado na maioria das rotas. */
export function enforceRateLimit(
  event: H3Event,
  key: string,
  limit: number,
  windowMs: number,
): void {
  rejectIfBlocked(
    event,
    consumeRateLimit(`${key}:ip:${trustedClientIp(event)}`, limit, windowMs),
  )
}

/**
 * Limite por uma chave de domínio (por exemplo, e-mail ou ID do admin),
 * independente do IP. Serve para conter ataques distribuídos e sessões
 * roubadas que trocam de IP a cada tentativa.
 */
export function enforceScopedRateLimit(
  event: H3Event,
  key: string,
  limit: number,
  windowMs: number,
): void {
  rejectIfBlocked(event, consumeRateLimit(key, limit, windowMs))
}
