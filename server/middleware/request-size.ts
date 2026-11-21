const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Rejeita cedo corpos maiores que o esperado por rota. Sem isso, o h3 lê o
 * corpo inteiro em memória antes de qualquer validação. Requisições chunked
 * (sem Content-Length) continuam limitadas pelo proxy/Cloudflare.
 */
export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return
  if (!METHODS_WITH_BODY.has(event.method.toUpperCase())) return

  const raw = getRequestHeader(event, 'content-length')
  if (!raw) return

  const length = Number(raw)
  if (!Number.isFinite(length) || length < 0) return
  if (length > maxBodyBytesForPath(path)) {
    throw createError({
      statusCode: 413,
      message: 'Requisição muito grande.',
    })
  }
})
