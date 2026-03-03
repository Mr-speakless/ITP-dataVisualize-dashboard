import { useEffect, useMemo, useState } from 'react'
import ChartViewToggle from './chartConponents/ChartViewToggle.jsx'
import DataFilterBar from './chartConponents/DataFilterBar.jsx'
import ViewSwitcher from './chartConponents/ViewSwitcher.jsx'
import {
  DEFAULT_WORLD_DATE,
  buildWorldCountryRows,
  buildWorldSummary,
  fetchWorldDaySnapshot,
  fetchWorldMeta,
  formatDashboardNumber,
  getDisplayValue,
  getFallbackWorldDate,
  getMetricLabel,
  getScaleLabel,
  getSortValue,
  getTimeModeLabel,
  isDateAvailable,
} from './worldData.js'

const initialDisplayMode = {
  metric: 'cases',
  timeMode: 'to-date',
  scale: 'per-100k',
}

const initialSortMode = 'total'
const initialSortDirection = 'desc'

function sortCountries(countries, metric, sortMode, sortDirection) {
  return [...countries].sort((left, right) => {
    const rightValue = getSortValue(right, metric, sortMode)
    const leftValue = getSortValue(left, metric, sortMode)

    if (rightValue === leftValue) {
      return sortDirection === 'asc'
        ? left.name.localeCompare(right.name)
        : right.name.localeCompare(left.name)
    }

    return sortDirection === 'asc'
      ? leftValue - rightValue
      : rightValue - leftValue
  })
}

function toggleCountrySelection(selectedCountries, countryName) {
  if (selectedCountries.includes(countryName)) {
    return selectedCountries.filter((name) => name !== countryName)
  }

  return [...selectedCountries, countryName]
}

function getTopTenCountryNames(countries) {
  return countries.slice(0, 10).map((country) => country.name)
}

