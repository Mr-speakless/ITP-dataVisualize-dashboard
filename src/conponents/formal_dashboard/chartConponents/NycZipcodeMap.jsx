import { useMemo, useRef, useState } from 'react'
import nycZipcodesMapSvg from '../../../assets/NycZipcodesMap.svg?raw'
import {
  formatDashboardNumber,
  getDisplayValue,
  getMetricLabel,
  getScaleLabel,
  getTimeModeLabel,
} from '../worldData.js'
import { useCompactLayout } from '../hooks/useMediaQuery.js'

const heatScaleColors = ['#eaf6fb', '#c4e0ed', '#87bfd4', '#3a88a8', '#0b4662']
const noDataFillColor = '#dde7ec'
const outOfScopeFillColor = '#eef2f4'

const PATH_TAG_RE = /<path id="([^"]+)"[^>]*\bd="([^"]+)"[^>]*\/>/g

function buildValueScale(regions, displayMode) {
  const values = regions
    .map((region) => getDisplayValue(region, displayMode))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (values.length === 0) {
    return { min: 0, max: 0, colorFor: () => noDataFillColor }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  const colorFor = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return noDataFillColor
    }
    if (max === min) {
      return heatScaleColors[heatScaleColors.length - 1]
    }
    const ratio = (value - min) / (max - min)
    const index = Math.min(
      heatScaleColors.length - 1,
      Math.round(ratio * (heatScaleColors.length - 1))
    )
    return heatScaleColors[index]
  }

  return { min, max, colorFor }
}

// Bounding box of the in-borough parcels so the SVG can zoom to just that
// borough instead of showing the whole city at a tiny scale.
function computeFocusViewBox(rawSvg, focusIds) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let matched = false

  rawSvg.replace(PATH_TAG_RE, (_, id, d) => {
    if (!focusIds.has(id)) {
      return _
    }
    const numbers = d.match(/-?\d+(?:\.\d+)?/g)
    if (numbers) {
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        const x = Number(numbers[i])
        const y = Number(numbers[i + 1])
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        matched = true
      }
    }
    return _
  })

  if (!matched) {
    return null
  }

  const padX = (maxX - minX) * 0.08 || 10
  const padY = (maxY - minY) * 0.08 || 10
  return `${(minX - padX).toFixed(1)} ${(minY - padY).toFixed(1)} ${(
    maxX - minX + padX * 2
  ).toFixed(1)} ${(maxY - minY + padY * 2).toFixed(1)}`
}

function styleZipcodePaths(rawSvg, { regionByName, scale, selectedNames, hoveredName, focusViewBox }) {
  let styledSvg = rawSvg.replace(
    '<svg ',
    `<svg class="nyc-zipcode-map-svg" preserveAspectRatio="xMidYMid meet" ${
      focusViewBox ? `data-focus="${focusViewBox}" ` : ''
    }`
  )

  if (focusViewBox) {
    styledSvg = styledSvg.replace(/viewBox="[^"]*"/, `viewBox="${focusViewBox}"`)
  }

  styledSvg = styledSvg.replace(PATH_TAG_RE, (pathTag, id) => {
    const region = regionByName.get(id)

    if (!region) {
      return pathTag.replace(
        '/>',
        ` style="fill:${outOfScopeFillColor};stroke:#dfe6ea;stroke-width:0.5;pointer-events:none" />`
      )
    }

    const value = getDisplayValue(region, scale.displayMode)
    const fill = scale.colorFor(value)
    const isSelected = selectedNames.has(id)
    const isHovered = hoveredName === id
    const stroke = isSelected ? '#0b2f3f' : '#ffffff'
    const strokeWidth = isSelected ? 1.6 : isHovered ? 1.2 : 0.6
    const opacity = isHovered && !isSelected ? 0.85 : 1

    return pathTag.replace(
      '/>',
      ` style="fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};` +
        `opacity:${opacity};cursor:pointer;transition:fill .15s,opacity .15s" />`
    )
  })

  return styledSvg
}

