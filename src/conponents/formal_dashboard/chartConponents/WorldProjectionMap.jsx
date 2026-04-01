import { useEffect, useMemo, useRef, useState } from 'react'
import australiaMapSvg from '../../../assets/AustraliaMap.svg?raw'
import belgiumMapSvg from '../../../assets/BelgiumMap.svg?raw'
import brazilMapSvg from '../../../assets/BrazilMap.svg?raw'
import canadaMapSvg from '../../../assets/CanadaMap.svg?raw'
import chileMapSvg from '../../../assets/Chile.svg?raw'
import colombiaMapSvg from '../../../assets/ColombiaMap.svg?raw'
import denmarkMapSvg from '../../../assets/DenmarkMap.svg?raw'
import franceMapSvg from '../../../assets/FranceMap.svg?raw'
import germanyMapSvg from '../../../assets/GermanyMap.svg?raw'
import indiaMapSvg from '../../../assets/IndiaMap.svg?raw'
import italianMapSvg from '../../../assets/ItalyMap.svg?raw'
import japaneseMapSvg from '../../../assets/JapaneseMap.svg?raw'
import malaysiaMapSvg from '../../../assets/MalaysiaMap.svg?raw'
import mapIncludedCountry from '../../../assets/mapIncludedCountry.json'
import mexicoMapSvg from '../../../assets/MexicoMap.svg?raw'
import netherlandsMapSvg from '../../../assets/NetherlandsMap.svg?raw'
import newZealandMapSvg from '../../../assets/NewZealandMap.svg?raw'
import pakistanMapSvg from '../../../assets/PakistanMap.svg?raw'
import peruMapSvg from '../../../assets/PeruMap.svg?raw'
import russiaMapSvg from '../../../assets/RussiaMap.svg?raw'
import spainMapSvg from '../../../assets/SpainMap.svg?raw'
import swedenMapSvg from '../../../assets/SwedenMap.svg?raw'
import ukraineMapSvg from '../../../assets/UkraineMap.svg?raw'
import unitedKingdomMapSvg from '../../../assets/United KingdomMap.svg?raw'
import unitedStatesMapSvg from '../../../assets/UnitedStatesMap.svg?raw'
import worldMapSvg from '../../../assets/world.svg?raw'
import {
  formatDashboardNumber,
  getDisplayValue,
  getTimeModeLabel,
} from '../worldData.js'
import { getCountryCodeForRegion, getNationalColorForRegion } from '../countryFlags.js'

const heatScaleColors = ['#eaf6fb', '#c4e0ed', '#87bfd4', '#3a88a8', '#0b4662']
const noDataFillColor = '#dde7ec'
const mapSvgClassName = 'world-projection-map-svg'

function prepareMapSvg(svgRaw = '') {
  return String(svgRaw ?? '')
    .replace(/<\?xml[\s\S]*?\?>/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/viewbox=/i, 'viewBox=')
}

const preparedWorldMapSvg = prepareMapSvg(worldMapSvg)
const regionalMapRawByCountryName = Object.freeze({
  Australia: australiaMapSvg,
  Belgium: belgiumMapSvg,
  Brazil: brazilMapSvg,
  Canada: canadaMapSvg,
  Chile: chileMapSvg,
  Colombia: colombiaMapSvg,
  Denmark: denmarkMapSvg,
  France: franceMapSvg,
  Germany: germanyMapSvg,
  India: indiaMapSvg,
  Italy: italianMapSvg,
  Japan: japaneseMapSvg,
  Malaysia: malaysiaMapSvg,
  Mexico: mexicoMapSvg,
  Netherlands: netherlandsMapSvg,
  'New Zealand': newZealandMapSvg,
  Pakistan: pakistanMapSvg,
  Peru: peruMapSvg,
  Russia: russiaMapSvg,
  Spain: spainMapSvg,
  Sweden: swedenMapSvg,
  Ukraine: ukraineMapSvg,
  'United Kingdom': unitedKingdomMapSvg,
  'United States': unitedStatesMapSvg,
})
const preparedRegionalMapSvgByCountryName = Object.entries(regionalMapRawByCountryName).reduce(
  (accumulator, [countryName, svgRaw]) => {
    accumulator[countryName] = prepareMapSvg(svgRaw)
    return accumulator
  },
  {}
)

const mapNameAliases = {
  'c te d ivoire': 'CI',
  'cote d ivoire': 'CI',
  curaao: 'CW',
  curacao: 'CW',
  'dem rep korea': 'KP',
  'lao pdr': 'LA',
  'saint barth lemy': 'BL',
}

