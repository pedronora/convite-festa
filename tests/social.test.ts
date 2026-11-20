import { describe, expect, it } from 'vitest'
import {
  isPublicAppUrl,
  resolveAppBaseUrl,
  resolveSocialImageUrl,
  socialImageType,
} from '../shared/utils/social'

describe('isPublicAppUrl', () => {
  it('aceita domínios públicos em http e https', () => {
    expect(isPublicAppUrl('https://convite.marconnora.com')).toBe(true)
    expect(isPublicAppUrl('http://staging.marconnora.com:8080')).toBe(true)
  })

  it('recusa valores vazios, inválidos e protocolos não web', () => {
    expect(isPublicAppUrl('')).toBe(false)
    expect(isPublicAppUrl('   ')).toBe(false)
    expect(isPublicAppUrl('convite.marconnora.com')).toBe(false)
    expect(isPublicAppUrl('ftp://convite.marconnora.com')).toBe(false)
  })

  it('recusa hosts internos, IPs e nomes de container', () => {
    expect(isPublicAppUrl('http://localhost:3000')).toBe(false)
    expect(isPublicAppUrl('http://127.0.0.1:3000')).toBe(false)
    expect(isPublicAppUrl('http://192.168.0.10:3000')).toBe(false)
    expect(isPublicAppUrl('http://app:3000')).toBe(false)
    expect(isPublicAppUrl('https://convite-festa-app-1')).toBe(false)
  })

  it('recusa os domínios de exemplo dos arquivos .env', () => {
    expect(isPublicAppUrl('https://convite.seudominio.com')).toBe(false)
    expect(isPublicAppUrl('https://seudominio.com')).toBe(false)
    expect(isPublicAppUrl('https://festa.example.com')).toBe(false)
  })
})

describe('resolveAppBaseUrl', () => {
  const origin = 'https://convite.marconnora.com'

  it('usa o APP_URL quando ele é público', () => {
    expect(resolveAppBaseUrl('https://festa.marconnora.com/', origin)).toBe('https://festa.marconnora.com')
  })

  it('cai para a origem da requisição quando o APP_URL é o placeholder', () => {
    expect(resolveAppBaseUrl('https://convite.seudominio.com', origin)).toBe(origin)
  })

  it('cai para a origem da requisição quando o APP_URL é localhost ou vazio', () => {
    expect(resolveAppBaseUrl('http://localhost:3000', origin)).toBe(origin)
    expect(resolveAppBaseUrl('', origin)).toBe(origin)
  })

  it('mantém a origem da requisição em desenvolvimento', () => {
    expect(resolveAppBaseUrl('http://localhost:3000', 'http://localhost:3000')).toBe('http://localhost:3000')
  })
})

describe('resolveSocialImageUrl', () => {
  it('monta a URL absoluta de imagens estáticas e de uploads', () => {
    const base = 'https://convite.marconnora.com'
    expect(resolveSocialImageUrl(base, '/images/convite-luigi-marco.jpg'))
      .toBe('https://convite.marconnora.com/images/convite-luigi-marco.jpg')
    expect(resolveSocialImageUrl(base, '/api/invite-image/0b51222a.jpg'))
      .toBe('https://convite.marconnora.com/api/invite-image/0b51222a.jpg')
  })

  it('não duplica barras nem depende do APP_URL terminar sem barra', () => {
    expect(resolveSocialImageUrl('https://convite.marconnora.com/', '/images/arte.png'))
      .toBe('https://convite.marconnora.com/images/arte.png')
    expect(resolveSocialImageUrl('https://convite.marconnora.com', 'images/arte.png'))
      .toBe('https://convite.marconnora.com/images/arte.png')
  })

  it('usa a arte padrão quando o caminho está vazio', () => {
    expect(resolveSocialImageUrl('https://convite.marconnora.com', ''))
      .toBe('https://convite.marconnora.com/images/convite-luigi-marco.jpg')
  })
})

describe('socialImageType', () => {
  it('descobre o MIME pela extensão', () => {
    expect(socialImageType('/images/arte.jpg')).toBe('image/jpeg')
    expect(socialImageType('/images/arte.JPEG')).toBe('image/jpeg')
    expect(socialImageType('/images/arte.png')).toBe('image/png')
    expect(socialImageType('/api/invite-image/abc.webp')).toBe('image/webp')
  })

  it('retorna null para SVG ou sem extensão conhecida', () => {
    expect(socialImageType('/images/convite-padrao.svg')).toBeNull()
    expect(socialImageType('/images/arte')).toBeNull()
  })
})
