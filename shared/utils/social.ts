const INTERNAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])
const PLACEHOLDER_HOSTS = ['seudominio.com', 'example.com']
const INTERNAL_SUFFIXES = ['.local', '.localhost', '.internal', '.invalid']

function isInternalHost(host: string): boolean {
  if (INTERNAL_HOSTS.has(host)) return true
  if (INTERNAL_SUFFIXES.some(suffix => host.endsWith(suffix))) return true
  if (PLACEHOLDER_HOSTS.some(placeholder => host === placeholder || host.endsWith(`.${placeholder}`))) return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
  // Hosts sem ponto são nomes de container/serviço, nunca alcançáveis de fora.
  return !host.includes('.')
}

/**
 * Uma URL só serve para montar links e prévias se for absoluta, http(s) e
 * apontar para um host público. Valores de exemplo (`seudominio.com`),
 * `localhost` e nomes internos do Docker são descartados.
 */
export function isPublicAppUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  let url: URL
  try {
    url = new URL(trimmed)
  }
  catch {
    return false
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  return !isInternalHost(url.hostname.toLowerCase())
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/**
 * Base pública da aplicação. Prefere o `APP_URL` configurado e, se ele estiver
 * vazio ou com valor de exemplo, usa a origem da requisição — assim a prévia
 * nunca aponta para `localhost` ou para o domínio do `.env.production.example`.
 */
export function resolveAppBaseUrl(appUrl: string, requestOrigin: string): string {
  if (isPublicAppUrl(appUrl)) return stripTrailingSlash(appUrl.trim())
  return stripTrailingSlash(requestOrigin.trim())
}

/**
 * URL absoluta da imagem de prévia. Rastreadores como o do WhatsApp ignoram
 * caminhos relativos em `og:image`.
 */
export function resolveSocialImageUrl(baseUrl: string, imagePath: string): string {
  const path = imagePath.trim() || '/images/convite-luigi-marco.jpg'
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!baseUrl) return normalized
  return new URL(normalized, `${baseUrl}/`).toString()
}

export function socialImageType(imagePath: string): string | null {
  const clean = (imagePath.split('?')[0] || '').toLowerCase()
  if (clean.endsWith('.png')) return 'image/png'
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg'
  if (clean.endsWith('.webp')) return 'image/webp'
  return null
}