const regionalMapNameAliasesByCountry = Object.freeze({
  Brazil: {
    amapa: 'amap',
    ceara: 'cear',
    'espirito santo': 'esp rito santo',
    goias: 'goi s',
    maranhao: 'maranh o',
    para: 'par',
    paraiba: 'para ba',
    parana: 'paran',
    piaui: 'piau',
    rondonia: 'rond nia',
    'sao paulo': 's o paulo',
  },
  Chile: {
    araucania: 'la araucan a',
    aysen: 'ais n del general carlos ib ez del campo',
    biobio: 'b o b o',
    'los rios': 'los r os',
    magallanes: 'magallanes y ant rtica chilena',
    metropolitana: 'regi n metropolitana de santiago',
    nuble: 'uble',
    ohiggins: 'libertador general bernardo o higgins',
    tarapaca: 'tarapac',
    valparaiso: 'valpara so',
  },
  Colombia: {
    atlantico: 'atl ntico',
    bolivar: 'bol var',
    boyaca: 'boyac',
    'capital district': 'distrito capital de bogot',
    caqueta: 'caquet',
    choco: 'choc',
    cordoba: 'c rdoba',
    guainia: 'guain a',
    narino: 'nari o',
    quindio: 'quind o',
    'san andres y providencia': 'san andr s y providencia',
    vaupes: 'vaup s',
  },
  Germany: {
    'baden wurttemberg': 'baden w rttemberg',
    bavaria: 'bayern',
    thuringen: 'th ringen',
  },
  India: {
    'andaman and nicobar islands': 'andaman and nicobar',
    'dadar nagar haveli': 'd dra and nagar haveli and dam n and diu',
    'dadra and nagar haveli and daman and diu': 'd dra and nagar haveli and dam n and diu',
    odisha: 'orissa',
    uttarakhand: 'uttaranchal',
  },
  Italy: {
    lombardia: 'lombardy',
    piemonte: 'piedmont',
    toscana: 'tuscany',
  },
  Japan: {
    hokkaido: 'hokkaid',
    hyogo: 'hy go',
    kochi: 'k chi',
    kyoto: 'ky to',
    oita: 'ita',
    osaka: 'saka',
  },
  Mexico: {
    'ciudad de mexico': 'ciudad de m xico',
    michoacan: 'michoac n',
    'nuevo leon': 'nuevo le n',
    queretaro: 'quer taro',
    'san luis potosi': 'san luis potos',
    yucatan: 'yucat n',
  },
  Pakistan: {
    'azad jammu and kashmir': 'azad kashmir',
    balochistan: 'baluchistan',
    'gilgit baltistan': 'northern areas',
    islamabad: 'f c t',
    'khyber pakhtunkhwa': 'k p',
    sindh: 'sind',
  },
  Peru: {
    ancash: 'ncash',
    apurimac: 'apur mac',
    huanuco: 'hu nuco',
    junin: 'jun n',
    'san martin': 'san mart n',
  },
  Russia: {
    'adygea republic': 'adygey',
    'altai krai': 'altay',
    'altai republic': 'gorno altay',
    'arkhangelsk oblast': 'arkhangel sk',
    'buryatia republic': 'buryat',
    'chechen republic': 'chechnya',
    'chukotka autonomous okrug': 'chukchi autonomous okrug',
    'chuvashia republic': 'chuvash',
    'ingushetia republic': 'ingush',
    'jewish autonomous okrug': 'yevrey',
    'kabardino balkarian republic': 'kabardin balkar',
    'kalmykia republic': 'kalmyk',
    'khakassia republic': 'khakass',
    'khanty mansi autonomous okrug': 'khanty mansiy',
    'magadan oblast': 'maga buryatdan',
    'mari el republic': 'mariy el',
    moscow: 'moskva',
    'moscow oblast': 'moskovskaya',
    'nizhny novgorod oblast': 'nizhegorod',
    'north ossetia alania republic': 'north ossetia',
    'primorsky krai': 'primor ye',
    'saint petersburg': 'city of st petersburg',
    'sakha yakutiya republic': 'sakha yakutia',
    'tyva republic': 'tuva',
    'ulyanovsk oblast': 'ul yanovsk',
    'yamalo nenets autonomous okrug': 'yamal nenets',
    'zabaykalsky krai': 'chita',
  },
  Spain: {
    andalusia: 'andaluc a',
    baleares: 'islas baleares',
    canarias: 'islas canarias',
    'c valenciana': 'comunidad valenciana',
    'castilla y leon': 'castilla y le n',
    catalonia: 'catalu a',
    madrid: 'comunidad de madrid',
    navarra: 'navarra comunidad foral de',
    'pais vasco': 'pa s vasco',
  },
  Sweden: {
    gavleborg: 'g vleborg',
    'jamtland harjedalen': 'j mtland',
    jonkoping: 'j nk ping',
    ostergotland: 'sterg tland',
    skane: 'sk ne',
    sormland: 's dermanland',
    varmland: 'v rmland',
    vasterbotten: 'v sterbotten',
    vasternorrland: 'v sternorrland',
    vastmanland: 'v stmanland',
    'vastra gotaland': 'v stra g taland',
  },
  Ukraine: {
    'cherkasy oblast': 'cherkaska',
    'chernihiv oblast': 'chernihivska',
    'chernivtsi oblast': 'chernivetska',
    'crimea republic': 'avtonomna respublika krym',
    'dnipropetrovsk oblast': 'dnipropetrovska',
    'donetsk oblast': 'donetska',
    'ivano frankivsk oblast': 'ivano frankivska',
    'kharkiv oblast': 'kharkivska',
    'kherson oblast': 'khersonska',
    'khmelnytskyi oblast': 'khmelnytska',
    'kiev oblast': 'kyivska',
    'kirovohrad oblast': 'kirovohradska',
    'luhansk oblast': 'luhanska',
    'lviv oblast': 'lvivska',
    'mykolaiv oblast': 'mykolaivska',
    'odessa oblast': 'odeska',
    'poltava oblast': 'poltavska',
    'rivne oblast': 'rivnenska',
    sevastopol: 'sevastopilska',
    'sumy oblast': 'sumska',
    'ternopil oblast': 'ternopilska',
    'vinnytsia oblast': 'vinnytska',
    'volyn oblast': 'volynska',
    'zakarpattia oblast': 'zakarpatska',
    'zaporizhia oblast': 'zaporizka',
    'zhytomyr oblast': 'zhytomyrska',
  },
})

