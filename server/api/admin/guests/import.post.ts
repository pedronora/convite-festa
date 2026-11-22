import { CsvParseError } from '#shared/utils/csv'
import { GuestImportError } from '#shared/utils/guest-import'

function decodeCsv(data: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data)
  }
  catch {
    // Excel antigo costuma salvar CSV em Windows-1252.
    return new TextDecoder('windows-1252').decode(data)
  }
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  enforceScopedRateLimit(event, `guests:import:admin:${admin.id}`, 10, 60 * 60 * 1000)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data?.length)
  if (!file) {
    throw createError({ statusCode: 422, message: 'Selecione um arquivo CSV.' })
  }
  if (file.data.length > MAX_IMPORT_BODY_BYTES) {
    throw createError({ statusCode: 413, message: 'O arquivo deve ter no máximo 1 MB.' })
  }

  try {
    return await importGuests(decodeCsv(file.data))
  }
  catch (error) {
    if (error instanceof CsvParseError || error instanceof GuestImportError) {
      throw createError({ statusCode: 422, message: error.message })
    }
    throw error
  }
})
