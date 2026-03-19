import { useEffect, useMemo, useRef, useState } from 'react'
import { getNationalColorForRegion } from './countryFlags.js'
import ChartViewToggle from './chartConponents/ChartViewToggle.jsx'
import CountryTrendChart from './chartConponents/CountryTrendChart.jsx'
import DataFilterBar from './chartConponents/DataFilterBar.jsx'
import SelectedCountryChips from './chartConponents/SelectedCountryChips.jsx'
import TimeProgressBar from './chartConponents/TimeProgressBar.jsx'
import ViewSwitcher from './chartConponents/ViewSwitcher.jsx'
import WorldProjectionMap from './chartConponents/WorldProjectionMap.jsx'
import {
  DEFAULT_WORLD_DATE,
  buildCountryTrendSeriesPoints,
  buildTrendDateRange,
  buildWorldCountryRows,
  fetchWorldRegionSeries,
  fetchWorldDaySnapshot,
  fetchWorldMeta,
  formatDashboardNumber,
  getDisplayValue,
  getFallbackWorldDate,
  getSortValue,
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

function getEarliestAvailableWorldDate(meta) {
  return meta?.c_dates?.[0] ?? DEFAULT_WORLD_DATE
}

const MiddleChartArea = () => {
  const [chart, setChart] = useState(true)
  const [displayMode, setDisplayMode] = useState(initialDisplayMode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [meta, setMeta] = useState(null)
  const [countries, setCountries] = useState([])
  const [loadedSelectedDate, setLoadedSelectedDate] = useState('')
  const [selectedDate, setSelectedDate] = useState(DEFAULT_WORLD_DATE)
  const [timelineStartDate, setTimelineStartDate] = useState('')
  const [timelineDate, setTimelineDate] = useState(DEFAULT_WORLD_DATE)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState(initialSortMode)
  const [sortDirection, setSortDirection] = useState(initialSortDirection)
  const [selectedCountries, setSelectedCountries] = useState([])
  const [hoveredCountryName, setHoveredCountryName] = useState('')
  const [countrySeriesByName, setCountrySeriesByName] = useState({})
  const [worldSnapshotByDate, setWorldSnapshotByDate] = useState({})
  const [displayedMapCountries, setDisplayedMapCountries] = useState([])
  const [displayedMapDate, setDisplayedMapDate] = useState('')
  const [isMetaLoading, setIsMetaLoading] = useState(true)
  const [isDayLoading, setIsDayLoading] = useState(true)
  const [isSeriesLoading, setIsSeriesLoading] = useState(false)
  const [error, setError] = useState('')
  const [seriesError, setSeriesError] = useState('')
  const pendingMapDatesRef = useRef(new Set())
  const controlsRowRef = useRef(null)

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
        const countryRows = buildWorldCountryRows(meta, daySnapshot)

        setCountries(countryRows)
        setLoadedSelectedDate(selectedDate)
        setWorldSnapshotByDate((currentSnapshots) => ({
          ...currentSnapshots,
          [selectedDate]: countryRows,
        }))
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

  useEffect(() => {
    if (chart || !meta || !timelineDate || timelineDate === selectedDate) {
      return
    }

    if (!isDateAvailable(meta, timelineDate)) {
      return
    }

    if (
      Array.isArray(worldSnapshotByDate[timelineDate]) ||
      pendingMapDatesRef.current.has(timelineDate)
    ) {
      return
    }

    pendingMapDatesRef.current.add(timelineDate)

    fetchWorldDaySnapshot(timelineDate)
      .then((daySnapshot) => {
        const countryRows = buildWorldCountryRows(meta, daySnapshot)

        setWorldSnapshotByDate((currentSnapshots) => {
          if (Array.isArray(currentSnapshots[timelineDate])) {
            return currentSnapshots
          }

          return {
            ...currentSnapshots,
            [timelineDate]: countryRows,
          }
        })
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unknown error while loading the map snapshot'
        )
      })
      .finally(() => {
        pendingMapDatesRef.current.delete(timelineDate)
      })
  }, [chart, meta, timelineDate, selectedDate, worldSnapshotByDate])

  useEffect(() => {
    if (!Array.isArray(meta?.c_dates) || meta.c_dates.length === 0) {
      return
    }

    const boundedDates = meta.c_dates.filter((date) => date <= selectedDate)

    if (boundedDates.length === 0) {
      return
    }

    setTimelineStartDate((currentStartDate) => {
      if (!currentStartDate) {
        return boundedDates[0]
      }

      if (boundedDates.includes(currentStartDate)) {
        return currentStartDate
      }

      return (
        boundedDates.find(
          (date) => date.split('-')[0] === String(selectedDate).split('-')[0]
        ) ?? boundedDates[0]
      )
    })
  }, [meta, selectedDate])

  useEffect(() => {
    if (!Array.isArray(meta?.c_dates) || meta.c_dates.length === 0 || !timelineStartDate) {
      return
    }

    const rangedDates = meta.c_dates.filter(
      (date) => date >= timelineStartDate && date <= selectedDate
    )

    if (rangedDates.length === 0) {
      return
    }

    setTimelineDate((currentTimelineDate) => {
      if (rangedDates.includes(currentTimelineDate)) {
        return currentTimelineDate
      }

      if (currentTimelineDate && currentTimelineDate < rangedDates[0]) {
        return rangedDates[0]
      }

      return rangedDates[rangedDates.length - 1]
    })
  }, [meta, selectedDate, timelineStartDate])

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

  const requestedMapCountries = useMemo(() => {
    if (timelineDate === selectedDate && loadedSelectedDate === selectedDate) {
      return countries
    }

    return worldSnapshotByDate[timelineDate] ?? null
  }, [countries, loadedSelectedDate, selectedDate, timelineDate, worldSnapshotByDate])

  useEffect(() => {
    if (chart || !Array.isArray(requestedMapCountries) || requestedMapCountries.length === 0) {
      return
    }

    setDisplayedMapCountries(requestedMapCountries)
    setDisplayedMapDate(timelineDate)
  }, [chart, requestedMapCountries, timelineDate])

  const mapCountries = useMemo(() => {
    if (chart) {
      return countries
    }

    if (Array.isArray(requestedMapCountries)) {
      return requestedMapCountries
    }

    return displayedMapCountries
  }, [chart, countries, displayedMapCountries, requestedMapCountries])

  const mapDisplayDate = useMemo(() => {
    if (chart) {
      return selectedDate
    }

    return Array.isArray(requestedMapCountries)
      ? timelineDate
      : displayedMapDate || timelineDate
  }, [chart, displayedMapDate, requestedMapCountries, selectedDate, timelineDate])

  const isMapSnapshotLoading = useMemo(
    () =>
      !chart &&
      Boolean(meta) &&
      Boolean(timelineDate) &&
      timelineDate !== selectedDate &&
      !Array.isArray(worldSnapshotByDate[timelineDate]),
    [chart, meta, selectedDate, timelineDate, worldSnapshotByDate]
  )

  useEffect(() => {
    if (!chart || selectedCountryRows.length === 0) {
      setIsSeriesLoading(false)
      setSeriesError('')
      return
    }

    const missingCountries = selectedCountryRows.filter(
      (country) => !Array.isArray(countrySeriesByName[country.name])
    )

    if (missingCountries.length === 0) {
      setIsSeriesLoading(false)
      setSeriesError('')
      return
    }

    const controller = new AbortController()

    async function loadCountrySeries() {
      setIsSeriesLoading(true)
      setSeriesError('')

      try {
        const results = await Promise.all(
          missingCountries.map(async (country) => ({
            name: country.name,
            series: await fetchWorldRegionSeries(country.name, controller.signal),
          }))
        )

        setCountrySeriesByName((currentSeries) => {
          const nextSeries = { ...currentSeries }

          results.forEach((result) => {
            nextSeries[result.name] = result.series
          })

          return nextSeries
        })
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setSeriesError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading country trend series'
          )
        }
      } finally {
        setIsSeriesLoading(false)
      }
    }

    loadCountrySeries()

    return () => controller.abort()
  }, [chart, countrySeriesByName, selectedCountryRows])

  const trendDates = useMemo(
    () => buildTrendDateRange(meta, timelineDate, timelineStartDate),
    [meta, timelineDate, timelineStartDate]
  )

  const trendSeries = useMemo(
    () =>
      selectedCountryRows
        .map((country) => {
          const rawSeries = countrySeriesByName[country.name]

          if (!Array.isArray(rawSeries)) {
            return null
          }

          return {
            color: getNationalColorForRegion(country.name),
            name: country.name,
            points: buildCountryTrendSeriesPoints(country, rawSeries, displayMode, trendDates),
          }
        })
        .filter(Boolean),
    [countrySeriesByName, displayMode, selectedCountryRows, trendDates]
  )

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
    : isSeriesLoading
      ? 'Loading trend lines...'
      : isMapSnapshotLoading
        ? 'Loading projection map...'
      : error || seriesError || `Selected countries -> ${selectedCountriesDebug}`

  return (
    <section className="w-full bg-white py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-5 px-4 sm:gap-6 sm:px-5">
        <div className="ty-h2 w-full text-left">
          6,881,804 Worldwide Deaths to date 2023-03-09 - Uncover the Trends
        </div>
        <ChartViewToggle value={chart} onChange={setChart} />

        <div className="flex w-full max-w-[1200px] flex-col gap-4 rounded-xl p-4 shadow-[0_0_8px_0_rgba(0,0,0,0.15)] sm:gap-5 sm:p-5">
          <div
            ref={controlsRowRef}
            className="grid w-full grid-cols-4 items-center gap-2 md:flex md:flex-row md:items-center md:justify-between"
          >
            <ViewSwitcher value={displayMode} onChange={setDisplayMode} />
            <DataFilterBar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={setIsSidebarOpen}
              sidebarAnchorRef={controlsRowRef}
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
                  setTimelineStartDate(getEarliestAvailableWorldDate(meta))
                  setTimelineDate(getFallbackWorldDate(meta))
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
          <SelectedCountryChips
            countries={selectedCountryRows}
            onRemove={(countryName) =>
              setSelectedCountries((currentSelection) =>
                currentSelection.filter((name) => name !== countryName)
              )
            }
          />
          <div className="hidden w-full text-left sm:flex sm:flex-row sm:gap-10">
            <div className="ty-small text-dark-grey">Start Date: {timelineStartDate}</div>
            <div className="ty-small text-dark-grey">Chart Showing Date: {timelineDate}</div>
          </div>
          {chart ? (
            <CountryTrendChart
              series={trendSeries}
              dates={trendDates}
              displayMode={displayMode}
              isLoading={isSeriesLoading}
              error={error || seriesError}
              highlightedCountryName={hoveredCountryName}
            />
          ) : (
            <WorldProjectionMap
              countries={mapCountries}
              displayMode={displayMode}
              selectedCountries={selectedCountries}
              timelineDate={mapDisplayDate}
              isLoading={isDayLoading && mapCountries.length === 0}
              isUpdating={isMapSnapshotLoading}
              error={error}
              hoveredCountryName={hoveredCountryName}
              onHoverCountryChange={setHoveredCountryName}
              onToggleCountry={(countryName) =>
                setSelectedCountries((currentSelection) =>
                  toggleCountrySelection(currentSelection, countryName)
                )
              }
            />
          )}
          {/* <p className="ty-small text-dark-grey">
            Debug: metric={displayMode.metric} | timeMode={displayMode.timeMode} |
            scale={displayMode.scale} | sortMode={sortMode} |
            sortDirection={sortDirection} | maxDate={selectedDate} |
            startDate={timelineStartDate} | timelineDate={timelineDate} |
            sidebarOpen={String(isSidebarOpen)} | {statusText}
          </p> */}
          <TimeProgressBar
            dates={meta?.c_dates ?? []}
            startDate={timelineStartDate}
            endDate={selectedDate}
            valueDate={timelineDate}
            onStartDateChange={setTimelineStartDate}
            onEndDateChange={setSelectedDate}
            onValueDateChange={setTimelineDate}
          />
        </div>
      </div>
    </section>
  )
}

export default MiddleChartArea

