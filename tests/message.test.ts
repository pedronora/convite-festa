import { describe, expect, it } from 'vitest'
import { defaultPartySettings, partySettingsSchema } from '../shared/config/party'
import {
  buildInvitationLink,
  celebrantAgeLabel,
  celebrantNames,
  celebrantsAgesLabel,
  formatDayMonth,
  inviteeFirstName,
  renderInviteMessage,
  whatsappPreview,
} from '../shared/utils/format'

describe('renderInviteMessage', () => {
  it('substitui os marcadores do modelo', () => {
    const message = renderInviteMessage(
      'Oi [Nome]! Festa de [FESTA] em [DATA], às [HORARIO], no [LOCAL]. [ENDERECO] — [CIDADE]. [LINK]',
      {
        name: 'João',
        link: 'https://festa.test/convite/abc',
        settings: defaultPartySettings,
      },
    )

    expect(message).toContain('Oi João!')
    expect(message).toContain('Festa de Luigi e Marco Antonio')
    expect(message).toContain('23 de janeiro')
    expect(message).toContain('15h')
    expect(message).toContain('Recanto Família Fernandes')
    expect(message).toContain('Rua Ernani Inocêncio de Medeiros, 380')
    expect(message).toContain('Cascavel — PR')
    expect(message).toContain('https://festa.test/convite/abc')
  })

  it('mantém marcadores desconhecidos intactos', () => {
    const message = renderInviteMessage('Olá [Nome], [DESCONHECIDO]', {
      name: 'Ana',
      link: 'x',
      settings: defaultPartySettings,
    })
    expect(message).toBe('Olá Ana, [DESCONHECIDO]')
  })

  it('não interpreta conteúdo do nome como marcador', () => {
    const message = renderInviteMessage('[Nome]', {
      name: '[LINK]',
      link: 'https://festa.test',
      settings: defaultPartySettings,
    })
    expect(message).toBe('[LINK]')
  })

  it('gera prévia com o modelo persistido', () => {
    expect(whatsappPreview(defaultPartySettings, 'Bia', 'https://x.test/convite/1'))
      .toContain('https://x.test/convite/1')
  })

  it('leva o convidado direto ao formulário de confirmação', () => {
    const link = buildInvitationLink('https://festa.test', 'abc')
    expect(link).toBe('https://festa.test/convite/abc#rsvp')
    expect(whatsappPreview(defaultPartySettings, 'Bia', link)).toContain(link)
  })
})

describe('utilitários de convite', () => {
  it('extrai o primeiro nome', () => {
    expect(inviteeFirstName('  Marco Antonio Fernandes ')).toBe('Marco')
    expect(inviteeFirstName('')).toBe('')
  })

  it('monta o link já ancorado no formulário de confirmação', () => {
    expect(buildInvitationLink('https://festa.test/', 'uuid-1'))
      .toBe('https://festa.test/convite/uuid-1#rsvp')
    expect(buildInvitationLink('https://festa.test', 'uuid-1'))
      .toBe('https://festa.test/convite/uuid-1#rsvp')
  })

  it('formata idades e nomes dos aniversariantes', () => {
    expect(celebrantAgeLabel(1)).toBe('1 aninho')
    expect(celebrantAgeLabel(3)).toBe('3 anos')
    expect(celebrantsAgesLabel([{ age: 3 }, { age: 1 }])).toBe('3 anos & 1 aninho')
    expect(celebrantNames([{ name: 'Luigi' }, { name: 'Marco Antonio' }]))
      .toBe('Luigi e Marco Antonio')
  })

  it('mostra o dia e o mês no fuso da festa', () => {
    expect(formatDayMonth('2027-01-23T15:00:00-03:00')).toBe('23/01')
    expect(formatDayMonth('inválido')).toBe('—')
    expect(formatDayMonth(null)).toBe('—')
  })
})

describe('configurações padrão', () => {
  it('passam na validação', () => {
    expect(partySettingsSchema.safeParse(defaultPartySettings).success).toBe(true)
  })

  it('exigem o marcador [LINK] no modelo de mensagem', () => {
    const parsed = partySettingsSchema.safeParse({
      ...defaultPartySettings,
      whatsappTemplate: 'Mensagem sem o marcador obrigatório de link.',
    })
    expect(parsed.success).toBe(false)
  })

  it('exigem UF com duas letras', () => {
    expect(partySettingsSchema.safeParse({ ...defaultPartySettings, state: 'Paraná' }).success)
      .toBe(false)
  })

  it('recusam caminho de imagem externo', () => {
    expect(partySettingsSchema.safeParse({
      ...defaultPartySettings,
      inviteImageUrl: 'https://exemplo.com/convite.png',
    }).success).toBe(false)
  })
})
