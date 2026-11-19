import { z } from 'zod'

export const celebrantSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(60),
  age: z.coerce.number().int('Idade inválida').min(0).max(120),
})

const dateTimeString = z
  .string()
  .trim()
  .refine(value => !Number.isNaN(Date.parse(value)), 'Data e hora inválidas')

export const partySettingsSchema = z.object({
  celebrants: z.array(celebrantSchema).min(1, 'Informe ao menos um aniversariante').max(4),
  partyDate: dateTimeString,
  dateLabel: z.string().trim().min(1).max(80),
  timeLabel: z.string().trim().min(1).max(40),
  venue: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(200),
  neighborhood: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().length(2, 'Use a sigla (ex.: PR)').toUpperCase(),
  mapsQuery: z.string().trim().min(1).max(400),
  inviteImageUrl: z
    .string()
    .trim()
    .min(1)
    .regex(/^\/[A-Za-z0-9/_.-]+$/, 'Caminho de imagem inválido')
    .refine(
      value => value.startsWith('/images/') || value.startsWith('/api/invite-image/'),
      'Caminho de imagem inválido',
    ),
  whatsappTemplate: z
    .string()
    .trim()
    .min(30, 'A mensagem está muito curta')
    .max(4000)
    .refine(value => value.includes('[LINK]'), 'A mensagem precisa conter o marcador [LINK]'),
  rsvpIntro: z.string().trim().min(10, 'Escreva uma introdução').max(600),
  successMessage: z.string().trim().min(10).max(600),
  declineMessage: z.string().trim().min(10).max(600),
  maxGuestsDefault: z.coerce.number().int().min(1).max(50).nullable().optional(),
})

export type PartySettings = z.infer<typeof partySettingsSchema>

export const defaultPartySettings: PartySettings = {
  celebrants: [
    { name: 'Luigi', age: 3 },
    { name: 'Marco Antonio', age: 1 },
  ],
  partyDate: '2027-01-23T15:00:00-03:00',
  dateLabel: '23 de janeiro',
  timeLabel: '15h',
  venue: 'Recanto Família Fernandes',
  address: 'Rua Ernani Inocêncio de Medeiros, 380',
  neighborhood: 'Santos Dumont',
  city: 'Cascavel',
  state: 'PR',
  mapsQuery: 'Rua Ernani Inocêncio de Medeiros, 380 - Santos Dumont, Cascavel - PR',
  inviteImageUrl: '/images/convite-luigi-marco.jpg',
  whatsappTemplate: `Olá, [Nome]! ❤️

Estamos preparando uma comemoração muito especial para celebrar os 3 anos do Luigi e o 1º aninho do Marco Antonio, e gostaríamos muito de contar com sua presença!

🎉 [DATA], às [HORARIO]
📍 [LOCAL] — [CIDADE]

Confirme sua presença pelo link abaixo:

[LINK]

Esperamos vocês! 🕸️🕷️`,
  rsvpIntro:
    'Sua presença é o melhor presente! Confirme abaixo para nos ajudar a preparar tudo com muito carinho.',
  successMessage:
    'Oba! Sua presença foi confirmada! Estamos preparando uma festa muito especial para comemorar os aniversários do Luigi e do Marco Antonio. Esperamos vocês!',
  declineMessage:
    'Agradecemos muito o carinho em responder. Sentiremos sua falta, mas entendemos! Obrigado por nos avisar. ❤️',
  maxGuestsDefault: null,
}
