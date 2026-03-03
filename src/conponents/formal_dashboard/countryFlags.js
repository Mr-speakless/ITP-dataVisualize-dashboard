import { countries as supportedCountryCodes } from 'country-flag-icons'
import * as FlagIcons from 'country-flag-icons/react/3x2'

const countryCodeOverrides = {
  Bolivia: 'BO',
  Brunei: 'BN',
  Burma: 'MM',
  'Congo (Brazzaville)': 'CG',
  'Congo (Kinshasa)': 'CD',
  "Cote d'Ivoire": 'CI',
  Laos: 'LA',
  Moldova: 'MD',
  Reunion: 'RE',
  Syria: 'SY',
  Tanzania: 'TZ',
  Vietnam: 'VN',
  'United States': 'US',
  US: 'US',
  'United Kingdom': 'GB',
  UK: 'GB',
  Iran: 'IR',
  'Taiwan*': 'TW',
  Taiwan: 'TW',
  'Korea, South': 'KR',
  'Korea, North': 'KP',
  Russia: 'RU',
  Venezuela: 'VE',
  Macau: 'MO',
  'Hong Kong': 'HK',
  Palestine: 'PS',
  'West Bank and Gaza': 'PS',
  Kosovo: 'XK',
  Micronesia: 'FM',
  'Holy See': 'VA',
}

// Manual country color map for selection markers.
// Colors are chosen by common-sense "dominant national flag color" rather than chart optimization.
const nationalColorHexByCode = {
  AE: '#00732F',
  AF: '#D32011',
  AL: '#D22630',
  AM: '#D90012',
  AO: '#CE1126',
  AR: '#74ACDF',
  AT: '#ED2939',
  AU: '#012169',
  AZ: '#00B5E2',
  BA: '#002F6C',
  BB: '#00267F',
  BD: '#006A4E',
  BE: '#FFD90C',
  BF: '#EF2B2D',
  BG: '#00966E',
  BH: '#CE1126',
  BI: '#1EB53A',
  BJ: '#008751',
  BN: '#F7E017',
  BO: '#D52B1E',
  BR: '#009B3A',
  BS: '#00ABC9',
  BT: '#FF4E12',
  BW: '#75AADB',
  BY: '#C8313E',
  BZ: '#003F87',
  CA: '#D80621',
  CD: '#007FFF',
  CG: '#009543',
  CH: '#D52B1E',
  CI: '#F77F00',
  CL: '#0039A6',
  CM: '#007A5E',
  CN: '#DE2910',
  CO: '#FCD116',
  CR: '#002B7F',
  CU: '#002A8F',
  CV: '#003893',
  CY: '#D57800',
  CZ: '#11457E',
  DE: '#000000',
  DJ: '#6AB2E7',
  DK: '#C60C30',
  DM: '#006B3F',
  DO: '#002D62',
  DZ: '#006233',
  EC: '#FFDD00',
  EE: '#4891D9',
  EG: '#CE1126',
  ER: '#12AD2B',
  ES: '#AA151B',
  ET: '#078930',
  FI: '#003580',
  FJ: '#68BFE5',
  FM: '#75B2DD',
  FR: '#0055A4',
  GA: '#009E60',
  GB: '#012169',
  GD: '#CE1126',
  GE: '#E8112D',
  GH: '#CE1126',
  GM: '#3A75C4',
  GN: '#CE1126',
  GQ: '#009E60',
  GR: '#0D5EAF',
  GT: '#4997D0',
  GW: '#CE1126',
  GY: '#009E49',
  HK: '#DE2910',
  HN: '#00BCE4',
  HR: '#C8102E',
  HT: '#00209F',
  HU: '#436F4D',
  ID: '#CE1126',
  IE: '#169B62',
  IL: '#0038B8',
  IN: '#FF9933',
  IQ: '#CE1126',
  IR: '#239F40',
  IS: '#02529C',
  IT: '#009246',
  JM: '#009B3A',
  JO: '#007A3D',
  JP: '#BC002D',
  KE: '#006600',
  KG: '#E8112D',
  KH: '#032EA1',
  KI: '#C8102E',
  KM: '#3D8E33',
  KP: '#024FA2',
  KR: '#C60C30',
  KW: '#007A3D',
  KZ: '#00AFCA',
  LA: '#CE1126',
  LB: '#00A651',
  LC: '#66CCFF',
  LI: '#002B7F',
  LK: '#8D153A',
  LR: '#BF0A30',
  LS: '#1E4AA8',
  LT: '#FDB913',
  LU: '#00A1DE',
  LV: '#9E3039',
  LY: '#239E46',
  MA: '#C1272D',
  MD: '#0046AE',
  ME: '#C40308',
  MG: '#FC3D32',
  MH: '#3B5AA3',
  MK: '#D20000',
  ML: '#14B53A',
  MM: '#FECB00',
  MN: '#C4272F',
  MO: '#00785E',
  MR: '#007A3D',
  MT: '#CF142B',
  MU: '#EA2839',
  MV: '#D21034',
  MW: '#CE1126',
  MX: '#006847',
  MY: '#010066',
  MZ: '#009739',
  NA: '#003580',
  NE: '#E15307',
  NG: '#008753',
  NI: '#0067C6',
  NL: '#21468B',
  NO: '#BA0C2F',
  NP: '#DC143C',
  NR: '#002B7F',
  NZ: '#00247D',
  OM: '#D40000',
  PA: '#005293',
  PE: '#D91023',
  PG: '#CE1126',
  PH: '#0038A8',
  PK: '#01411C',
  PL: '#DC143C',
  PS: '#007A3D',
  PT: '#046A38',
  PW: '#4AADD6',
  PY: '#D52B1E',
  QA: '#8A1538',
  RO: '#002B7F',
  RS: '#C6363C',
  RU: '#0039A6',
  RW: '#00A1DE',
  SA: '#006C35',
  SB: '#0051BA',
  SC: '#003F87',
  SD: '#D21034',
  SE: '#006AA7',
  SG: '#EF3340',
  SI: '#005DA4',
  SK: '#0B4EA2',
  SL: '#1EB53A',
  SM: '#5EB6E4',
  SN: '#00853F',
  SO: '#4189DD',
  SR: '#377E3F',
  SS: '#0F47AF',
  ST: '#12AD2B',
  SV: '#0047AB',
  SY: '#CE1126',
  SZ: '#3E5EB9',
  TD: '#002664',
  TG: '#006A4E',
  TH: '#2D2A4A',
  TJ: '#CC0000',
  TL: '#DA291C',
  TM: '#00843D',
  TN: '#E70013',
  TO: '#C10000',
  TR: '#E30A17',
  TT: '#CE1126',
  TV: '#5B97B1',
  TW: '#000095',
  TZ: '#1EB53A',
  UA: '#0057B7',
  UG: '#FCDC04',
  US: '#3C3B6E',
  UY: '#0038A8',
  UZ: '#1EB53A',
  VA: '#FFD700',
  VC: '#005DAA',
  VE: '#F4D900',
  VN: '#DA251D',
  VU: '#009543',
  WS: '#CE1126',
  XK: '#244AA5',
  YE: '#CE1126',
  ZA: '#007749',
  ZM: '#198A00',
  ZW: '#009739',
}

