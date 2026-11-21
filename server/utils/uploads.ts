import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp'

const ALLOWED_TYPES: Record<ImageMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function uploadsDir(): string {
  const config = useRuntimeConfig()
  const configured = process.env.NUXT_DATA_DIR
    || process.env.DATA_DIR
    || (config.dataDir as string)
    || './.data'
  const base = resolve(process.cwd(), configured)
  return resolve(base, 'uploads')
}

/** Confere os magic bytes para não confiar apenas no Content-Type enviado. */
export function sniffImageType(data: Buffer): ImageMime | null {
  if (data.length >= PNG_SIGNATURE.length && data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return 'image/png'
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    data.length >= 12
    && data.toString('ascii', 0, 4) === 'RIFF'
    && data.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export async function saveInviteImage(data: Buffer, mimeType: string): Promise<string> {
  if (data.byteLength > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'A imagem deve ter no máximo 5 MB.',
    })
  }

  const declared = (mimeType.toLowerCase().split(';')[0] || '').trim().replace(/^image\/jpg$/, 'image/jpeg')
  const detected = sniffImageType(data)
  if (!detected || !(detected in ALLOWED_TYPES) || (declared && declared !== detected)) {
    throw createError({
      statusCode: 415,
      message: 'Envie uma imagem PNG, JPG ou WebP válida.',
    })
  }

  const extension = ALLOWED_TYPES[detected]
  const dir = uploadsDir()
  await mkdir(dir, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  await writeFile(resolve(dir, filename), data)
  return `/api/invite-image/${filename}`
}

export function uploadFilenameFromUrl(url: string): string | null {
  const match = /^\/api\/invite-image\/([a-f0-9-]+\.(?:png|jpg|webp))$/i.exec(url)
  return match?.[1] ?? null
}

export function extensionFromFilename(filename: string): string {
  return extname(filename).toLowerCase()
}
