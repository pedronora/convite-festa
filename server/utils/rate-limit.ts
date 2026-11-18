import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Rate limit em memória, adequado para uma instância única.
 * Para múltiplas réplicas, trocar por Redis.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  const allowed = bucket.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

export function enforceRateLimit(
  event: H3Event,
  key: string,
  limit: number,
  windowMs: number,
): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'desconhecido'
  const result = consumeRateLimit(`${key}:${ip}`, limit, windowMs)
  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', result.retryAfterSeconds)
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas tentativas',
      message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    })
  }
}
