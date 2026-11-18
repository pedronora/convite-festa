import { eq } from 'drizzle-orm'
import { defaultPartySettings, partySettingsSchema, type PartySettings } from '#shared/config/party'

function cloneDefaults(): PartySettings {
  return JSON.parse(JSON.stringify(defaultPartySettings)) as PartySettings
}

/** Configurações efetivas: defaults + valores persistidos, sempre validados. */
export async function getPartySettings(): Promise<PartySettings> {
  const db = useDb()
  const [row] = await db.select().from(schema.partySettings).where(eq(schema.partySettings.id, 1)).limit(1)
  if (!row) return cloneDefaults()
  const parsed = partySettingsSchema.safeParse({ ...cloneDefaults(), ...row.data })
  if (!parsed.success) {
    console.warn('[settings] Configurações inválidas no banco; usando padrões.')
    return cloneDefaults()
  }
  return parsed.data
}

export async function savePartySettings(settings: PartySettings): Promise<PartySettings> {
  const db = useDb()
  const data = partySettingsSchema.parse(settings)
  await db
    .insert(schema.partySettings)
    .values({ id: 1, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.partySettings.id,
      set: { data, updatedAt: new Date() },
    })
  return data
}

export function inviteImageAbsolutePath(imageUrl: string): string | null {
  if (imageUrl.startsWith('/api/invite-image/')) {
    return imageUrl.replace('/api/invite-image/', '')
  }
  return null
}
