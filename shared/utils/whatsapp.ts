import { onlyDigits } from './digits'

// O redirect do wa.me corrompe UTF-8 de 4 bytes (emojis) no parâmetro `text`,
// trocando cada caractere por U+FFFD. O endpoint final preserva o texto.
const WHATSAPP_SEND_URL = 'https://api.whatsapp.com/send'

// Os links recebem o telefone já normalizado em E.164 (sem "+"). Entradas
// locais devem passar antes por normalizePhone.
export function whatsappUrl(phone: string, message: string): string {
  return `${WHATSAPP_SEND_URL}?phone=${onlyDigits(phone)}&text=${encodeURIComponent(message)}`
}

/** Compartilhar sem destinatário definido (o WhatsApp pede o contato). */
export function whatsappShareUrl(message: string): string {
  return `${WHATSAPP_SEND_URL}?text=${encodeURIComponent(message)}`
}

/** Abrir conversa com um número, sem mensagem pré-preenchida. */
export function whatsappChatUrl(phone: string): string {
  return `${WHATSAPP_SEND_URL}?phone=${onlyDigits(phone)}`
}

export function telUrl(phone: string): string {
  return `tel:+${onlyDigits(phone)}`
}
