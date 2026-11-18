import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

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

export async function saveInviteImage(data: Buffer, mimeType: string): Promise<string> {
  const extension = ALLOWED_TYPES[mimeType]
  if (!extension) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Formato não suportado',
      message: 'Envie uma imagem PNG, JPG ou WebP.',
    })
  }
  if (data.byteLength > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Arquivo muito grande',
      message: 'A imagem deve ter no máximo 5 MB.',
    })
  }
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
