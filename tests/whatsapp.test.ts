import { describe, expect, it } from 'vitest'
import {
  telUrl,
  whatsappChatUrl,
  whatsappShareUrl,
  whatsappUrl,
} from '../shared/utils/whatsapp'

describe('links de telefone', () => {
  it('gera link do WhatsApp codificando a mensagem', () => {
    const url = whatsappUrl('5545999998888', 'Olá, Luigi & Marco!')
    expect(url).toBe('https://api.whatsapp.com/send?phone=5545999998888&text=Ol%C3%A1%2C%20Luigi%20%26%20Marco!')
  })

  it('preserva emojis no texto do link', () => {
    const url = whatsappUrl('5545999998888', 'Festa 🎉🕸️🕷️')
    expect(new URL(url).searchParams.get('text')).toBe('Festa 🎉🕸️🕷️')
  })

  it('aceita números internacionais em E.164', () => {
    expect(whatsappChatUrl('+1 (202) 555-0143'))
      .toBe('https://api.whatsapp.com/send?phone=12025550143')
  })

  it('gera link de compartilhamento sem telefone', () => {
    expect(whatsappShareUrl('Oi 🎉'))
      .toBe('https://api.whatsapp.com/send?text=Oi%20%F0%9F%8E%89')
  })

  it('gera link de conversa com o número normalizado', () => {
    expect(whatsappChatUrl('5545999998888'))
      .toBe('https://api.whatsapp.com/send?phone=5545999998888')
  })

  it('gera link tel: com o número normalizado', () => {
    expect(telUrl('5545999998888')).toBe('tel:+5545999998888')
  })
})
