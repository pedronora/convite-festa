import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') || ''
  if (!/^[a-f0-9-]+\.(png|jpg|webp)$/i.test(name)) {
    throw createError({ statusCode: 404, message: 'Imagem não encontrada' })
  }
  const extension = name.split('.').pop()!.toLowerCase()
  try {
    const file = await readFile(resolve(uploadsDir(), name))
    setResponseHeaders(event, {
      'Content-Type': MIME[extension] || 'application/octet-stream',
      'Content-Length': String(file.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'default-src \'none\'; sandbox',
    })
    return file
  }
  catch {
    throw createError({ statusCode: 404, message: 'Imagem não encontrada' })
  }
})