const regionalMapCanonicalDropWords = new Set([
  'and',
  'autonomous',
  'city',
  'county',
  'de',
  'del',
  'foral',
  'krai',
  'oblast',
  'of',
  'okrug',
  'province',
  'region',
  'republic',
  'state',
  'territory',
  'w',
  'p',
])

const scalePresetByModeKey = {
  'cases-to-date-total': {
    label: 'Cases / To Date / Total',
    description: 'Cumulative totals use fixed bins so the color scale stays stable across dates.',
    upperBounds: [100000, 1000000, 10000000, 50000000, 200000000],
  },
  'deaths-to-date-total': {
    label: 'Deaths / To Date / Total',
    description: 'Cumulative deaths use fixed bins so the color scale stays stable across dates.',
    upperBounds: [1000, 10000, 100000, 500000, 2000000],
  },
  'cases-on-day-total': {
    label: 'Cases / On Day / Total',
    description: 'Daily totals use fixed bins so short-term comparisons stay consistent.',
    upperBounds: [100, 1000, 5000, 20000, 100000],
  },
  'deaths-on-day-total': {
    label: 'Deaths / On Day / Total',
    description: 'Daily deaths use fixed bins so short-term comparisons stay consistent.',
    upperBounds: [10, 100, 500, 2000, 10000],
  },
  'cases-to-date-per-100k': {
    label: 'Cases / To Date / Per 100k',
    description: 'Population-adjusted cumulative values use fixed bins across all dates.',
    upperBounds: [1000, 5000, 10000, 20000, 40000],
  },
  'deaths-to-date-per-100k': {
    label: 'Deaths / To Date / Per 100k',
    description: 'Population-adjusted cumulative mortality uses fixed bins across all dates.',
    upperBounds: [10, 50, 100, 250, 500],
  },
  'cases-on-day-per-100k': {
    label: 'Cases / On Day / Per 100k',
    description: 'Daily population-adjusted cases use fixed bins across all dates.',
    upperBounds: [1, 5, 10, 25, 50],
  },
  'deaths-on-day-per-100k': {
    label: 'Deaths / On Day / Per 100k',
    description: 'Daily population-adjusted deaths use fixed bins across all dates.',
    upperBounds: [0.1, 0.5, 1, 2.5, 5],
  },
}

const countryCodeByMapName = buildCountryCodeByMapName()
const normalizedRegionalMapNameAliasesByCountry =
  buildNormalizedRegionalMapNameAliasesByCountry()

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeMapLookupName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\*/g, '')
    .replace(/&/g, ' and ')
    .replace(/[().,'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeRegionalCompactName(value) {
  return normalizeMapLookupName(value).replace(/\s+/g, '')
}

function normalizeRegionalCanonicalName(value) {
  return normalizeMapLookupName(value)
    .replace(/\bcity of\b/g, ' ')
    .split(' ')
    .filter((token) => token && !regionalMapCanonicalDropWords.has(token))
    .join(' ')
}

function buildNormalizedRegionalMapNameAliasesByCountry() {
  return Object.entries(regionalMapNameAliasesByCountry).reduce(
    (countryAccumulator, [countryName, aliases]) => {
      const normalizedCountryName = normalizeMapLookupName(countryName)
      const normalizedAliases = Object.entries(aliases).reduce(
        (aliasAccumulator, [sourceName, targetName]) => {
          const normalizedSource = normalizeMapLookupName(sourceName)
          const normalizedTarget = normalizeMapLookupName(targetName)

          if (normalizedSource && normalizedTarget) {
            aliasAccumulator[normalizedSource] = normalizedTarget
          }

          return aliasAccumulator
        },
        {}
      )

      countryAccumulator[normalizedCountryName] = normalizedAliases
      return countryAccumulator
    },
    {}
  )
}

function getRegionalMapNameAliasLookup(countryName) {
  const normalizedCountryName = normalizeMapLookupName(countryName)
  return normalizedRegionalMapNameAliasesByCountry[normalizedCountryName] ?? {}
}

function computeLevenshteinDistance(leftValue, rightValue) {
  const left = String(leftValue ?? '')
  const right = String(rightValue ?? '')

  if (left === right) {
    return 0
  }

  if (!left) {
    return right.length
  }

  if (!right) {
    return left.length
  }

  const matrix = Array.from({ length: left.length + 1 }, () =>
    new Array(right.length + 1).fill(0)
  )

  for (let rowIndex = 0; rowIndex <= left.length; rowIndex += 1) {
    matrix[rowIndex][0] = rowIndex
  }

  for (let columnIndex = 0; columnIndex <= right.length; columnIndex += 1) {
    matrix[0][columnIndex] = columnIndex
  }

  for (let rowIndex = 1; rowIndex <= left.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= right.length; columnIndex += 1) {
      const substitutionCost =
        left[rowIndex - 1] === right[columnIndex - 1] ? 0 : 1
      const deletion = matrix[rowIndex - 1][columnIndex] + 1
      const insertion = matrix[rowIndex][columnIndex - 1] + 1
      const substitution =
        matrix[rowIndex - 1][columnIndex - 1] + substitutionCost

      matrix[rowIndex][columnIndex] = Math.min(deletion, insertion, substitution)
    }
  }

  return matrix[left.length][right.length]
}

