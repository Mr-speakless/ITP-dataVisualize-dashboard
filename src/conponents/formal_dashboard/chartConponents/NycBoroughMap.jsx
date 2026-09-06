import { useMemo, useRef, useState } from 'react'
import nycBoroughsMapSvg from '../../../assets/NycBoroughsMap.svg?raw'
import {
  formatDashboardNumber,
  getDisplayValue,
  getMetricLabel,
  getScaleLabel,
  getTimeModeLabel,
} from '../worldData.js'
import { useCompactLayout } from '../hooks/useMediaQuery.js'

// Same 5-stop ramp the world projection map uses, kept local so this component
// stays self-contained (WorldProjectionMap does not export it).
const heatScaleColors = ['#eaf6fb', '#c4e0ed', '#87bfd4', '#3a88a8', '#0b4662']
const noDataFillColor = '#dde7ec'
const BOROUGH_IDS = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']

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

function styleBoroughPaths(rawSvg, { regionByName, scale, selectedNames, hoveredName }) {
  let styledSvg = rawSvg.replace(
    '<svg ',
    '<svg class="nyc-borough-map-svg" preserveAspectRatio="xMidYMid meet" '
  )

  BOROUGH_IDS.forEach((boroughName) => {
    const region = regionByName.get(boroughName)
    const value = region ? getDisplayValue(region, scale.displayMode) : null
    const fill = region ? scale.colorFor(value) : noDataFillColor
    const isSelected = selectedNames.has(boroughName)
    const isHovered = hoveredName === boroughName
    const stroke = isSelected ? '#0b2f3f' : '#ffffff'
    const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1
    const opacity = isHovered && !isSelected ? 0.88 : 1

    styledSvg = styledSvg.replace(
      new RegExp(`<path id="${boroughName}"[^>]*/>`),
      (pathTag) =>
        pathTag.replace(
          '/>',
          ` style="fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};` +
            `opacity:${opacity};cursor:pointer;transition:fill .15s,opacity .15s" />`
        )
    )
  })

  return styledSvg
}

export default function NycBoroughMap({
  regions = [],
  displayMode,
  selectedCountries = [],
  onToggleCountry,
  hoveredCountryName = '',
  onHoverCountryChange,
  timelineDate = '',
  isLoading = false,
  error = '',
  label = 'New York City',
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

  const styledSvg = useMemo(
    () =>
      styleBoroughPaths(nycBoroughsMapSvg, {
        regionByName,
        scale,
        selectedNames,
        hoveredName: hoveredCountryName,
      }),
    [regionByName, scale, selectedNames, hoveredCountryName]
  )

  const hoveredRegion = hoveredCountryName ? regionByName.get(hoveredCountryName) : null

  const resolveBoroughFromEvent = (event) => {
    const path = event.target?.closest?.('path[id]')

    if (!path || !containerRef.current?.contains(path)) {
      return ''
    }

    return path.getAttribute('id') ?? ''
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
        <p className="ty-small text-dark-grey">Loading borough map...</p>
      </div>
    )
  }

  if (regions.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">No borough data is available for the selected date.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="ty-small font-medium text-black">{label} - Boroughs</span>
        <span className="ty-small text-dark-grey">
          {getMetricLabel(displayMode.metric)} {getScaleLabel(displayMode.scale)}{' '}
          {getTimeModeLabel(displayMode.timeMode)}
          {timelineDate ? ` - ${timelineDate}` : ''}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-[4px] bg-[#dfe7ec] sm:h-[460px]"
        aria-label={`${label} borough projection map`}
        onPointerLeave={() => {
          setHoveredPointer(null)
          onHoverCountryChange?.('')
        }}
        onPointerMove={(event) => {
          if (isCompactLayout) {
            return
          }

          const boroughName = resolveBoroughFromEvent(event)
          const bounds = containerRef.current?.getBoundingClientRect()

          if (!boroughName || !bounds) {
            setHoveredPointer(null)
            onHoverCountryChange?.('')
            return
          }

          setHoveredPointer({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          })
          onHoverCountryChange?.(boroughName)
        }}
        onClick={(event) => {
          const boroughName = resolveBoroughFromEvent(event)
          const region = boroughName ? regionByName.get(boroughName) : null

          if (region) {
            onToggleCountry?.(region)
          }
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center [&_.nyc-borough-map-svg]:block [&_.nyc-borough-map-svg]:h-full [&_.nyc-borough-map-svg]:w-full"
          dangerouslySetInnerHTML={{ __html: styledSvg }}
        />

        {hoveredRegion && hoveredPointer ? (
          <div
            className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-[4px] bg-black/85 px-2 py-1 text-white"
            style={{ left: hoveredPointer.x, top: hoveredPointer.y - 8 }}
          >
            <div className="ty-small font-medium">{hoveredRegion.name}</div>
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
          <span className="ty-small text-dark-grey">
            {formatDashboardNumber(scale.min)}
          </span>
          <span className="flex h-3 overflow-hidden rounded-[2px]">
            {heatScaleColors.map((color) => (
              <span key={color} className="h-3 w-6" style={{ backgroundColor: color }} />
            ))}
          </span>
          <span className="ty-small text-dark-grey">
            {formatDashboardNumber(scale.max)}
          </span>
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
