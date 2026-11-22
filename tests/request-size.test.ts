import { describe, expect, it } from 'vitest'
import {
  MAX_IMPORT_BODY_BYTES,
  MAX_JSON_BODY_BYTES,
  MAX_UPLOAD_BODY_BYTES,
  maxBodyBytesForPath,
} from '../server/utils/request-size'

describe('maxBodyBytesForPath', () => {
  it('libera o limite maior apenas para o upload da arte', () => {
    expect(maxBodyBytesForPath('/api/admin/settings/image')).toBe(MAX_UPLOAD_BODY_BYTES)
    expect(maxBodyBytesForPath('/API/Admin/Settings/Image?x=1')).toBe(MAX_UPLOAD_BODY_BYTES)
  })

  it('reserva 1 MB para a importação de convidados', () => {
    expect(maxBodyBytesForPath('/api/admin/guests/import')).toBe(MAX_IMPORT_BODY_BYTES)
    expect(maxBodyBytesForPath('/API/Admin/Guests/Import?x=1')).toBe(MAX_IMPORT_BODY_BYTES)
    expect(MAX_IMPORT_BODY_BYTES).toBe(1024 * 1024)
  })

  it('usa o limite de JSON nas demais rotas', () => {
    expect(maxBodyBytesForPath('/api/auth/login')).toBe(MAX_JSON_BODY_BYTES)
    expect(maxBodyBytesForPath('/api/admin/settings/image-extra')).toBe(MAX_JSON_BODY_BYTES)
    expect(maxBodyBytesForPath('/api/admin/guests/import-extra')).toBe(MAX_JSON_BODY_BYTES)
  })

  it('mantém margem acima dos 5 MB permitidos para o arquivo', () => {
    expect(MAX_UPLOAD_BODY_BYTES).toBeGreaterThan(5 * 1024 * 1024)
  })
})
