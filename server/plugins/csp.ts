import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

/* eslint-disable @stylistic/quotes -- as diretivas de CSP usam aspas simples */

function buildCsp(nonce: string, secure: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    "connect-src 'self'",
    "media-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(secure ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

function addNonce(chunk: string, nonce: string): string {
  return chunk.replace(/<script(?![^>]*\snonce=)/gi, `<script nonce="${nonce}"`)
}

function isSecureRequest(event: H3Event): boolean {
  const forwarded = getRequestHeader(event, 'x-forwarded-proto')
  if (forwarded) return forwarded.split(',')[0]?.trim() === 'https'
  const socket = event.node.req.socket as { encrypted?: boolean } | undefined
  return socket?.encrypted === true
}

export default defineNitroPlugin((nitroApp) => {
  if (process.env.NODE_ENV === 'production') {
    nitroApp.hooks.hook('render:html', (html, { event }) => {
      const nonce = randomBytes(16).toString('base64')
      html.head = html.head.map(chunk => addNonce(chunk, nonce))
      html.bodyPrepend = html.bodyPrepend.map(chunk => addNonce(chunk, nonce))
      html.body = html.body.map(chunk => addNonce(chunk, nonce))
      html.bodyAppend = html.bodyAppend.map(chunk => addNonce(chunk, nonce))
      setResponseHeader(event, 'Content-Security-Policy', buildCsp(nonce, isSecureRequest(event)))
    })
  }

  nitroApp.hooks.hook('beforeResponse', (event) => {
    removeResponseHeader(event, 'x-powered-by')
  })
})
