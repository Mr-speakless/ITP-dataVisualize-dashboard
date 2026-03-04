import { useEffect, useMemo, useRef, useState } from 'react'
import mapIncludedCountry from '../../../assets/mapIncludedCountry.json'
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
const preparedWorldMapSvg = worldMapSvg
  .replace(/<\?xml[\s\S]*?\?>/i, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/viewbox=/i, 'viewBox=')

const mapNameAliases = {
  'c te d ivoire': 'CI',
  'cote d ivoire': 'CI',
  curaao: 'CW',
  curacao: 'CW',
  'dem rep korea': 'KP',
  'lao pdr': 'LA',
  'saint barth lemy': 'BL',
}

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

function resolveMapCodeFromElement(element, countryByCode) {
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

function buildCountrySelectors(countryCode, countryName) {
  const selectors = new Set([`path[id="${escapeAttributeValue(countryCode)}"]`])
  const mapName = mapIncludedCountry[countryCode]

    ;[countryName, mapName].filter(Boolean).forEach((name) => {
      const escapedName = escapeAttributeValue(name)
      selectors.add(`path[name="${escapedName}"]`)
      selectors.add(`path[class="${escapedName}"]`)
    })

  return [...selectors]
}

function buildStyledWorldMapSvg(countryByCode, selectedCountryCodes, hoveredCountryCode, legendScale, displayMode) {
  const rules = [
    `.${mapSvgClassName} path { fill: ${noDataFillColor}; stroke: #aeb8be; stroke-width: 0.45; opacity: 0.42; cursor: default; transition: fill 160ms ease, stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease; vector-effect: non-scaling-stroke; }`,
  ]

  Object.entries(countryByCode).forEach(([countryCode, country]) => {
    const selectors = buildCountrySelectors(countryCode, country.name)
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

function toTitleCase(value) {
  return String(value ?? '').replace(/\b\w/g, (character) => character.toUpperCase())
}

function buildDisplayModeLabel(displayMode) {
  return `${toTitleCase(getTimeModeLabel(displayMode?.timeMode))}`
}

export default function WorldProjectionMap({
  countries = [],
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
  const [hoveredCountryCode, setHoveredCountryCode] = useState(null)
  const [hoveredPointer, setHoveredPointer] = useState(null)

  const countryByCode = useMemo(() => buildCountryByCode(countries), [countries])
  const selectedCountryCodes = useMemo(
    () => buildSelectedCodeSet(selectedCountries),
    [selectedCountries]
  )
  const hoveredCountry = hoveredCountryCode ? countryByCode[hoveredCountryCode] : null
  const mappedCountryCount = Object.keys(countryByCode).length
  const countriesWithValueCount = useMemo(
    () => countries.filter((country) => getDisplayValue(country, displayMode) > 0).length,
    [countries, displayMode]
  )
  const tooltipMaxLeft = Math.max((containerRef.current?.clientWidth ?? 320) - 286, 12)
  const legendScale = useMemo(
    () => buildLegendScale(countries, displayMode),
    [countries, displayMode]
  )
  const styledWorldMapSvg = useMemo(
    () =>
      buildStyledWorldMapSvg(
        countryByCode,
        selectedCountryCodes,
        hoveredCountryCode,
        legendScale,
        displayMode
      ),
    [countryByCode, displayMode, hoveredCountryCode, legendScale, selectedCountryCodes]
  )

  useEffect(() => {
    if (!hoveredCountryName) {
      setHoveredCountryCode(null)
      return
    }

    const hoveredCountryCodeFromName = getCountryCodeForRegion(hoveredCountryName)

    if (!hoveredCountryCodeFromName || !countryByCode[hoveredCountryCodeFromName]) {
      setHoveredCountryCode(null)
      return
    }

    setHoveredCountryCode(hoveredCountryCodeFromName)
  }, [countryByCode, hoveredCountryName])

  if (error && countries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">{error}</p>
      </div>
    )
  }

  if (isLoading && countries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">Loading projection map...</p>
      </div>
    )
  }

  if (countries.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">No map snapshot is available for the selected date.</p>
      </div>
    )
  }

  return (
    <>
    {/* <div className="relative flex w-full flex-col gap-4 rounded-[14px] border border-grey bg-grey-bg p-4"> */}
      {/* <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="ty-small text-black">{legendScale.preset.label}</div>
          <div className="ty-small text-dark-grey">
            Frame date {timelineDate || 'N/A'} | {countriesWithValueCount} regions with values |{' '}
            {mappedCountryCount} mapped in current SVG
          </div>
        </div>
        <div className="ty-small text-dark-grey">
          {isUpdating
            ? 'Fetching next frame...'
            : 'Map is up to date.'}
        </div>
      </div> */}

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[4px] bg-[#dfe7ec] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        aria-label="World projection map"
        onPointerLeave={() => {
          setHoveredCountryCode(null)
          setHoveredPointer(null)
          onHoverCountryChange?.('')
        }}
        onPointerMove={(event) => {
          const path = event.target.closest?.('path')

          if (!path || !containerRef.current?.contains(path)) {
            setHoveredCountryCode(null)
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          const countryCode = resolveMapCodeFromElement(path, countryByCode)
          const country = countryCode ? countryByCode[countryCode] : null

          if (!countryCode || !country) {
            setHoveredCountryCode(null)
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          const bounds = containerRef.current.getBoundingClientRect()

          setHoveredCountryCode(countryCode)
          setHoveredPointer({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          })
          onHoverCountryChange?.(country.name)
        }}
        onClick={(event) => {
          const path = event.target.closest?.('path')

          if (!path || !containerRef.current?.contains(path)) {
            return
          }

          const countryCode = resolveMapCodeFromElement(path, countryByCode)
          const country = countryCode ? countryByCode[countryCode] : null

          if (country) {
            onToggleCountry?.(country.name)
          }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: styledWorldMapSvg }} />

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 w-[min(240px,calc(100%-2rem))] rounded-[10px] border border-white/60 bg-[rgba(255,255,255,0.3)] px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-[6px]">
          

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

        {hoveredCountry && hoveredPointer ? (
          <div
            className="pointer-events-none absolute z-20  rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-[5px]"
            style={{
              left: `${clamp(hoveredPointer.x + 12, 12, tooltipMaxLeft)}px`,
              top: `${Math.max(hoveredPointer.y + 12, 48)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 px-5 py-1.5">
              <span className="ty-text text-black">
                {String(timelineDate ?? '').replace(/-/g, '/')}
              </span>
              <span className="ty-text text-black">{buildDisplayModeLabel(displayMode)}</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-1.5">
              <span className="ty-text min-w-0 flex-1 truncate text-black">
                {hoveredCountry.name}
              </span>
              <span className="ty-text shrink-0 text-black">
                {formatDashboardNumber(getDisplayValue(hoveredCountry, displayMode))}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
