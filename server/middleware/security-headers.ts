const NO_STORE_PREFIXES = [
  '/admin',
  '/convite',
  '/api/admin',
  '/api/auth',
  '/api/public/invitations',
]

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '0',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })

  // Rotas do Nuxt são case-insensitive; normalize para o header não escapar
  // de variações como /Admin/login.
  const path = (event.path || '').toLowerCase().split('?')[0] || ''

  // Páginas HTML recebem a CSP com nonce em server/plugins/csp.ts. Respostas
  // de API não precisam carregar nada.
  if (path.startsWith('/api/')) {
    setResponseHeader(
      event,
      'Content-Security-Policy',
      // eslint-disable-next-line @stylistic/quotes -- as diretivas usam aspas simples
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    )
  }

  if (path.startsWith('/admin') || path.startsWith('/convite') || path.startsWith('/api/')) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }

  if (NO_STORE_PREFIXES.some(prefix => path.startsWith(prefix))) {
    setResponseHeader(event, 'Cache-Control', 'no-store')
  }
})