export default function NycZipcodeMap({
  regions = [],
  boroughName = '',
  displayMode,
  selectedCountries = [],
  onToggleCountry,
  hoveredCountryName = '',
  onHoverCountryChange,
  timelineDate = '',
  isLoading = false,
  error = '',
}) {
  const containerRef = useRef(null)
  const [hoveredPointer, setHoveredPointer] = useState(null)
  const isCompactLayout = useCompactLayout()

  const regionByName = useMemo(() => {
    const map = new Map()
    regions.forEach((region) => map.set(region.name, region))
    return map
  }, [regions])

  const scale = useMemo(() => {
    const base = buildValueScale(regions, displayMode)
    return { ...base, displayMode }
  }, [regions, displayMode])

  const selectedNames = useMemo(() => new Set(selectedCountries), [selectedCountries])

  const focusViewBox = useMemo(
    () => computeFocusViewBox(nycZipcodesMapSvg, new Set(regionByName.keys())),
    [regionByName]
  )

  const styledSvg = useMemo(
    () =>
      styleZipcodePaths(nycZipcodesMapSvg, {
        regionByName,
        scale,
        selectedNames,
        hoveredName: hoveredCountryName,
        focusViewBox,
      }),
    [regionByName, scale, selectedNames, hoveredCountryName, focusViewBox]
  )

  const hoveredRegion = hoveredCountryName ? regionByName.get(hoveredCountryName) : null

  const resolveZipFromEvent = (event) => {
    const path = event.target?.closest?.('path[id]')

    if (!path || !containerRef.current?.contains(path)) {
      return ''
    }

    const id = path.getAttribute('id') ?? ''
    return regionByName.has(id) ? id : ''
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">{error}</p>
      </div>
    )
  }

  if (isLoading && regions.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">Loading zipcode map...</p>
      </div>
    )
  }

  if (regions.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">No zipcode data is available for the selected date.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="ty-small font-medium text-black">
          {boroughName ? `${boroughName} - Zipcodes` : 'Zipcodes'}
        </span>
        <span className="ty-small text-dark-grey">
          {getMetricLabel(displayMode.metric)} {getScaleLabel(displayMode.scale)}{' '}
          {getTimeModeLabel(displayMode.timeMode)}
          {timelineDate ? ` - ${timelineDate}` : ''}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-[4px] bg-[#dfe7ec] sm:h-[460px]"
        aria-label={`${boroughName} zipcode projection map`}
        onPointerLeave={() => {
          setHoveredPointer(null)
          onHoverCountryChange?.('')
        }}
        onPointerMove={(event) => {
          if (isCompactLayout) {
            return
          }

          const zip = resolveZipFromEvent(event)
          const bounds = containerRef.current?.getBoundingClientRect()

          if (!zip || !bounds) {
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          setHoveredPointer({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          })
          onHoverCountryChange?.(zip)
        }}
        onClick={(event) => {
          const zip = resolveZipFromEvent(event)
          const region = zip ? regionByName.get(zip) : null

          if (region) {
            onToggleCountry?.(region)
          }
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center [&_.nyc-zipcode-map-svg]:block [&_.nyc-zipcode-map-svg]:h-full [&_.nyc-zipcode-map-svg]:w-full"
          dangerouslySetInnerHTML={{ __html: styledSvg }}
        />

        {hoveredRegion && hoveredPointer ? (
          <div
            className="pointer-events-none absolute z-10 max-w-[240px] -translate-x-1/2 -translate-y-full rounded-[4px] bg-black/85 px-2 py-1 text-white"
            style={{ left: hoveredPointer.x, top: hoveredPointer.y - 8 }}
          >
            <div className="ty-small font-medium">
              {hoveredRegion.name}
              {hoveredRegion.caption ? (
                <span className="font-normal text-white/70"> - {hoveredRegion.caption}</span>
              ) : null}
            </div>
            <div className="ty-small">
              {formatDashboardNumber(getDisplayValue(hoveredRegion, displayMode))}{' '}
              {getScaleLabel(displayMode.scale) === 'Per 100k'
                ? getMetricLabel(displayMode.metric) + ' / 100k'
                : getMetricLabel(displayMode.metric)}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="ty-small text-dark-grey">{formatDashboardNumber(scale.min)}</span>
          <span className="flex h-3 overflow-hidden rounded-[2px]">
            {heatScaleColors.map((color) => (
              <span key={color} className="h-3 w-6" style={{ backgroundColor: color }} />
            ))}
          </span>
          <span className="ty-small text-dark-grey">{formatDashboardNumber(scale.max)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-3 w-4 rounded-[2px] border border-grey"
            style={{ backgroundColor: noDataFillColor }}
          />
          <span className="ty-small text-dark-grey">No data</span>
        </div>
      </div>
    </div>
  )
}
