import { describe, expect, it } from 'vitest'
import { isWeakPassword, MIN_PASSWORD_LENGTH, passwordPolicyError } from '../shared/utils/password-policy'

describe('passwordPolicyError', () => {
  it('exige o comprimento mínimo', () => {
    expect(passwordPolicyError('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toContain('12 caracteres')
  })

  it('aceita uma senha longa e inédita', () => {
    expect(passwordPolicyError('festa-do-luigi-2027')).toBeNull()
  })

  it('recusa os exemplos do projeto, ignorando caixa e espaços', () => {
    expect(passwordPolicyError('  Troque-Esta-Senha  ')).toContain('exemplos do projeto')
    expect(isWeakPassword('PASSWORD123')).toBe(true)
  })

  it('não considera fraca uma senha apenas parecida com o exemplo', () => {
    expect(isWeakPassword('troque-esta-senha-2027')).toBe(false)
  })
})
