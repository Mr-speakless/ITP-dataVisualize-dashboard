import { useMemo, useState } from 'react'
import {
  formatDashboardNumber,
  getTimeModeLabel,
} from '../worldData.js'

const chartWidth = 1100
const chartHeight = 420
const chartMargin = {
  top: 18,
  right: 24,
  bottom: 54,
  left: 82,
}
const gridSegments = 10
const yAxisStepMultipliers = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getNiceStep(roughStep) {
  if (!Number.isFinite(roughStep) || roughStep <= 0) {
    return 1
  }

  const exponent = Math.floor(Math.log10(roughStep))
  const base = 10 ** exponent
  const normalized = roughStep / base
  const matchingMultiplier = yAxisStepMultipliers.find(
    (multiplier) => normalized <= multiplier
  )

  if (matchingMultiplier) {
    return matchingMultiplier * base
  }

  return 10 * base
}

function buildYAxis(series) {
  const maxValue = Math.max(
    0,
    ...series.flatMap((item) => item.points.map((point) => point.value))
  )

  const step = getNiceStep(maxValue / gridSegments)
  const max = step * gridSegments

  return {
    max,
    step,
    ticks: Array.from({ length: gridSegments + 1 }, (_, index) => index * step),
  }
}

function formatAxisValue(value) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 1000000) {
    return `${formatDashboardNumber(value / 1000)}k`
  }

  if (absoluteValue >= 1000 || Number.isInteger(value)) {
    return formatDashboardNumber(value)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: absoluteValue < 1 ? 2 : 1,
  }).format(value)
}

function formatHoverDate(date) {
  const [year, month, day] = String(date ?? '').split('-')

  if (!year || !month || !day) {
    return ''
  }

  return `${year}/${Number(month)}/${Number(day)}`
}

function buildXAxisTicks(dates) {
  const ticks = []

  dates.forEach((date, index) => {
    const [year, month, day] = date.split('-').map(Number)

    if (index === 0) {
      ticks.push({ index, label: String(year), type: 'major' })
      return
    }

    if (month === 1 && day === 1) {
      ticks.push({ index, label: String(year), type: 'major' })
      return
    }

    if (day === 1 && [4, 7, 10].includes(month)) {
      ticks.push({ index, label: '', type: 'minor' })
    }
  })

  const lastIndex = dates.length - 1
  if (lastIndex >= 0 && !ticks.some((tick) => tick.index === lastIndex)) {
    ticks.push({ index: lastIndex, label: '', type: 'minor' })
  }

  return ticks
}

