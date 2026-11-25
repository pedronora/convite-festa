import { describe, expect, it } from 'vitest'
import {
  COUNTRY_OPTIONS,
  DEFAULT_PHONE_COUNTRY,
  countryFlag,
  countryLabel,
  searchCountries,
} from '../shared/config/countries'

describe('países do telefone', () => {
  it('gera a bandeira a partir do código ISO', () => {
    expect(countryFlag('BR')).toBe('🇧🇷')
    expect(countryFlag('AR')).toBe('🇦🇷')
    expect(countryFlag('US')).toBe('🇺🇸')
  })

  it('descreve o país com o DDI', () => {
    expect(countryLabel('BR')).toBe('Brasil (+55)')
    expect(countryLabel('AR')).toBe('Argentina (+54)')
  })

  it('mantém o Brasil como padrão e no topo da lista', () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe('BR')
    expect(COUNTRY_OPTIONS.slice(0, 3).map(option => option.code)).toEqual(['BR', 'AR', 'US'])
  })
})

describe('searchCountries', () => {
  it('devolve todos os países quando a busca está vazia', () => {
    expect(searchCountries('')).toHaveLength(COUNTRY_OPTIONS.length)
  })

  it('busca pelo nome sem diferenciar acentos', () => {
    expect(searchCountries('argentina')[0]?.code).toBe('AR')
    expect(searchCountries('africa').some(option => option.code === 'ZA')).toBe(true)
  })

  it('busca pelo nome completo', () => {
    expect(searchCountries('estados unidos')[0]?.code).toBe('US')
  })

  it('busca pelo DDI com e sem o sinal de mais', () => {
    expect(searchCountries('+55')[0]?.code).toBe('BR')
    expect(searchCountries('54')[0]?.code).toBe('AR')
  })

  it('busca pelo código ISO', () => {
    expect(searchCountries('us')[0]?.code).toBe('US')
  })

  it('devolve lista vazia quando não encontra', () => {
    expect(searchCountries('zzzz')).toEqual([])
  })
})