function buildCountryCodeByMapName() {
  const lookup = Object.entries(mapIncludedCountry).reduce(
    (accumulator, [countryCode, countryName]) => {
      accumulator[normalizeMapLookupName(countryName)] = countryCode
      return accumulator
    },
    {}
  )

  Object.entries(mapNameAliases).forEach(([normalizedCountryName, countryCode]) => {
    lookup[normalizedCountryName] = countryCode
  })

  return lookup
}

function escapeAttributeValue(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function resolveCountryCodeFromLabel(label) {
  const directCode = getCountryCodeForRegion(label)

  if (directCode) {
    return directCode
  }

  return countryCodeByMapName[normalizeMapLookupName(label)] ?? null
}

function resolveWorldMapCodeFromElement(element, countryByCode) {
  if (!element) {
    return null
  }

  const id = element.getAttribute('id')
  if (id && countryByCode[id]) {
    return id
  }

  const name = element.getAttribute('name')
  if (name) {
    const codeFromName = resolveCountryCodeFromLabel(name)

    if (codeFromName) {
      return codeFromName
    }
  }

  const className = element.getAttribute('class')
  if (className) {
    const codeFromClass = resolveCountryCodeFromLabel(className)

    if (codeFromClass) {
      return codeFromClass
    }
  }

  return null
}

function buildCountryByCode(countries) {
  return countries.reduce((accumulator, country) => {
    const countryCode = getCountryCodeForRegion(country.name)

    if (countryCode) {
      accumulator[countryCode] = country
    }

    return accumulator
  }, {})
}

function buildSelectedCodeSet(selectedCountries) {
  return new Set(
    selectedCountries
      .map((countryName) => getCountryCodeForRegion(countryName))
      .filter(Boolean)
  )
}

function buildSelectedNameSet(selectedCountries) {
  return new Set((Array.isArray(selectedCountries) ? selectedCountries : []).filter(Boolean))
}

function buildDisplayModeKey(displayMode) {
  return `${displayMode?.metric ?? 'cases'}-${displayMode?.timeMode ?? 'to-date'}-${displayMode?.scale ?? 'total'
    }`
}

function formatLegendValue(value, scale) {
  const normalizedValue = Number.isFinite(value) ? value : 0

  if (scale === 'per-100k') {
    if (normalizedValue > 0 && normalizedValue < 99) {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(normalizedValue)
    }

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: normalizedValue < 1 ? 2 : 1,
      minimumFractionDigits: normalizedValue < 1 && normalizedValue > 0 ? 2 : 0,
    }).format(normalizedValue)
  }

  if (Math.abs(normalizedValue) >= 1000000) {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: normalizedValue >= 10000000 ? 0 : 1,
      minimumFractionDigits: 0,
    }).format(normalizedValue / 1000000)}M`
  }

  if (Math.abs(normalizedValue) >= 1000) {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: normalizedValue >= 100000 ? 0 : 1,
      minimumFractionDigits: 0,
    }).format(normalizedValue / 1000)}K`
  }

  if (normalizedValue < 10 && normalizedValue > 0 && !Number.isInteger(normalizedValue)) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(normalizedValue)
  }

  return formatDashboardNumber(normalizedValue)
}

function buildLegendScale(countries, displayMode) {
  const modeKey = buildDisplayModeKey(displayMode)
  const preset = scalePresetByModeKey[modeKey] ?? scalePresetByModeKey['cases-to-date-total']
  const upperBounds =
    Array.isArray(preset.upperBounds) && preset.upperBounds.length === heatScaleColors.length
      ? preset.upperBounds
      : scalePresetByModeKey['cases-to-date-total'].upperBounds

  const levels = upperBounds.map((upperBound, index) => ({
    color: heatScaleColors[index],
    index,
    upperBound,
    lowerLabel:
      index === 0
        ? '0'
        : formatLegendValue(upperBounds[index - 1], displayMode?.scale),
    upperLabel: formatLegendValue(upperBound, displayMode?.scale),
  }))

  return {
    preset,
    levels,
    getLevelIndex: (value) => {
      if (!(value > 0)) {
        return -1
      }

      const matchedLevelIndex = levels.findIndex((level) => value <= level.upperBound)
      return matchedLevelIndex === -1 ? levels.length - 1 : matchedLevelIndex
    },
  }
}

function buildLegendBoundaries(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return []
  }

  return [levels[0].lowerLabel, ...levels.map((level) => level.upperLabel)]
}

function buildWorldCountrySelectors(countryCode, countryName) {
  const selectors = new Set([`path[id="${escapeAttributeValue(countryCode)}"]`])
  const mapName = mapIncludedCountry[countryCode]

  ;[countryName, mapName].filter(Boolean).forEach((name) => {
    const escapedName = escapeAttributeValue(name)
    selectors.add(`path[name="${escapedName}"]`)
    selectors.add(`path[class="${escapedName}"]`)
  })

  return [...selectors]
}

