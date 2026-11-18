export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '0',
  })

  const path = event.path || ''
  if (path.startsWith('/admin') || path.startsWith('/convite') || path.startsWith('/api/')) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
