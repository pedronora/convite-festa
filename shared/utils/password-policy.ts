export const MIN_PASSWORD_LENGTH = 12

const WEAK_PASSWORDS = new Set([
  'troque-esta-senha',
  'troque-por-uma-senha-longa-e-unica',
  'changeme',
  'password',
  'password123',
  'senha123456',
  'admin123456',
])

export function isWeakPassword(value: string): boolean {
  return WEAK_PASSWORDS.has(value.trim().toLowerCase())
}

/** Retorna a mensagem do primeiro problema encontrado, ou null se a senha serve. */
export function passwordPolicyError(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (isWeakPassword(value)) {
    return 'Escolha uma senha diferente dos exemplos do projeto.'
  }
  return null
}