function buildStyledWorldMapSvg(
  countryByCode,
  selectedCountryCodes,
  hoveredCountryCode,
  legendScale,
  displayMode
) {
  const rules = [
    `.${mapSvgClassName} path { fill: ${noDataFillColor}; stroke: #aeb8be; stroke-width: 0.45; opacity: 0.42; cursor: default; transition: fill 160ms ease, stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease; vector-effect: non-scaling-stroke; }`,
  ]

  Object.entries(countryByCode).forEach(([countryCode, country]) => {
    const selectors = buildWorldCountrySelectors(countryCode, country.name)
    const isSelected = selectedCountryCodes.has(countryCode)
    const isHovered = hoveredCountryCode === countryCode
    const value = getDisplayValue(country, displayMode)
    const levelIndex = legendScale.getLevelIndex(value)
    const nationalColor = getNationalColorForRegion(country.name)
    const fillColor = levelIndex === -1 ? noDataFillColor : legendScale.levels[levelIndex].color
    const strokeColor = isSelected ? nationalColor : isHovered ? '#111111' : '#aeb8be'
    const strokeWidth = isSelected ? (isHovered ? '2.6' : '2.1') : isHovered ? '1.35' : '0.45'
    const opacity = '1'
    const cursor = 'pointer'
    const filter = isHovered ? 'drop-shadow(0 0 8px rgba(0,0,0,0.24))' : 'none'

    rules.push(
      `${selectors
        .map((selector) => `.${mapSvgClassName} ${selector}`)
        .join(', ')} { fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; opacity: ${opacity}; cursor: ${cursor}; filter: ${filter}; }`
    )
  })

  return preparedWorldMapSvg.replace(
    /<svg\b([^>]*)>/i,
    `<svg$1 class="${mapSvgClassName}"><style>${rules.join('\n')}</style>`
  )
}

function buildRegionalPathEntries(regionalMapSvg) {
  if (!regionalMapSvg) {
    return []
  }

  const pathNameMatches = [
    ...regionalMapSvg.matchAll(/<path\b[^>]*\bname="([^"]+)"[^>]*>/g),
  ]
  const uniquePathNames = new Set()

  return pathNameMatches
    .map((match) => match?.[1])
    .filter(Boolean)
    .filter((pathName) => {
      if (uniquePathNames.has(pathName)) {
        return false
      }

      uniquePathNames.add(pathName)
      return true
    })
    .map((pathName) => ({
      pathName,
      normalizedName: normalizeMapLookupName(pathName),
      compactName: normalizeRegionalCompactName(pathName),
      canonicalName: normalizeRegionalCanonicalName(pathName),
    }))
}

function buildRegionalPathLookups(pathEntries) {
  const byNormalized = new Map()
  const byCompact = new Map()
  const byCanonical = new Map()

  pathEntries.forEach((pathEntry) => {
    if (!pathEntry?.normalizedName) {
      return
    }

    if (!byNormalized.has(pathEntry.normalizedName)) {
      byNormalized.set(pathEntry.normalizedName, pathEntry)
    }

    if (pathEntry.compactName) {
      const compactEntryGroup = byCompact.get(pathEntry.compactName) ?? []
      compactEntryGroup.push(pathEntry)
      byCompact.set(pathEntry.compactName, compactEntryGroup)
    }

    if (pathEntry.canonicalName) {
      const canonicalEntryGroup = byCanonical.get(pathEntry.canonicalName) ?? []
      canonicalEntryGroup.push(pathEntry)
      byCanonical.set(pathEntry.canonicalName, canonicalEntryGroup)
    }
  })

  return {
    byCanonical,
    byCompact,
    byNormalized,
    entries: pathEntries,
  }
}

function buildRegionalCountryByNormalizedName(countries) {
  const countriesByNormalizedName = new Map()

  countries.forEach((country) => {
    const normalizedCountryName = normalizeMapLookupName(country?.name)

    if (normalizedCountryName && !countriesByNormalizedName.has(normalizedCountryName)) {
      countriesByNormalizedName.set(normalizedCountryName, country)
    }
  })

  return countriesByNormalizedName
}

function resolveRegionalPathEntryForCountry(country, pathLookups, focusedCountryName) {
  const normalizedCountryName = normalizeMapLookupName(country?.name)

  if (!normalizedCountryName) {
    return null
  }

  const directEntry = pathLookups.byNormalized.get(normalizedCountryName)
  if (directEntry) {
    return directEntry
  }

  const aliasLookup = getRegionalMapNameAliasLookup(focusedCountryName)
  const aliasTargetName = aliasLookup[normalizedCountryName]
  if (aliasTargetName) {
    const aliasEntry = pathLookups.byNormalized.get(aliasTargetName)
    if (aliasEntry) {
      return aliasEntry
    }
  }

  const compactCountryName = normalizeRegionalCompactName(country?.name)
  if (compactCountryName) {
    const compactEntries = pathLookups.byCompact.get(compactCountryName) ?? []
    if (compactEntries.length === 1) {
      return compactEntries[0]
    }
  }

  const canonicalCountryName = normalizeRegionalCanonicalName(country?.name)
  if (canonicalCountryName) {
    const canonicalEntries = pathLookups.byCanonical.get(canonicalCountryName) ?? []
    if (canonicalEntries.length === 1) {
      return canonicalEntries[0]
    }
  }

  if (!compactCountryName || compactCountryName.length < 4) {
    return null
  }

  let bestEntry = null
  let bestDistance = Number.POSITIVE_INFINITY
  let bestCount = 0

  pathLookups.entries.forEach((pathEntry) => {
    if (!pathEntry.compactName) {
      return
    }

    const currentDistance = computeLevenshteinDistance(
      compactCountryName,
      pathEntry.compactName
    )

    if (currentDistance < bestDistance) {
      bestDistance = currentDistance
      bestEntry = pathEntry
      bestCount = 1
      return
    }

    if (currentDistance === bestDistance) {
      bestCount += 1
    }
  })

  if (
    bestEntry &&
    bestCount === 1 &&
    bestDistance <= 2 &&
    bestDistance / Math.max(compactCountryName.length, bestEntry.compactName.length) <= 0.34
  ) {
    return bestEntry
  }

  return null
}