function buildLinePath(points) {
  if (points.length === 0) {
    return ''
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

function buildAreaPath(points, baselineY) {
  if (points.length === 0) {
    return ''
  }

  const linePath = buildLinePath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
}

function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-')
}

function toTitleCase(value) {
  return String(value ?? '').replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function CountryTrendChart({
  series = [],
  dates = [],
  displayMode,
  isLoading = false,
  error = '',
  highlightedCountryName = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoveredPointer, setHoveredPointer] = useState(null)

  const innerWidth = chartWidth - chartMargin.left - chartMargin.right
  const innerHeight = chartHeight - chartMargin.top - chartMargin.bottom

  const yAxis = useMemo(() => buildYAxis(series), [series])
  const xAxisTicks = useMemo(() => buildXAxisTicks(dates), [dates])

  const plottedSeries = useMemo(() => {
    const xDivisor = Math.max(dates.length - 1, 1)

    return series.map((item) => {
      const points = item.points.map((point, index) => {
        const x =
          dates.length === 1
            ? chartMargin.left + innerWidth / 2
            : chartMargin.left + (innerWidth * index) / xDivisor
        const y =
          chartMargin.top +
          innerHeight -
          (innerHeight * point.value) / Math.max(yAxis.max, 1)

        return {
          ...point,
          x,
          y,
        }
      })

      return {
        ...item,
        points,
      }
    })
  }, [dates.length, innerHeight, innerWidth, series, yAxis.max])

  const hasHighlightedSeries = useMemo(
    () =>
      Boolean(
        highlightedCountryName &&
          plottedSeries.some((item) => item.name === highlightedCountryName)
      ),
    [highlightedCountryName, plottedSeries]
  )

  const hoveredDate = hoveredIndex == null ? '' : dates[hoveredIndex] ?? ''
  const hoveredX =
    hoveredIndex == null || dates.length === 0
      ? 0
      : dates.length === 1
        ? chartMargin.left + innerWidth / 2
        : chartMargin.left + (innerWidth * hoveredIndex) / Math.max(dates.length - 1, 1)

  const hoveredEntries = useMemo(() => {
    if (hoveredIndex == null) {
      return []
    }

    return plottedSeries
      .map((item) => ({
        color: item.color,
        name: item.name,
        value: item.points[hoveredIndex]?.value ?? 0,
        y: item.points[hoveredIndex]?.y ?? chartMargin.top + innerHeight,
      }))
      .sort((left, right) => {
        if (right.value === left.value) {
          return left.name.localeCompare(right.name)
        }

        return right.value - left.value
      })
  }, [hoveredIndex, innerHeight, plottedSeries])

  const tooltipColumnCount = hoveredEntries.length > 8 ? 2 : 1
  const tooltipColumns = useMemo(() => {
    if (tooltipColumnCount === 1) {
      return [hoveredEntries]
    }

    const midpoint = Math.ceil(hoveredEntries.length / 2)

    return [
      hoveredEntries.slice(0, midpoint),
      hoveredEntries.slice(midpoint),
    ]
  }, [hoveredEntries, tooltipColumnCount])

  const tooltipStyle = useMemo(() => {
    if (hoveredIndex == null || !hoveredPointer) {
      return {}
    }

    return {
      left: `${hoveredPointer.x - 20}px`,
      top: `${hoveredPointer.y}px`,
      transform: 'translate(-100%, 0)',
    }
  }, [hoveredIndex, hoveredPointer])

  if (error) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">Loading trend lines...</p>
      </div>
    )
  }

  if (series.length === 0 || dates.length === 0) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-[14px] border border-grey bg-grey-bg px-6 text-center">
        <p className="ty-small text-dark-grey">Select at least one country to view the line chart.</p>
      </div>
    )
  }

  return (
    <div
      className="relative w-full overflow-visible bg-[#ffffff]"
      style={{ zIndex: 30 }}
    >
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="block h-auto w-full"
        aria-label="Country trend line chart"
      >
        <defs>
          {plottedSeries.map((item) => {
            const gradientId = `country-trend-gradient-${sanitizeId(item.name)}`

            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0"
                y1="0.1"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity="0.3" />
                <stop offset="30%" stopColor={item.color} stopOpacity="0.2" />
                <stop offset="60%" stopColor={item.color} stopOpacity="0" />
              </linearGradient>
            )
          })}
        </defs>

        {yAxis.ticks.slice(1).map((tickValue) => {
          const y =
            chartMargin.top +
            innerHeight -
            (innerHeight * tickValue) / Math.max(yAxis.max, 1)

          return (
            <line
              key={`grid-${tickValue}`}
              x1={chartMargin.left}
              y1={y}
              x2={chartWidth - chartMargin.right}
              y2={y}
              stroke="var(--color-grey)"
              strokeWidth="2"
              strokeDasharray="10 10"
            />
          )
        })}

        <line
          x1={chartMargin.left}
          y1={chartMargin.top + innerHeight}
          x2={chartWidth - chartMargin.right}
          y2={chartMargin.top + innerHeight}
          stroke="#8f8f8f"
          strokeWidth="2"
        />

        {yAxis.ticks.map((tickValue) => {
          const y =
            chartMargin.top +
            innerHeight -
            (innerHeight * tickValue) / Math.max(yAxis.max, 1)

          return (
            <text
              key={`y-label-${tickValue}`}
              x={chartMargin.left - 16}
              y={y + 5}
              textAnchor="end"
              className="fill-black"
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16 }}
            >
              {formatAxisValue(tickValue)}
            </text>
          )
        })}

        {xAxisTicks.map((tick) => {
          const x =
            dates.length === 1
              ? chartMargin.left + innerWidth / 2
              : chartMargin.left + (innerWidth * tick.index) / Math.max(dates.length - 1, 1)
          const tickSize = tick.type === 'major' ? 16 : 10

          return (
            <g key={`x-tick-${tick.index}-${tick.type}`}>
              <line
                x1={x}
                y1={chartMargin.top + innerHeight}
                x2={x}
                y2={chartMargin.top + innerHeight + tickSize}
                stroke="#8f8f8f"
                strokeWidth="2"
              />
              {tick.label ? (
                <text
                  x={x}
                  y={chartMargin.top + innerHeight + 32}
                  textAnchor="middle"
                  className="fill-black"
                  style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 18 }}
                >
                  {tick.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {plottedSeries.map((item) => {
          const gradientId = `country-trend-gradient-${sanitizeId(item.name)}`
          const chartBottomY = chartMargin.top + innerHeight
          const isHighlighted = item.name === highlightedCountryName
          const isDimmed = hasHighlightedSeries && !isHighlighted

          return (
            <g key={item.name}>
              <path
                d={buildAreaPath(item.points, chartBottomY)}
                fill={`url(#${gradientId})`}
                fillOpacity={isDimmed ? '0.14' : isHighlighted ? '0.9' : '1'}
              />
              <path
                d={buildLinePath(item.points)}
                fill="none"
                stroke={item.color}
                strokeOpacity={isDimmed ? '0.18' : isHighlighted ? '1' : '0.6'}
                strokeWidth={isHighlighted ? '3.2' : '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )
        })}

        {hoveredIndex != null ? (
          <>
            <line
              x1={hoveredX}
              y1={chartMargin.top}
              x2={hoveredX}
              y2={chartMargin.top + innerHeight}
              stroke="#8f8f8f"
              strokeWidth="2"
            />
            {hoveredEntries.map((item) => (
              <circle
                key={`hover-point-${item.name}`}
                cx={hoveredX}
                cy={item.y}
                r="7"
                fill={item.color}
                stroke="#ffffff"
                strokeWidth="3"
              />
            ))}
          </>
        ) : null}

        <rect
          x={chartMargin.left}
          y={chartMargin.top}
          width={innerWidth}
          height={innerHeight}
          fill="#ffffff"
          fillOpacity="0.001"
          onPointerLeave={() => {
            setHoveredIndex(null)
            setHoveredPointer(null)
          }}
          onPointerMove={(event) => {
            if (dates.length === 0) {
              setHoveredIndex(null)
              setHoveredPointer(null)
              return
            }

            const bounds = event.currentTarget.getBoundingClientRect()
            const svgBounds = event.currentTarget.ownerSVGElement.getBoundingClientRect()
            const relativeX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1)
            const nextIndex =
              dates.length === 1 ? 0 : Math.round(relativeX * (dates.length - 1))

            setHoveredIndex(nextIndex)
            setHoveredPointer({
              x: event.clientX - svgBounds.left,
              y: event.clientY - svgBounds.top,
            })
          }}
        />
      </svg>

      {hoveredIndex != null ? (
        <div
          className={`pointer-events-none absolute rounded-[12px] bg-white/96 px-5 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)] ${
            tooltipColumnCount === 2 ? 'min-w-[460px]' : 'min-w-[220px]'
          }`}
          style={{ ...tooltipStyle, zIndex: 999 }}
        >
          <div className="mb-3 flex items-center justify-between gap-6">
            <span className="ty-small text-black">{formatHoverDate(hoveredDate)}</span>
            <span className="ty-small text-dark-grey">
              {toTitleCase(getTimeModeLabel(displayMode?.timeMode))}
            </span>
          </div>
          <div className={tooltipColumnCount === 2 ? 'grid grid-cols-2 gap-x-8' : 'block'}>
            {tooltipColumns.map((column, columnIndex) => (
              <div key={`tooltip-column-${columnIndex}`} className="flex flex-col gap-2">
                {column.map((item) => (
                  <div key={`tooltip-${item.name}`} className="flex items-center gap-3">
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
