import type { CountryCode } from 'libphonenumber-js'

export interface CountryOption {
  code: CountryCode
  name: string
  dialCode: string
}

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'BR'

/**
 * Lista estática de países para o seletor de telefone. Gerada uma única vez a
 * partir do metadata do libphonenumber e do Intl.DisplayNames em pt-BR, para
 * evitar divergência de hidratação entre servidor e navegador.
 */
export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  { code: 'BR', name: 'Brasil', dialCode: '55' },
  { code: 'AR', name: 'Argentina', dialCode: '54' },
  { code: 'US', name: 'Estados Unidos', dialCode: '1' },
  { code: 'AF', name: 'Afeganistão', dialCode: '93' },
  { code: 'ZA', name: 'África do Sul', dialCode: '27' },
  { code: 'AL', name: 'Albânia', dialCode: '355' },
  { code: 'DE', name: 'Alemanha', dialCode: '49' },
  { code: 'AD', name: 'Andorra', dialCode: '376' },
  { code: 'AO', name: 'Angola', dialCode: '244' },
  { code: 'AI', name: 'Anguila', dialCode: '1' },
  { code: 'AG', name: 'Antígua e Barbuda', dialCode: '1' },
  { code: 'SA', name: 'Arábia Saudita', dialCode: '966' },
  { code: 'DZ', name: 'Argélia', dialCode: '213' },
  { code: 'AM', name: 'Armênia', dialCode: '374' },
  { code: 'AW', name: 'Aruba', dialCode: '297' },
  { code: 'AU', name: 'Austrália', dialCode: '61' },
  { code: 'AT', name: 'Áustria', dialCode: '43' },
  { code: 'AZ', name: 'Azerbaijão', dialCode: '994' },
  { code: 'BS', name: 'Bahamas', dialCode: '1' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880' },
  { code: 'BB', name: 'Barbados', dialCode: '1' },
  { code: 'BH', name: 'Barein', dialCode: '973' },
  { code: 'BE', name: 'Bélgica', dialCode: '32' },
  { code: 'BZ', name: 'Belize', dialCode: '501' },
  { code: 'BJ', name: 'Benin', dialCode: '229' },
  { code: 'BM', name: 'Bermudas', dialCode: '1' },
  { code: 'BY', name: 'Bielorrússia', dialCode: '375' },
  { code: 'BO', name: 'Bolívia', dialCode: '591' },
  { code: 'BA', name: 'Bósnia e Herzegovina', dialCode: '387' },
  { code: 'BW', name: 'Botsuana', dialCode: '267' },
  { code: 'BN', name: 'Brunei', dialCode: '673' },
  { code: 'BG', name: 'Bulgária', dialCode: '359' },
  { code: 'BF', name: 'Burquina Faso', dialCode: '226' },
  { code: 'BI', name: 'Burundi', dialCode: '257' },
  { code: 'BT', name: 'Butão', dialCode: '975' },
  { code: 'CV', name: 'Cabo Verde', dialCode: '238' },
  { code: 'CM', name: 'Camarões', dialCode: '237' },
  { code: 'KH', name: 'Camboja', dialCode: '855' },
  { code: 'CA', name: 'Canadá', dialCode: '1' },
  { code: 'QA', name: 'Catar', dialCode: '974' },
  { code: 'KZ', name: 'Cazaquistão', dialCode: '7' },
  { code: 'TD', name: 'Chade', dialCode: '235' },
  { code: 'CL', name: 'Chile', dialCode: '56' },
  { code: 'CN', name: 'China', dialCode: '86' },
  { code: 'CY', name: 'Chipre', dialCode: '357' },
  { code: 'VA', name: 'Cidade do Vaticano', dialCode: '39' },
  { code: 'CO', name: 'Colômbia', dialCode: '57' },
  { code: 'KM', name: 'Comores', dialCode: '269' },
  { code: 'CD', name: 'Congo - Kinshasa', dialCode: '243' },
  { code: 'KP', name: 'Coreia do Norte', dialCode: '850' },
  { code: 'KR', name: 'Coreia do Sul', dialCode: '82' },
  { code: 'CI', name: 'Costa do Marfim', dialCode: '225' },
  { code: 'CR', name: 'Costa Rica', dialCode: '506' },
  { code: 'HR', name: 'Croácia', dialCode: '385' },
  { code: 'CU', name: 'Cuba', dialCode: '53' },
  { code: 'CW', name: 'Curaçao', dialCode: '599' },
  { code: 'DK', name: 'Dinamarca', dialCode: '45' },
  { code: 'DJ', name: 'Djibuti', dialCode: '253' },
  { code: 'DM', name: 'Dominica', dialCode: '1' },
  { code: 'EG', name: 'Egito', dialCode: '20' },
  { code: 'SV', name: 'El Salvador', dialCode: '503' },
  { code: 'AE', name: 'Emirados Árabes Unidos', dialCode: '971' },
  { code: 'EC', name: 'Equador', dialCode: '593' },
  { code: 'ER', name: 'Eritreia', dialCode: '291' },
  { code: 'SK', name: 'Eslováquia', dialCode: '421' },
  { code: 'SI', name: 'Eslovênia', dialCode: '386' },
  { code: 'ES', name: 'Espanha', dialCode: '34' },
  { code: 'SZ', name: 'Essuatíni', dialCode: '268' },
  { code: 'EE', name: 'Estônia', dialCode: '372' },
  { code: 'ET', name: 'Etiópia', dialCode: '251' },
  { code: 'FJ', name: 'Fiji', dialCode: '679' },
  { code: 'PH', name: 'Filipinas', dialCode: '63' },
  { code: 'FI', name: 'Finlândia', dialCode: '358' },
  { code: 'FR', name: 'França', dialCode: '33' },
  { code: 'GA', name: 'Gabão', dialCode: '241' },
  { code: 'GM', name: 'Gâmbia', dialCode: '220' },
  { code: 'GH', name: 'Gana', dialCode: '233' },
  { code: 'GE', name: 'Geórgia', dialCode: '995' },
  { code: 'GI', name: 'Gibraltar', dialCode: '350' },
  { code: 'GD', name: 'Granada', dialCode: '1' },
  { code: 'GR', name: 'Grécia', dialCode: '30' },
  { code: 'GL', name: 'Groenlândia', dialCode: '299' },
  { code: 'GP', name: 'Guadalupe', dialCode: '590' },
  { code: 'GU', name: 'Guam', dialCode: '1' },
  { code: 'GT', name: 'Guatemala', dialCode: '502' },
  { code: 'GG', name: 'Guernsey', dialCode: '44' },
  { code: 'GY', name: 'Guiana', dialCode: '592' },
  { code: 'GF', name: 'Guiana Francesa', dialCode: '594' },
  { code: 'GN', name: 'Guiné', dialCode: '224' },
  { code: 'GQ', name: 'Guiné Equatorial', dialCode: '240' },
  { code: 'GW', name: 'Guiné-Bissau', dialCode: '245' },
  { code: 'HT', name: 'Haiti', dialCode: '509' },
  { code: 'HN', name: 'Honduras', dialCode: '504' },
  { code: 'HK', name: 'Hong Kong, RAE da China', dialCode: '852' },
  { code: 'HU', name: 'Hungria', dialCode: '36' },
  { code: 'YE', name: 'Iêmen', dialCode: '967' },
  { code: 'CX', name: 'Ilha Christmas', dialCode: '61' },
  { code: 'AC', name: 'Ilha de Ascensão', dialCode: '247' },
  { code: 'IM', name: 'Ilha de Man', dialCode: '44' },
  { code: 'NF', name: 'Ilha Norfolk', dialCode: '672' },
  { code: 'AX', name: 'Ilhas Aland', dialCode: '358' },
  { code: 'KY', name: 'Ilhas Cayman', dialCode: '1' },
  { code: 'CC', name: 'Ilhas Cocos (Keeling)', dialCode: '61' },
  { code: 'CK', name: 'Ilhas Cook', dialCode: '682' },
  { code: 'FO', name: 'Ilhas Faroé', dialCode: '298' },
  { code: 'FK', name: 'Ilhas Malvinas', dialCode: '500' },
  { code: 'MP', name: 'Ilhas Marianas do Norte', dialCode: '1' },
  { code: 'MH', name: 'Ilhas Marshall', dialCode: '692' },
  { code: 'SB', name: 'Ilhas Salomão', dialCode: '677' },
  { code: 'TC', name: 'Ilhas Turcas e Caicos', dialCode: '1' },
  { code: 'VI', name: 'Ilhas Virgens Americanas', dialCode: '1' },
  { code: 'VG', name: 'Ilhas Virgens Britânicas', dialCode: '1' },
  { code: 'IN', name: 'Índia', dialCode: '91' },
  { code: 'ID', name: 'Indonésia', dialCode: '62' },
  { code: 'IR', name: 'Irã', dialCode: '98' },
  { code: 'IQ', name: 'Iraque', dialCode: '964' },
  { code: 'IE', name: 'Irlanda', dialCode: '353' },
  { code: 'IS', name: 'Islândia', dialCode: '354' },
  { code: 'IL', name: 'Israel', dialCode: '972' },
  { code: 'IT', name: 'Itália', dialCode: '39' },
  { code: 'JM', name: 'Jamaica', dialCode: '1' },
  { code: 'JP', name: 'Japão', dialCode: '81' },
  { code: 'JE', name: 'Jersey', dialCode: '44' },
  { code: 'JO', name: 'Jordânia', dialCode: '962' },
  { code: 'XK', name: 'Kosovo', dialCode: '383' },
  { code: 'KW', name: 'Kuwait', dialCode: '965' },
  { code: 'LA', name: 'Laos', dialCode: '856' },
  { code: 'LS', name: 'Lesoto', dialCode: '266' },
  { code: 'LV', name: 'Letônia', dialCode: '371' },
  { code: 'LB', name: 'Líbano', dialCode: '961' },
  { code: 'LR', name: 'Libéria', dialCode: '231' },
  { code: 'LY', name: 'Líbia', dialCode: '218' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '423' },
  { code: 'LT', name: 'Lituânia', dialCode: '370' },
  { code: 'LU', name: 'Luxemburgo', dialCode: '352' },
  { code: 'MO', name: 'Macau, RAE da China', dialCode: '853' },
  { code: 'MK', name: 'Macedônia do Norte', dialCode: '389' },
  { code: 'MG', name: 'Madagascar', dialCode: '261' },
  { code: 'MY', name: 'Malásia', dialCode: '60' },
  { code: 'MW', name: 'Malaui', dialCode: '265' },
  { code: 'MV', name: 'Maldivas', dialCode: '960' },
  { code: 'ML', name: 'Mali', dialCode: '223' },
  { code: 'MT', name: 'Malta', dialCode: '356' },
  { code: 'MA', name: 'Marrocos', dialCode: '212' },
  { code: 'MQ', name: 'Martinica', dialCode: '596' },
  { code: 'MU', name: 'Maurício', dialCode: '230' },
  { code: 'MR', name: 'Mauritânia', dialCode: '222' },
  { code: 'YT', name: 'Mayotte', dialCode: '262' },
  { code: 'MX', name: 'México', dialCode: '52' },
  { code: 'MM', name: 'Mianmar (Birmânia)', dialCode: '95' },
  { code: 'FM', name: 'Micronésia', dialCode: '691' },
  { code: 'MZ', name: 'Moçambique', dialCode: '258' },
  { code: 'MD', name: 'Moldávia', dialCode: '373' },
  { code: 'MC', name: 'Mônaco', dialCode: '377' },
  { code: 'MN', name: 'Mongólia', dialCode: '976' },
  { code: 'ME', name: 'Montenegro', dialCode: '382' },
  { code: 'MS', name: 'Montserrat', dialCode: '1' },
  { code: 'NA', name: 'Namíbia', dialCode: '264' },
  { code: 'NR', name: 'Nauru', dialCode: '674' },
  { code: 'NP', name: 'Nepal', dialCode: '977' },
  { code: 'NI', name: 'Nicarágua', dialCode: '505' },
  { code: 'NE', name: 'Níger', dialCode: '227' },
  { code: 'NG', name: 'Nigéria', dialCode: '234' },
  { code: 'NU', name: 'Niue', dialCode: '683' },
  { code: 'NO', name: 'Noruega', dialCode: '47' },
  { code: 'NC', name: 'Nova Caledônia', dialCode: '687' },
  { code: 'NZ', name: 'Nova Zelândia', dialCode: '64' },
  { code: 'OM', name: 'Omã', dialCode: '968' },
  { code: 'NL', name: 'Países Baixos', dialCode: '31' },
  { code: 'BQ', name: 'Países Baixos Caribenhos', dialCode: '599' },
  { code: 'PW', name: 'Palau', dialCode: '680' },
  { code: 'PA', name: 'Panamá', dialCode: '507' },
  { code: 'PG', name: 'Papua-Nova Guiné', dialCode: '675' },
  { code: 'PK', name: 'Paquistão', dialCode: '92' },
  { code: 'PY', name: 'Paraguai', dialCode: '595' },
  { code: 'PE', name: 'Peru', dialCode: '51' },
  { code: 'PF', name: 'Polinésia Francesa', dialCode: '689' },
  { code: 'PL', name: 'Polônia', dialCode: '48' },
  { code: 'PR', name: 'Porto Rico', dialCode: '1' },
  { code: 'PT', name: 'Portugal', dialCode: '351' },
  { code: 'KE', name: 'Quênia', dialCode: '254' },
  { code: 'KG', name: 'Quirguistão', dialCode: '996' },
  { code: 'KI', name: 'Quiribati', dialCode: '686' },
  { code: 'GB', name: 'Reino Unido', dialCode: '44' },
  { code: 'CF', name: 'República Centro-Africana', dialCode: '236' },
  { code: 'CG', name: 'República do Congo', dialCode: '242' },
  { code: 'DO', name: 'República Dominicana', dialCode: '1' },
  { code: 'RE', name: 'Reunião', dialCode: '262' },
  { code: 'RO', name: 'Romênia', dialCode: '40' },
  { code: 'RW', name: 'Ruanda', dialCode: '250' },
  { code: 'RU', name: 'Rússia', dialCode: '7' },
  { code: 'EH', name: 'Saara Ocidental', dialCode: '212' },
  { code: 'WS', name: 'Samoa', dialCode: '685' },
  { code: 'AS', name: 'Samoa Americana', dialCode: '1' },
  { code: 'SM', name: 'San Marino', dialCode: '378' },
  { code: 'SH', name: 'Santa Helena', dialCode: '290' },
  { code: 'LC', name: 'Santa Lúcia', dialCode: '1' },
  { code: 'BL', name: 'São Bartolomeu', dialCode: '590' },
  { code: 'KN', name: 'São Cristóvão e Névis', dialCode: '1' },
  { code: 'MF', name: 'São Martinho', dialCode: '590' },
  { code: 'PM', name: 'São Pedro e Miquelão', dialCode: '508' },
  { code: 'ST', name: 'São Tomé e Príncipe', dialCode: '239' },
  { code: 'VC', name: 'São Vicente e Granadinas', dialCode: '1' },
  { code: 'SC', name: 'Seicheles', dialCode: '248' },
  { code: 'SN', name: 'Senegal', dialCode: '221' },
  { code: 'SL', name: 'Serra Leoa', dialCode: '232' },
  { code: 'RS', name: 'Sérvia', dialCode: '381' },
  { code: 'SG', name: 'Singapura', dialCode: '65' },
  { code: 'SX', name: 'Sint Maarten', dialCode: '1' },
  { code: 'SY', name: 'Síria', dialCode: '963' },
  { code: 'SO', name: 'Somália', dialCode: '252' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '94' },
  { code: 'SD', name: 'Sudão', dialCode: '249' },
  { code: 'SS', name: 'Sudão do Sul', dialCode: '211' },
  { code: 'SE', name: 'Suécia', dialCode: '46' },
  { code: 'CH', name: 'Suíça', dialCode: '41' },
  { code: 'SR', name: 'Suriname', dialCode: '597' },
  { code: 'SJ', name: 'Svalbard e Jan Mayen', dialCode: '47' },
  { code: 'TJ', name: 'Tadjiquistão', dialCode: '992' },
  { code: 'TH', name: 'Tailândia', dialCode: '66' },
  { code: 'TW', name: 'Taiwan', dialCode: '886' },
  { code: 'TZ', name: 'Tanzânia', dialCode: '255' },
  { code: 'CZ', name: 'Tchéquia', dialCode: '420' },
  { code: 'IO', name: 'Território Britânico do Oceano Índico', dialCode: '246' },
  { code: 'PS', name: 'Territórios palestinos', dialCode: '970' },
  { code: 'TL', name: 'Timor-Leste', dialCode: '670' },
  { code: 'TG', name: 'Togo', dialCode: '228' },
  { code: 'TK', name: 'Tokelau', dialCode: '690' },
  { code: 'TO', name: 'Tonga', dialCode: '676' },
  { code: 'TT', name: 'Trinidad e Tobago', dialCode: '1' },
  { code: 'TA', name: 'Tristão da Cunha', dialCode: '290' },
  { code: 'TN', name: 'Tunísia', dialCode: '216' },
  { code: 'TM', name: 'Turcomenistão', dialCode: '993' },
  { code: 'TR', name: 'Turquia', dialCode: '90' },
  { code: 'TV', name: 'Tuvalu', dialCode: '688' },
  { code: 'UA', name: 'Ucrânia', dialCode: '380' },
  { code: 'UG', name: 'Uganda', dialCode: '256' },
  { code: 'UY', name: 'Uruguai', dialCode: '598' },
  { code: 'UZ', name: 'Uzbequistão', dialCode: '998' },
  { code: 'VU', name: 'Vanuatu', dialCode: '678' },
  { code: 'VE', name: 'Venezuela', dialCode: '58' },
  { code: 'VN', name: 'Vietnã', dialCode: '84' },
  { code: 'WF', name: 'Wallis e Futuna', dialCode: '681' },
  { code: 'ZM', name: 'Zâmbia', dialCode: '260' },
  { code: 'ZW', name: 'Zimbábue', dialCode: '263' },
]

