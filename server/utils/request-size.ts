export const MAX_JSON_BODY_BYTES = 128 * 1024
export const MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024
export const MAX_IMPORT_BODY_BYTES = 1024 * 1024

/**
 * Limite de corpo por rota. O upload de imagem aceita até 5 MB de arquivo;
 * a margem extra cobre o envelope multipart. A importação de convidados
 * aceita um CSV de até 1 MB.
 */
export function maxBodyBytesForPath(path: string): number {
  const clean = (path.split('?')[0] || '').toLowerCase()
  if (clean === '/api/admin/settings/image') return MAX_UPLOAD_BODY_BYTES
  if (clean === '/api/admin/guests/import') return MAX_IMPORT_BODY_BYTES
  return MAX_JSON_BODY_BYTES
}