const MiddleChartArea = () => {
  const [chart, setChart] = useState(true)
  const [displayMode, setDisplayMode] = useState(initialDisplayMode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [meta, setMeta] = useState(null)
  const [countries, setCountries] = useState([])
  const [selectedDate, setSelectedDate] = useState(DEFAULT_WORLD_DATE)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState(initialSortMode)
  const [sortDirection, setSortDirection] = useState(initialSortDirection)
  const [selectedCountries, setSelectedCountries] = useState([])
  const [isMetaLoading, setIsMetaLoading] = useState(true)
  const [isDayLoading, setIsDayLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadMeta() {
      setIsMetaLoading(true)
      setError('')

      try {
        const nextMeta = await fetchWorldMeta(controller.signal)
        setMeta(nextMeta)
        setSelectedDate((currentDate) =>
          isDateAvailable(nextMeta, currentDate)
            ? currentDate
            : getFallbackWorldDate(nextMeta)
        )
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading world metadata'
          )
        }
      } finally {
        setIsMetaLoading(false)
      }
    }

    loadMeta()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!meta) {
      return
    }

    if (!isDateAvailable(meta, selectedDate)) {
      setIsDayLoading(false)
      setCountries([])
      setError(`Date ${selectedDate} is not available in the world-level dataset`)
      return
    }

    const controller = new AbortController()

    async function loadWorldSnapshot() {
      setIsDayLoading(true)
      setError('')

      try {
        const daySnapshot = await fetchWorldDaySnapshot(selectedDate, controller.signal)
        setCountries(buildWorldCountryRows(meta, daySnapshot))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading the world snapshot'
          )
          setCountries([])
        }
      } finally {
        setIsDayLoading(false)
      }
    }

    loadWorldSnapshot()

    return () => controller.abort()
  }, [meta, selectedDate])

  const sortedCountries = useMemo(
    () => sortCountries(countries, displayMode.metric, sortMode, sortDirection),
    [countries, displayMode.metric, sortMode, sortDirection]
  )

  const filteredCountries = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    if (!normalizedSearch) {
      return sortedCountries
    }

    return sortedCountries.filter((country) =>
      country.name.toLowerCase().includes(normalizedSearch)
    )
  }, [searchQuery, sortedCountries])

  const filteredTopTenCountryNames = useMemo(
    () => getTopTenCountryNames(filteredCountries),
    [filteredCountries]
  )

  const isTopTenSelected =
    filteredTopTenCountryNames.length > 0 &&
    filteredTopTenCountryNames.every((countryName) =>
      selectedCountries.includes(countryName)
    )

  useEffect(() => {
    if (countries.length === 0) {
      setSelectedCountries([])
      return
    }

    setSelectedCountries((currentSelection) => {
      const available = currentSelection.filter((name) =>
        countries.some((country) => country.name === name)
      )

      if (available.length > 0) {
        return available
      }

        return sortCountries(countries, displayMode.metric, sortMode, sortDirection)
        .slice(0, 10)
        .map((country) => country.name)
    })
  }, [countries, displayMode.metric, sortMode, sortDirection])

  const selectedCountryRows = useMemo(() => {
    const countriesByName = new Map(countries.map((country) => [country.name, country]))

    return selectedCountries
      .map((countryName) => countriesByName.get(countryName))
      .filter(Boolean)
  }, [countries, selectedCountries])

  const worldSummary = useMemo(
    () => buildWorldSummary(countries, displayMode),
    [countries, displayMode]
  )

  const worldSummaryValue =
    displayMode.scale === 'per-100k'
      ? displayMode.timeMode === 'on-day'
        ? worldSummary.per100kDaily
        : worldSummary.per100kTotal
      : displayMode.timeMode === 'on-day'
        ? worldSummary.daily
        : worldSummary.total

  const titleText = `${formatDashboardNumber(worldSummaryValue)} Worldwide ${getMetricLabel(
    displayMode.metric
  )} ${getScaleLabel(displayMode.scale).toLowerCase()} ${getTimeModeLabel(
    displayMode.timeMode
  )} ${selectedDate} - Uncover the Trends`

  const selectedCountriesDebug = selectedCountryRows.length
    ? selectedCountryRows
        .map(
          (country) =>
            `${country.name}: ${formatDashboardNumber(getDisplayValue(country, displayMode))}`
        )
        .join(' | ')
    : 'No countries selected'

  const statusText = isMetaLoading || isDayLoading
    ? 'Loading world data...'
    : error || `Selected countries -> ${selectedCountriesDebug}`

  return (
    <section className="w-full bg-white py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-6 px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="ty-h2 max-w-4xl text-black">{titleText}</h2>
        </div>
        <ChartViewToggle value={chart} onChange={setChart} />

        <div className="flex w-full max-w-[1200px] flex-col gap-7 rounded-xl p-4 shadow-[0_0_8px_0_rgba(0,0,0,0.15)]">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ViewSwitcher value={displayMode} onChange={setDisplayMode} />
            <DataFilterBar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={setIsSidebarOpen}
              sidebarProps={{
                selectedDate,
                onDateChange: setSelectedDate,
                searchQuery,
                onSearchQueryChange: setSearchQuery,
                sortMode,
                onSortModeChange: setSortMode,
                sortDirection,
                onToggleSortDirection: () =>
                  setSortDirection((currentDirection) =>
                    currentDirection === 'asc' ? 'desc' : 'asc'
                  ),
                countries: filteredCountries,
                selectedCountries,
                onToggleCountry: (countryName) =>
                  setSelectedCountries((currentSelection) =>
                    toggleCountrySelection(currentSelection, countryName)
                  ),
                onSelectTopTen: () =>
                  setSelectedCountries((currentSelection) => {
                    if (
                      filteredTopTenCountryNames.length > 0 &&
                      filteredTopTenCountryNames.every((countryName) =>
                        currentSelection.includes(countryName)
                      )
                    ) {
                      return currentSelection.filter(
                        (countryName) => !filteredTopTenCountryNames.includes(countryName)
                      )
                    }

                    return filteredTopTenCountryNames
                  }),
                isTopTenSelected,
                onResetSidebar: () => {
                  setSearchQuery('')
                  setSortMode(initialSortMode)
                  setSortDirection(initialSortDirection)
                  setSelectedDate(getFallbackWorldDate(meta))
                  setSelectedCountries(
                    getTopTenCountryNames(
                      sortCountries(countries, displayMode.metric, initialSortMode, initialSortDirection)
                    )
                  )
                },
                metric: displayMode.metric,
              }}
            />
          </div>
          {chart ? <p>linechart</p> : <p>map chart</p>}
          <p className="ty-small text-dark-grey">
            Debug: metric={displayMode.metric} | timeMode={displayMode.timeMode} |
            scale={displayMode.scale} | sortMode={sortMode} |
            sortDirection={sortDirection} | date={selectedDate} |
            sidebarOpen={String(isSidebarOpen)} | {statusText}
          </p>
        </div>
      </div>
    </section>
  )
}

export default MiddleChartArea