const COUNTRY_CODES = new Set<string>(COUNTRY_OPTIONS.map(option => option.code))
const COUNTRY_BY_CODE = new Map<string, CountryOption>(COUNTRY_OPTIONS.map(option => [option.code, option]))

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRY_CODES.has(value)
}

export function countryOption(code: CountryCode): CountryOption | undefined {
  return COUNTRY_BY_CODE.get(code)
}

export function countryLabel(code: CountryCode): string {
  const option = COUNTRY_BY_CODE.get(code)
  return option ? `${option.name} (+${option.dialCode})` : code
}

/** Transforma o código ISO em bandeira (emoji), ex.: "BR" -> "🇧🇷". */
export function countryFlag(code: CountryCode): string {
  return [...code.toUpperCase()]
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

function normalizeCountrySearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Busca países por nome (sem acento), código ISO ou DDI. A ordem original é
 * mantida, então Brasil, Argentina e Estados Unidos continuam no topo.
 */
export function searchCountries(query: string): readonly CountryOption[] {
  const term = normalizeCountrySearch(query)
  if (!term) return COUNTRY_OPTIONS

  const dialTerm = term.replace(/\D/g, '')
  const exactDial = term.startsWith('+')

  return COUNTRY_OPTIONS.filter((option) => {
    const name = normalizeCountrySearch(option.name)
    const code = option.code.toLowerCase()
    const dialMatches = dialTerm !== ''
      && (exactDial ? option.dialCode === dialTerm : option.dialCode.startsWith(dialTerm))

    return name.includes(term) || code === term || dialMatches
  })
}