const fallbackNationalColors = [
  '#0057B7',
  '#C62828',
  '#1B8F3A',
  '#F4B400',
  '#5B4DB1',
  '#00838F',
  '#EF6C00',
  '#8E244D',
]

function normalizeCountryName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\*/g, '')
    .replace(/&/g, 'and')
    .replace(/[().,'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })

const generatedCountryNameToCode = supportedCountryCodes.reduce((accumulator, code) => {
  if (code.includes('-')) {
    return accumulator
  }

  const displayName = regionDisplayNames.of(code)

  if (displayName) {
    accumulator[normalizeCountryName(displayName)] = code
  }

  return accumulator
}, {})

function getFallbackNationalColor(countryCodeOrName) {
  if (!countryCodeOrName) {
    return fallbackNationalColors[0]
  }

  const hash = countryCodeOrName
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0)

  return fallbackNationalColors[hash % fallbackNationalColors.length]
}

export function getCountryCodeForRegion(regionName) {
  if (!regionName) {
    return null
  }

  const override = countryCodeOverrides[regionName]
  if (override) {
    return override
  }

  const normalizedRegion = normalizeCountryName(regionName)
  return generatedCountryNameToCode[normalizedRegion] ?? null
}

export function getFlagComponentForRegion(regionName) {
  const countryCode = getCountryCodeForRegion(regionName)

  if (!countryCode) {
    return null
  }

  return FlagIcons[countryCode.replace(/-/g, '_')] ?? null
}

export function getNationalColorForRegion(regionName) {
  const countryCode = getCountryCodeForRegion(regionName)

  if (!countryCode) {
    return getFallbackNationalColor(regionName)
  }

  return nationalColorHexByCode[countryCode] ?? getFallbackNationalColor(countryCode)
}
