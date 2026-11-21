export const MAX_JSON_BODY_BYTES = 128 * 1024
export const MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024

/**
 * Limite de corpo por rota. O upload de imagem aceita até 5 MB de arquivo;
 * a margem extra cobre o envelope multipart.
 */
export function maxBodyBytesForPath(path: string): number {
  const clean = (path.split('?')[0] || '').toLowerCase()
  return clean === '/api/admin/settings/image' ? MAX_UPLOAD_BODY_BYTES : MAX_JSON_BODY_BYTES
}