function buildRegionalCountryBindings(countries, pathLookups, focusedCountryName) {
  return countries
    .map((country) => {
      const matchedPathEntry = resolveRegionalPathEntryForCountry(
        country,
        pathLookups,
        focusedCountryName
      )

      if (!matchedPathEntry) {
        return null
      }

      return {
        country,
        normalizedPathName: matchedPathEntry.normalizedName,
        selector: `path[name="${escapeAttributeValue(matchedPathEntry.pathName)}"]`,
      }
    })
    .filter(Boolean)
}

function buildRegionalCountryByPathNormalizedName(regionalCountryBindings) {
  const countriesByPathNormalizedName = new Map()

  regionalCountryBindings.forEach((binding) => {
    if (!binding?.normalizedPathName || !binding?.country) {
      return
    }

    if (!countriesByPathNormalizedName.has(binding.normalizedPathName)) {
      countriesByPathNormalizedName.set(binding.normalizedPathName, binding.country)
    }
  })

  return countriesByPathNormalizedName
}

function resolveRegionalCountryFromElement(
  element,
  countriesByPathNormalizedName,
  countriesByNormalizedName
) {
  if (!element) {
    return null
  }

  const pathName = element.getAttribute('name')
  if (pathName) {
    const normalizedPathName = normalizeMapLookupName(pathName)

    if (
      normalizedPathName &&
      countriesByPathNormalizedName.has(normalizedPathName)
    ) {
      return countriesByPathNormalizedName.get(normalizedPathName)
    }
  }

  const candidateValues = ['name', 'class', 'id']
    .map((attributeName) => element.getAttribute(attributeName))
    .filter(Boolean)

  for (const candidateValue of candidateValues) {
    const normalizedCandidateValue = normalizeMapLookupName(candidateValue)

    if (normalizedCandidateValue && countriesByNormalizedName.has(normalizedCandidateValue)) {
      return countriesByNormalizedName.get(normalizedCandidateValue)
    }
  }

  return null
}

function buildStyledRegionalMapSvg(
  regionalMapSvg,
  regionalCountryBindings,
  selectedCountryNames,
  hoveredCountryName,
  legendScale,
  displayMode
) {
  if (!regionalMapSvg) {
    return ''
  }

  const rules = [
    `.${mapSvgClassName} path { fill: ${noDataFillColor}; stroke: #aeb8be; stroke-width: 0.45; opacity: 0.42; cursor: default; transition: fill 160ms ease, stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease; vector-effect: non-scaling-stroke; }`,
  ]

  regionalCountryBindings.forEach(({ country, selector }) => {
    const isSelected = selectedCountryNames.has(country.name)
    const isHovered = hoveredCountryName === country.name
    const value = getDisplayValue(country, displayMode)
    const levelIndex = legendScale.getLevelIndex(value)
    const nationalColor = getNationalColorForRegion(country.name)
    const fillColor = levelIndex === -1 ? noDataFillColor : legendScale.levels[levelIndex].color
    const strokeColor = isSelected ? nationalColor : isHovered ? '#111111' : '#aeb8be'
    const strokeWidth = isSelected ? (isHovered ? '2.6' : '2.1') : isHovered ? '1.35' : '0.45'
    const opacity = '1'
    const cursor = 'pointer'
    const filter = isHovered ? 'drop-shadow(0 0 8px rgba(0,0,0,0.24))' : 'none'

    rules.push(
      `.${mapSvgClassName} ${selector} { fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; opacity: ${opacity}; cursor: ${cursor}; filter: ${filter}; }`
    )
  })

  return regionalMapSvg.replace(
    /<svg\b([^>]*)>/i,
    `<svg$1 class="${mapSvgClassName}"><style>${rules.join('\n')}</style>`
  )
}

function toTitleCase(value) {
  return String(value ?? '').replace(/\b\w/g, (character) => character.toUpperCase())
}

function buildDisplayModeLabel(displayMode) {
  return `${toTitleCase(getTimeModeLabel(displayMode?.timeMode))}`
}

