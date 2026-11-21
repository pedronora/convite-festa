import { describe, expect, it } from 'vitest'
import { clientIpFromHeaders, consumeRateLimit } from '../server/utils/rate-limit'

describe('clientIpFromHeaders', () => {
  it('prefere o header do Cloudflare', () => {
    expect(clientIpFromHeaders({
      'cf-connecting-ip': '203.0.113.10',
      'x-forwarded-for': '10.0.0.1',
    })).toBe('203.0.113.10')
  })

  it('usa o último salto do X-Forwarded-For, não o controlado pelo cliente', () => {
    expect(clientIpFromHeaders({
      'x-forwarded-for': '1.2.3.4, 10.0.0.1, 203.0.113.10',
    })).toBe('203.0.113.10')
  })

  it('ignora a caixa do nome do header', () => {
    expect(clientIpFromHeaders({ 'CF-Connecting-IP': '203.0.113.20' })).toBe('203.0.113.20')
  })

  it('cai para o endereço remoto e depois para desconhecido', () => {
    expect(clientIpFromHeaders({}, '10.0.0.5')).toBe('10.0.0.5')
    expect(clientIpFromHeaders({})).toBe('desconhecido')
  })
})

describe('consumeRateLimit', () => {
  it('bloqueia depois do limite e informa o retry', () => {
    const key = `test:${Date.now()}:${Math.random()}`
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true)
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true)

    const blocked = consumeRateLimit(key, 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })
})
