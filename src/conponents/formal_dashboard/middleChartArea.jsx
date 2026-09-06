import { useEffect, useMemo, useRef, useState } from 'react'
import { getNationalColorForRegion } from './countryFlags.js'
import ChartViewToggle from './chartConponents/ChartViewToggle.jsx'
import CountryTrendChart from './chartConponents/CountryTrendChart.jsx'
import DataFilterBar from './chartConponents/DataFilterBar.jsx'
import SelectedCountryChips from './chartConponents/SelectedCountryChips.jsx'
import TimeProgressBar from './chartConponents/TimeProgressBar.jsx'
import ViewSwitcher from './chartConponents/ViewSwitcher.jsx'
import WorldProjectionMap from './chartConponents/WorldProjectionMap.jsx'
import NycBoroughMap from './chartConponents/NycBoroughMap.jsx'
import NycZipcodeMap from './chartConponents/NycZipcodeMap.jsx'
import { useNestedRegionLevel, useNycCityRow } from './hooks/useNestedRegionLevel.js'
import {
  DEFAULT_WORLD_DATE,
  buildCountryTrendSeriesPoints,
  buildTrendDateRange,
  buildWorldCountryRows,
  fetchWorldNestedSeries,
  fetchWorldRegionSeries,
  fetchWorldDaySnapshot,
  fetchWorldMeta,
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

const EMPTY_ROWS = []

function sortCountries(countries, metric, timeMode, sortMode, sortDirection) {
  return [...countries].sort((left, right) => {
    const rightValue = getSortValue(right, metric, sortMode, timeMode)
    const leftValue = getSortValue(left, metric, sortMode, timeMode)

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

// While the user is drilled into a country, selection is confined to what is
// currently on screen: the country, every expanded region on the path, and the
// rows of the deepest expanded level. `levels[i]` is `{ name, rows }` for drill
// level i (0 = the expanded country and its subregion rows).
function buildDrillSelectionScope(levels) {
  const topName = levels[0]?.name

  if (!topName) {
    return null
  }

  const scope = new Set([topName])
  let deepestExpandedIndex = 0

  levels.forEach((level, index) => {
    if (level.name) {
      scope.add(level.name)
      deepestExpandedIndex = index
    }
  })

  ;(levels[deepestExpandedIndex]?.rows ?? []).forEach((region) => scope.add(region.name))

  return scope
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
  const [level2Name, setLevel2Name] = useState('')
  const [level3Name, setLevel3Name] = useState('')
  const [level4Name, setLevel4Name] = useState('')
  const [level5Name, setLevel5Name] = useState('')
  const [hoveredCountryName, setHoveredCountryName] = useState('')
  const [countrySeriesByName, setCountrySeriesByName] = useState({})
  const [worldSnapshotByDate, setWorldSnapshotByDate] = useState({})
  const [displayedMapCountries, setDisplayedMapCountries] = useState([])
  const [displayedMapDate, setDisplayedMapDate] = useState('')
  const [isDayLoading, setIsDayLoading] = useState(true)
  const [isSeriesLoading, setIsSeriesLoading] = useState(false)
  const [error, setError] = useState('')
  const [seriesError, setSeriesError] = useState('')
  const pendingMapDatesRef = useRef(new Set())
  const controlsRowRef = useRef(null)
  const regionalSnapshotDate = useMemo(
    () => (chart ? selectedDate : timelineDate || selectedDate),
    [chart, selectedDate, timelineDate]
  )

  // JHU stopped emitting the "New York City" county row in 2020, so synthesise
  // a live one from the NYC warehouse and splice it into the New York counties.
  const nycCityRow = useNycCityRow({
    enabled: level2Name === 'United States' && level3Name === 'New York',
    snapshotDate: regionalSnapshotDate,
  })
  const level3ExtraRows = useMemo(
    () => (nycCityRow ? [nycCityRow] : EMPTY_ROWS),
    [nycCityRow]
  )

  // Level 2..5 of the region drill-down. Each level loads the children of its
  // own `name` (a row shown one level up); its ancestors form `ancestorPath`.
  const level2 = useNestedRegionLevel({
    name: level2Name,
    setName: setLevel2Name,
    ancestorPath: '',
    parentRows: countries,
    snapshotDate: regionalSnapshotDate,
    enabled: true,
  })
  const level3 = useNestedRegionLevel({
    name: level3Name,
    setName: setLevel3Name,
    ancestorPath: level2Name,
    parentRows: level2.rows,
    snapshotDate: regionalSnapshotDate,
    enabled: Boolean(level2Name),
    extraRows: level3ExtraRows,
  })
  const level4 = useNestedRegionLevel({
    name: level4Name,
    setName: setLevel4Name,
    ancestorPath: [level2Name, level3Name].filter(Boolean).join('::'),
    parentRows: level3.rows,
    snapshotDate: regionalSnapshotDate,
    enabled: Boolean(level2Name && level3Name),
  })
  const level5 = useNestedRegionLevel({
    name: level5Name,
    setName: setLevel5Name,
    ancestorPath: [level2Name, level3Name, level4Name].filter(Boolean).join('::'),
    parentRows: level4.rows,
    snapshotDate: regionalSnapshotDate,
    enabled: Boolean(level2Name && level3Name && level4Name),
  })
  // Rebuilt every render (each hook returns a fresh object); only read
  // synchronously in event handlers and reset, so identity churn is harmless.
  const drillLevels = [level2, level3, level4, level5]

  useEffect(() => {
    const controller = new AbortController()

    async function loadMeta() {
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

    const pendingMapDates = pendingMapDatesRef.current
    pendingMapDates.add(timelineDate)

    const controller = new AbortController()
    let isActive = true

    fetchWorldDaySnapshot(timelineDate, controller.signal)
      .then((daySnapshot) => {
        if (!isActive) {
          return
        }

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
        if (loadError.name !== 'AbortError' && isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading the map snapshot'
          )
        }
      })
      .finally(() => {
        pendingMapDates.delete(timelineDate)
      })

    return () => {
      isActive = false
      controller.abort()
      pendingMapDates.delete(timelineDate)
    }
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
    () => sortCountries(countries, displayMode.metric, displayMode.timeMode, sortMode, sortDirection),
    [countries, displayMode.metric, displayMode.timeMode, sortMode, sortDirection]
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

  const sortedLevel2Rows = useMemo(
    () =>
      sortCountries(
        level2.rows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, level2.rows, sortMode, sortDirection]
  )

  const sortedLevel3Rows = useMemo(
    () =>
      sortCountries(
        level3.rows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, level3.rows, sortMode, sortDirection]
  )

  const sortedLevel4Rows = useMemo(
    () =>
      sortCountries(
        level4.rows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, level4.rows, sortMode, sortDirection]
  )

  const sortedLevel5Rows = useMemo(
    () =>
      sortCountries(
        level5.rows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, level5.rows, sortMode, sortDirection]
  )

  const sortedDrillRows = useMemo(
    () => [sortedLevel2Rows, sortedLevel3Rows, sortedLevel4Rows, sortedLevel5Rows],
    [sortedLevel2Rows, sortedLevel3Rows, sortedLevel4Rows, sortedLevel5Rows]
  )

  const drillScopeLevels = useMemo(
    () => [
      { name: level2.name, rows: sortedLevel2Rows },
      { name: level3.name, rows: sortedLevel3Rows },
      { name: level4.name, rows: sortedLevel4Rows },
      { name: level5.name, rows: sortedLevel5Rows },
    ],
    [
      level2.name,
      level3.name,
      level4.name,
      level5.name,
      sortedLevel2Rows,
      sortedLevel3Rows,
      sortedLevel4Rows,
      sortedLevel5Rows,
    ]
  )

  const sidebarDrillLevels = useMemo(
    () => [
      { name: level2.name, rows: sortedLevel2Rows, date: level2.date, isLoading: level2.isLoading, error: level2.error },
      { name: level3.name, rows: sortedLevel3Rows, date: level3.date, isLoading: level3.isLoading, error: level3.error },
      { name: level4.name, rows: sortedLevel4Rows, date: level4.date, isLoading: level4.isLoading, error: level4.error },
      { name: level5.name, rows: sortedLevel5Rows, date: level5.date, isLoading: level5.isLoading, error: level5.error },
    ],
    [
      level2.name, level2.date, level2.isLoading, level2.error,
      level3.name, level3.date, level3.isLoading, level3.error,
      level4.name, level4.date, level4.isLoading, level4.error,
      level5.name, level5.date, level5.isLoading, level5.error,
      sortedLevel2Rows,
      sortedLevel3Rows,
      sortedLevel4Rows,
      sortedLevel5Rows,
    ]
  )

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
      if (level2.name) {
        const drillSelectionScope = buildDrillSelectionScope(drillScopeLevels)
        const availableDrillSelection = currentSelection.filter((name) =>
          drillSelectionScope?.has(name)
        )

        if (availableDrillSelection.length > 0) {
          return availableDrillSelection
        }

        return [level2.name]
      }

      const topLevelCountryNames = new Set(countries.map((country) => country.name))
      const availableTopLevelSelection = currentSelection.filter((name) =>
        topLevelCountryNames.has(name)
      )

      if (availableTopLevelSelection.length > 0) {
        return availableTopLevelSelection
      }

      return sortCountries(
        countries,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      )
        .slice(0, 10)
        .map((country) => country.name)
    })
  }, [
    countries,
    displayMode.metric,
    displayMode.timeMode,
    drillScopeLevels,
    level2.name,
    sortMode,
    sortDirection,
  ])

  const selectedCountryRows = useMemo(() => {
    const rowsByName = new Map(countries.map((country) => [country.name, country]))

    sortedDrillRows.forEach((levelRows) => {
      levelRows.forEach((region) => rowsByName.set(region.name, region))
    })

    return selectedCountries
      .map((countryName) => rowsByName.get(countryName))
      .filter(Boolean)
  }, [countries, selectedCountries, sortedDrillRows])

  const countryRowsByName = useMemo(() => {
    const rowsByName = new Map()
    countries.forEach((country) => rowsByName.set(country.name, country))
    sortedDrillRows.forEach((levelRows) => {
      levelRows.forEach((region) => rowsByName.set(region.name, region))
    })
    return rowsByName
  }, [countries, sortedDrillRows])

  const handleToggleRegionSelection = (regionInput) => {
    setSelectedCountries((currentSelection) => {
      const regionName = typeof regionInput === 'string' ? regionInput : regionInput?.name

      if (!regionName) {
        return currentSelection
      }

      const regionRow =
        typeof regionInput === 'object' && regionInput
          ? regionInput
          : countryRowsByName.get(regionName)

      if (level2.name) {
        const allowedNames = buildDrillSelectionScope(drillScopeLevels)

        if (!allowedNames?.has(regionName)) {
          return currentSelection
        }
      }

      const isSelecting = !currentSelection.includes(regionName)
      let nextSelection = toggleCountrySelection(currentSelection, regionName)

      // Selecting a nested region drops selected siblings of its ancestors so
      // the chart stays on one path (e.g. picking a county clears other states).
      const regionLevelNumber = Number(regionRow?.regionLevel)

      if (isSelecting && regionLevelNumber >= 3) {
        const ancestorNames = new Set(regionRow?.seriesPathHierarchy ?? [])
        const ownLevelIndex = regionLevelNumber - 2
        // NYC boroughs share names with JHU counties (Queens, Bronx, ...). A
        // name that also appears at the selected row's own level is ambiguous,
        // so never treat it as a shallower sibling to drop.
        const ownLevelNames = new Set(
          (sortedDrillRows[ownLevelIndex] ?? []).map((region) => region.name)
        )
        const shallowerRowNames = new Set()

        sortedDrillRows.forEach((levelRows, index) => {
          if (index < ownLevelIndex) {
            levelRows.forEach((region) => {
              if (!ownLevelNames.has(region.name)) {
                shallowerRowNames.add(region.name)
              }
            })
          }
        })

        nextSelection = nextSelection.filter(
          (name) => !shallowerRowNames.has(name) || ancestorNames.has(name)
        )
      }

      return nextSelection
    })
  }

  const handleToggleExpansion = (levelIndex, regionName) => {
    const targetLevel = drillLevels[levelIndex]

    if (!targetLevel) {
      return
    }

    const nextName = targetLevel.name === regionName ? '' : regionName

    targetLevel.setName(nextName)

    for (let deeperIndex = levelIndex + 1; deeperIndex < drillLevels.length; deeperIndex += 1) {
      drillLevels[deeperIndex].reset()
    }

    if (nextName) {
      const ancestorNames = drillLevels
        .slice(0, levelIndex)
        .map((level) => level.name)
        .filter(Boolean)

      setSelectedCountries([...ancestorNames, nextName])
      return
    }

    if (levelIndex === 0) {
      const countryNames = new Set(countries.map((country) => country.name))
      setSelectedCountries((currentSelection) =>
        currentSelection.filter((name) => countryNames.has(name))
      )
      return
    }

    const survivorNames = new Set()

    drillLevels.slice(0, levelIndex).forEach((level, index) => {
      if (level.name) {
        survivorNames.add(level.name)
      }

      sortedDrillRows[index].forEach((region) => survivorNames.add(region.name))
    })

    setSelectedCountries((currentSelection) =>
      currentSelection.filter((name) => survivorNames.has(name))
    )
  }

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
      (country) => !Array.isArray(countrySeriesByName[country.seriesKey ?? country.name])
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
          missingCountries.map(async (country) => {
            const seriesPathHierarchy = Array.isArray(country.seriesPathHierarchy)
              ? country.seriesPathHierarchy
              : []

            return {
              name: country.name,
              seriesKey: country.seriesKey ?? country.name,
              series:
                seriesPathHierarchy.length > 0
                  ? await fetchWorldNestedSeries(
                      seriesPathHierarchy,
                      country.name,
                      controller.signal
                    )
                  : await fetchWorldRegionSeries(country.name, controller.signal),
            }
          })
        )

        setCountrySeriesByName((currentSeries) => {
          const nextSeries = { ...currentSeries }

          results.forEach((result) => {
            nextSeries[result.seriesKey] = result.series
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
          const rawSeries = countrySeriesByName[country.seriesKey ?? country.name]

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
                onToggleCountry: handleToggleRegionSelection,
                drillLevels: sidebarDrillLevels,
                onToggleExpansion: handleToggleExpansion,
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
                  drillLevels.forEach((level) => level.reset())
                  setSelectedCountries(
                    getTopTenCountryNames(
                      sortCountries(
                        countries,
                        displayMode.metric,
                        displayMode.timeMode,
                        initialSortMode,
                        initialSortDirection
                      )
                    )
                  )
                },
                metric: displayMode.metric,
                timeMode: displayMode.timeMode,
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
          ) : level4Name === 'New York City' && level5Name ? (
            <NycZipcodeMap
              regions={sortedLevel5Rows}
              boroughName={level5Name}
              displayMode={displayMode}
              selectedCountries={selectedCountries}
              timelineDate={mapDisplayDate}
              isLoading={level5.isLoading && sortedLevel5Rows.length === 0}
              error={level5.error}
              hoveredCountryName={hoveredCountryName}
              onHoverCountryChange={setHoveredCountryName}
              onToggleCountry={handleToggleRegionSelection}
            />
          ) : level4Name === 'New York City' ? (
            <NycBoroughMap
              regions={sortedLevel4Rows}
              displayMode={displayMode}
              selectedCountries={selectedCountries}
              timelineDate={mapDisplayDate}
              isLoading={level4.isLoading && sortedLevel4Rows.length === 0}
              error={level4.error}
              hoveredCountryName={hoveredCountryName}
              onHoverCountryChange={setHoveredCountryName}
              onToggleCountry={handleToggleRegionSelection}
            />
          ) : (
            <WorldProjectionMap
              countries={mapCountries}
              regionalCountries={sortedLevel2Rows}
              subregionalCountries={sortedLevel3Rows}
              focusedCountryName={level2.name}
              focusedSubregionName={level3.name}
              displayMode={displayMode}
              selectedCountries={selectedCountries}
              timelineDate={mapDisplayDate}
              isLoading={isDayLoading && mapCountries.length === 0}
              isUpdating={isMapSnapshotLoading}
              error={error}
              hoveredCountryName={hoveredCountryName}
              onHoverCountryChange={setHoveredCountryName}
              onToggleCountry={handleToggleRegionSelection}
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
