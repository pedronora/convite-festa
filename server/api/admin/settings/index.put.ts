import { unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { partySettingsSchema } from '#shared/config/party'
import { zodMessage } from '#shared/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parsed = partySettingsSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Configurações inválidas',
      message: zodMessage(parsed.error),
      data: { fieldErrors: bodyFieldErrors(parsed.error) },
    })
  }

  const previous = await getPartySettings()
  const saved = await savePartySettings(parsed.data)

  if (
    previous.inviteImageUrl !== saved.inviteImageUrl &&
    previous.inviteImageUrl.startsWith('/api/invite-image/')
  ) {
    const oldName = previous.inviteImageUrl.replace('/api/invite-image/', '')
    if (/^[a-f0-9-]+\.(png|jpg|webp)$/.test(oldName)) {
      await unlink(resolve(uploadsDir(), oldName)).catch(() => {})
    }
  }

  console.info('[settings] updated')
  return saved
})
