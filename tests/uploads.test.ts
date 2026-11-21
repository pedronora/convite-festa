import { describe, expect, it } from 'vitest'
import { sniffImageType } from '../server/utils/uploads'

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
])

describe('sniffImageType', () => {
  it('reconhece PNG, JPEG e WebP pelos magic bytes', () => {
    expect(sniffImageType(png)).toBe('image/png')
    expect(sniffImageType(jpeg)).toBe('image/jpeg')
    expect(sniffImageType(webp)).toBe('image/webp')
  })

  it('recusa conteúdo que não é imagem', () => {
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull()
    expect(sniffImageType(Buffer.alloc(0))).toBeNull()
    expect(sniffImageType(Buffer.from([0xff, 0xd8]))).toBeNull()
  })
})
