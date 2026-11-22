import type { GuestImportResult } from '#shared/types'
import { parseCsv } from '#shared/utils/csv'
import { planGuestImport } from '#shared/utils/guest-import'

/**
 * Importa convidados de um CSV já decodificado. As linhas aceitas entram em
 * uma única transação, criando o convidado e o convite individual; as linhas
 * inválidas ou duplicadas voltam no relatório para a tela.
 */
export async function importGuests(text: string): Promise<GuestImportResult> {
  const csv = parseCsv(text)
  const db = useDb()
  const existing = await db
    .select({ phone: schema.guests.phone, name: schema.guests.name })
    .from(schema.guests)
  const plan = planGuestImport(csv, existing)

  if (plan.imported.length) {
    await db.transaction(async (tx) => {
      for (const guest of plan.imported) {
        const [row] = await tx
          .insert(schema.guests)
          .values({
            name: guest.name,
            phone: guest.phone,
            email: guest.email,
            groupName: guest.groupName,
            notes: guest.notes,
            estimatedGuests: guest.estimatedGuests,
            maxGuests: guest.maxGuests,
          })
          .returning({ id: schema.guests.id })

        if (!row) {
          throw createError({
            statusCode: 500,
            message: 'Não foi possível importar os convidados.',
          })
        }

        await tx.insert(schema.invitations).values({ guestId: row.id })
      }
    })
  }

  console.info('[guests] imported', {
    imported: plan.imported.length,
    skipped: plan.skipped.length,
  })

  return plan
}