export default function WorldProjectionMap({
  countries = [],
  regionalCountries = [],
  focusedCountryName = '',
  displayMode,
  selectedCountries = [],
  timelineDate = '',
  isLoading = false,
  isUpdating = false,
  error = '',
  hoveredCountryName = '',
  onHoverCountryChange,
  onToggleCountry,
}) {
  const containerRef = useRef(null)
  const [hoveredWorldCountryCode, setHoveredWorldCountryCode] = useState(null)
  const [hoveredRegionalCountryName, setHoveredRegionalCountryName] = useState('')
  const [hoveredPointer, setHoveredPointer] = useState(null)
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const updateMatch = () => setIsCompactLayout(mediaQuery.matches)

    updateMatch()
    mediaQuery.addEventListener('change', updateMatch)

    return () => mediaQuery.removeEventListener('change', updateMatch)
  }, [])

  const preparedRegionalMapSvg = useMemo(
    () => preparedRegionalMapSvgByCountryName[focusedCountryName] ?? null,
    [focusedCountryName]
  )
  const hasRegionalMapAsset =
    Boolean(preparedRegionalMapSvg) &&
    Boolean(focusedCountryName) &&
    Array.isArray(regionalCountries) &&
    regionalCountries.length > 0

  const worldCountryByCode = useMemo(() => buildCountryByCode(countries), [countries])
  const selectedCountryCodes = useMemo(
    () => buildSelectedCodeSet(selectedCountries),
    [selectedCountries]
  )
  const hoveredWorldCountry = hoveredWorldCountryCode
    ? worldCountryByCode[hoveredWorldCountryCode]
    : null

  const regionalPathEntries = useMemo(
    () => buildRegionalPathEntries(preparedRegionalMapSvg),
    [preparedRegionalMapSvg]
  )
  const regionalPathLookups = useMemo(
    () => buildRegionalPathLookups(regionalPathEntries),
    [regionalPathEntries]
  )
  const regionalCountryByNormalizedName = useMemo(
    () => buildRegionalCountryByNormalizedName(regionalCountries),
    [regionalCountries]
  )
  const regionalCountryBindings = useMemo(
    () =>
      buildRegionalCountryBindings(
        regionalCountries,
        regionalPathLookups,
        focusedCountryName
      ),
    [focusedCountryName, regionalCountries, regionalPathLookups]
  )
  const regionalCountryByPathNormalizedName = useMemo(
    () => buildRegionalCountryByPathNormalizedName(regionalCountryBindings),
    [regionalCountryBindings]
  )
  const hasRegionalMap = hasRegionalMapAsset && regionalCountryBindings.length > 0
  const displayedCountries = hasRegionalMap ? regionalCountries : countries
  const selectedCountryNames = useMemo(
    () => buildSelectedNameSet(selectedCountries),
    [selectedCountries]
  )
  const hoveredRegionalCountry = hoveredRegionalCountryName
    ? regionalCountries.find((country) => country.name === hoveredRegionalCountryName) ?? null
    : null

  const legendScale = useMemo(
    () => buildLegendScale(displayedCountries, displayMode),
    [displayMode, displayedCountries]
  )
  const legendBoundaries = useMemo(
    () => buildLegendBoundaries(legendScale.levels),
    [legendScale.levels]
  )
  const styledWorldMapSvg = useMemo(
    () =>
      buildStyledWorldMapSvg(
        worldCountryByCode,
        selectedCountryCodes,
        hoveredWorldCountryCode,
        legendScale,
        displayMode
      ),
    [worldCountryByCode, selectedCountryCodes, hoveredWorldCountryCode, legendScale, displayMode]
  )
  const styledRegionalMapSvg = useMemo(
    () =>
      buildStyledRegionalMapSvg(
        preparedRegionalMapSvg,
        regionalCountryBindings,
        selectedCountryNames,
        hoveredRegionalCountryName,
        legendScale,
        displayMode
      ),
    [
      preparedRegionalMapSvg,
      regionalCountryBindings,
      selectedCountryNames,
      hoveredRegionalCountryName,
      legendScale,
      displayMode,
    ]
  )
  const activeMapSvg = hasRegionalMap ? styledRegionalMapSvg : styledWorldMapSvg
  const hoveredCountry = hasRegionalMap ? hoveredRegionalCountry : hoveredWorldCountry
  const selectedCountryEntries = useMemo(() => {
    const countriesByName = new Map(displayedCountries.map((country) => [country.name, country]))

    return selectedCountries
      .map((countryName) => countriesByName.get(countryName))
      .filter(Boolean)
      .map((country) => ({
        color: getNationalColorForRegion(country.name),
        name: country.name,
        value: getDisplayValue(country, displayMode),
      }))
      .sort((left, right) => {
        if (right.value === left.value) {
          return left.name.localeCompare(right.name)
        }

        return right.value - left.value
      })
  }, [displayMode, displayedCountries, selectedCountries])

  useEffect(() => {
    setHoveredWorldCountryCode(null)
    setHoveredRegionalCountryName('')
    setHoveredPointer(null)
  }, [hasRegionalMap, focusedCountryName])

  useEffect(() => {
    if (!hoveredCountryName) {
      setHoveredWorldCountryCode(null)
      setHoveredRegionalCountryName('')
      return
    }

    if (hasRegionalMap) {
      const normalizedHoveredCountryName = normalizeMapLookupName(hoveredCountryName)

      if (regionalCountryByNormalizedName.has(normalizedHoveredCountryName)) {
        setHoveredRegionalCountryName(
          regionalCountryByNormalizedName.get(normalizedHoveredCountryName).name
        )
      } else {
        setHoveredRegionalCountryName('')
      }

      setHoveredWorldCountryCode(null)
      return
    }

    const hoveredCountryCodeFromName = getCountryCodeForRegion(hoveredCountryName)

    if (!hoveredCountryCodeFromName || !worldCountryByCode[hoveredCountryCodeFromName]) {
      setHoveredWorldCountryCode(null)
      return
    }

    setHoveredWorldCountryCode(hoveredCountryCodeFromName)
  }, [hasRegionalMap, hoveredCountryName, regionalCountryByNormalizedName, worldCountryByCode])

  if (error && displayedCountries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">{error}</p>
      </div>
    )
  }

  if (isLoading && displayedCountries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">Loading projection map...</p>
      </div>
    )
  }

  if (displayedCountries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">No map snapshot is available for the selected date.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[4px] bg-[#dfe7ec] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        aria-label={hasRegionalMap ? `${focusedCountryName} projection map` : 'World projection map'}
        onPointerLeave={() => {
          if (isCompactLayout) {
            return
          }

          setHoveredWorldCountryCode(null)
          setHoveredRegionalCountryName('')
          setHoveredPointer(null)
          onHoverCountryChange?.('')
        }}
        onPointerMove={(event) => {
          if (isCompactLayout) {
            return
          }

          const path = event.target.closest?.('path')

          if (!path || !containerRef.current?.contains(path)) {
            setHoveredWorldCountryCode(null)
            setHoveredRegionalCountryName('')
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          const hoveredRegion = hasRegionalMap
            ? resolveRegionalCountryFromElement(
                path,
                regionalCountryByPathNormalizedName,
                regionalCountryByNormalizedName
              )
            : (() => {
                const countryCode = resolveWorldMapCodeFromElement(path, worldCountryByCode)
                return countryCode ? worldCountryByCode[countryCode] : null
              })()

          if (!hoveredRegion) {
            setHoveredWorldCountryCode(null)
            setHoveredRegionalCountryName('')
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          const bounds = containerRef.current.getBoundingClientRect()

          if (hasRegionalMap) {
            setHoveredRegionalCountryName(hoveredRegion.name)
            setHoveredWorldCountryCode(null)
          } else {
            const hoveredCountryCode = getCountryCodeForRegion(hoveredRegion.name)
            setHoveredWorldCountryCode(hoveredCountryCode)
            setHoveredRegionalCountryName('')
          }

          setHoveredPointer({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          })
          onHoverCountryChange?.(hoveredRegion.name)
        }}
        onClick={(event) => {
          const path = event.target.closest?.('path')

          if (!path || !containerRef.current?.contains(path)) {
            return
          }

          const clickedRegion = hasRegionalMap
            ? resolveRegionalCountryFromElement(
                path,
                regionalCountryByPathNormalizedName,
                regionalCountryByNormalizedName
              )
            : (() => {
                const countryCode = resolveWorldMapCodeFromElement(path, worldCountryByCode)
                return countryCode ? worldCountryByCode[countryCode] : null
              })()

          if (clickedRegion) {
            onToggleCountry?.(clickedRegion)
          }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: activeMapSvg }} />

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden w-[min(240px,calc(100%-2rem))] rounded-[10px] border border-white/60 bg-[rgba(255,255,255,0.3)] px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-[6px] sm:block">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-black/10"
                style={{ backgroundColor: noDataFillColor }}
              />
              <span className="ty-small text-dark-grey">No data</span>
            </div>
            {legendScale.levels.map((level) => (
              <div key={`legend-level-${level.index}`} className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-black/10"
                  style={{ backgroundColor: level.color }}
                />
                <span className="ty-small flex items-center text-dark-grey">
                  <span className="inline-block min-w-[4.5ch] text-left">{level.lowerLabel}</span>
                  <span className="inline-block min-w-[2.5ch] text-center"> - </span>
                  <span className="inline-block min-w-[4.5ch] text-left">{level.upperLabel}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {!isCompactLayout && hoveredCountry && hoveredPointer ? (
          <div
            className="pointer-events-none absolute z-20 max-w-[220px] rounded-[10px] bg-white/90 px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-[5px] sm:max-w-[280px] sm:px-5 sm:py-3"
            style={{
              left: `${clamp(
                hoveredPointer.x + 12,
                12,
                Math.max((containerRef.current?.clientWidth ?? 320) - 232, 12)
              )}px`,
              top: `${Math.max(hoveredPointer.y + 12, 48)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 px-2 py-1 sm:px-0">
              <span className="ty-small text-black">
                {String(timelineDate ?? '').replace(/-/g, '/')}
              </span>
              <span className="ty-small text-black">{buildDisplayModeLabel(displayMode)}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 sm:px-0">
              <span className="ty-small min-w-0 flex-1 truncate text-black">
                {hoveredCountry.name}
              </span>
              <span className="ty-small shrink-0 text-black">
                {formatDashboardNumber(getDisplayValue(hoveredCountry, displayMode))}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-[10px] border border-grey bg-grey-bg/60 px-3 py-3 sm:hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[290px]">
            <div className="grid grid-cols-5 overflow-hidden rounded-[8px] border border-black/10">
              {legendScale.levels.map((level) => (
                <span
                  key={`legend-swatch-${level.index}`}
                  className="h-6 w-full"
                  style={{ backgroundColor: level.color }}
                />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-6 text-[0.66rem] text-dark-grey sm:text-[0.78rem]">
              {legendBoundaries.map((boundaryLabel, index) => (
                <span
                  key={`legend-boundary-${index}`}
                  className={`${
                    index === 0
                      ? 'text-left'
                      : index === legendBoundaries.length - 1
                        ? 'text-right'
                        : 'text-center'
                  }`}
                >
                  {boundaryLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCompactLayout ? (
        <div className="flex flex-col gap-2 rounded-[10px] border border-grey bg-white px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="ty-small text-black">{String(timelineDate ?? '').replace(/-/g, '/')}</span>
            <span className="ty-small text-dark-grey">{buildDisplayModeLabel(displayMode)}</span>
          </div>

          {selectedCountryEntries.length > 0 ? (
            <div className="flex flex-col gap-2">
              {selectedCountryEntries.map((item) => (
                <div key={`map-slice-${item.name}`} className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="ty-small min-w-0 flex-1 truncate text-black">{item.name}</span>
                  <span className="ty-small text-black">{formatDashboardNumber(item.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="ty-small text-dark-grey">
              Select countries to view the current map slice values.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
