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
  fetchWorldNestedDaySnapshot,
  fetchWorldNestedMeta,
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

function resolveNearestAvailableDate(meta, targetDate) {
  const availableDates = Array.isArray(meta?.c_dates) ? meta.c_dates : []

  if (availableDates.length === 0) {
    return ''
  }

  if (availableDates.includes(targetDate)) {
    return targetDate
  }

  const latestBeforeTarget = availableDates.filter((date) => date <= targetDate).at(-1)
  return latestBeforeTarget ?? availableDates[availableDates.length - 1]
}

function buildExpandedCountryFrameKey(countryName, snapshotDate) {
  return `${countryName}::${snapshotDate}`
}

function buildExpandedCountryLatestKey(countryName) {
  return `${countryName}::__latest__`
}

function buildExpandedSubregionFrameKey(countryName, subregionName, snapshotDate) {
  return `${countryName}::${subregionName}::${snapshotDate}`
}

function buildExpandedSubregionLatestKey(countryName, subregionName) {
  return `${countryName}::${subregionName}::__latest__`
}

function buildExpandedSelectionScope({
  expandedCountryName,
  expandedCountryRows,
  expandedSubregionName,
  expandedSubregionRows,
}) {
  if (!expandedCountryName) {
    return null
  }

  if (expandedSubregionName) {
    return new Set([
      expandedCountryName,
      expandedSubregionName,
      ...(Array.isArray(expandedSubregionRows) ? expandedSubregionRows : []).map(
        (region) => region.name
      ),
    ])
  }

  return new Set([
    expandedCountryName,
    ...(Array.isArray(expandedCountryRows) ? expandedCountryRows : []).map(
      (region) => region.name
    ),
    ...(Array.isArray(expandedSubregionRows) ? expandedSubregionRows : []).map(
      (region) => region.name
    ),
  ])
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
  const [expandedCountryName, setExpandedCountryName] = useState('')
  const [expandedCountryRows, setExpandedCountryRows] = useState([])
  const [expandedCountryRowsDate, setExpandedCountryRowsDate] = useState('')
  const [isExpandedCountryRowsLoading, setIsExpandedCountryRowsLoading] = useState(false)
  const [expandedCountryRowsError, setExpandedCountryRowsError] = useState('')
  const [expandedSubregionName, setExpandedSubregionName] = useState('')
  const [expandedSubregionRows, setExpandedSubregionRows] = useState([])
  const [expandedSubregionRowsDate, setExpandedSubregionRowsDate] = useState('')
  const [isExpandedSubregionRowsLoading, setIsExpandedSubregionRowsLoading] = useState(false)
  const [expandedSubregionRowsError, setExpandedSubregionRowsError] = useState('')
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
  const expandedCountryFrameCacheRef = useRef(new Map())
  const expandedSubregionFrameCacheRef = useRef(new Map())
  const controlsRowRef = useRef(null)
  const regionalSnapshotDate = useMemo(
    () => (chart ? selectedDate : timelineDate || selectedDate),
    [chart, selectedDate, timelineDate]
  )

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
    if (!expandedCountryName) {
      setExpandedCountryRows([])
      setExpandedCountryRowsDate('')
      setExpandedCountryRowsError('')
      setIsExpandedCountryRowsLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadExpandedCountryRows() {
      const countryFrameKey = buildExpandedCountryFrameKey(
        expandedCountryName,
        regionalSnapshotDate
      )
      const countryLatestKey = buildExpandedCountryLatestKey(expandedCountryName)
      const cachedFrame =
        expandedCountryFrameCacheRef.current.get(countryFrameKey) ??
        expandedCountryFrameCacheRef.current.get(countryLatestKey)

      if (cachedFrame) {
        setExpandedCountryRows(cachedFrame.rows)
        setExpandedCountryRowsDate(cachedFrame.date)
      }

      setIsExpandedCountryRowsLoading(true)
      setExpandedCountryRowsError('')

      try {
        const subregionMeta = await fetchWorldNestedMeta(
          [expandedCountryName],
          controller.signal
        )
        const subregionDate = resolveNearestAvailableDate(subregionMeta, regionalSnapshotDate)

        if (!subregionDate) {
          setExpandedCountryRows([])
          setExpandedCountryRowsDate('')
          return
        }

        const subregionDaySnapshot = await fetchWorldNestedDaySnapshot(
          [expandedCountryName],
          subregionDate,
          controller.signal
        )
        const subregionRows = buildWorldCountryRows(
          subregionMeta,
          subregionDaySnapshot,
          {
            parentRegionName: expandedCountryName,
            regionLevel: 2,
            seriesPathHierarchy: [expandedCountryName],
          }
        )

        const nextFrame = {
          date: subregionDate,
          rows: subregionRows,
        }
        expandedCountryFrameCacheRef.current.set(countryFrameKey, nextFrame)
        expandedCountryFrameCacheRef.current.set(countryLatestKey, nextFrame)

        setExpandedCountryRows(subregionRows)
        setExpandedCountryRowsDate(subregionDate)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setExpandedCountryRowsError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading subregion data'
          )
        }
      } finally {
        setIsExpandedCountryRowsLoading(false)
      }
    }

    loadExpandedCountryRows()

    return () => controller.abort()
  }, [expandedCountryName, regionalSnapshotDate])

  useEffect(() => {
    if (!expandedCountryName) {
      setExpandedSubregionName('')
      setExpandedSubregionRows([])
      setExpandedSubregionRowsDate('')
      setExpandedSubregionRowsError('')
      setIsExpandedSubregionRowsLoading(false)
      return
    }

    if (!expandedSubregionName) {
      return
    }

    if (!expandedCountryRows.some((region) => region.name === expandedSubregionName)) {
      setExpandedSubregionName('')
      setExpandedSubregionRows([])
      setExpandedSubregionRowsDate('')
      setExpandedSubregionRowsError('')
      setIsExpandedSubregionRowsLoading(false)
    }
  }, [expandedCountryName, expandedCountryRows, expandedSubregionName])

  useEffect(() => {
    if (!expandedCountryName || !expandedSubregionName) {
      setExpandedSubregionRows([])
      setExpandedSubregionRowsDate('')
      setExpandedSubregionRowsError('')
      setIsExpandedSubregionRowsLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadExpandedSubregionRows() {
      const subregionFrameKey = buildExpandedSubregionFrameKey(
        expandedCountryName,
        expandedSubregionName,
        regionalSnapshotDate
      )
      const subregionLatestKey = buildExpandedSubregionLatestKey(
        expandedCountryName,
        expandedSubregionName
      )
      const cachedFrame =
        expandedSubregionFrameCacheRef.current.get(subregionFrameKey) ??
        expandedSubregionFrameCacheRef.current.get(subregionLatestKey)

      if (cachedFrame) {
        setExpandedSubregionRows(cachedFrame.rows)
        setExpandedSubregionRowsDate(cachedFrame.date)
      }

      setIsExpandedSubregionRowsLoading(true)
      setExpandedSubregionRowsError('')

      try {
        const thirdLevelMeta = await fetchWorldNestedMeta(
          [expandedCountryName, expandedSubregionName],
          controller.signal
        )
        const thirdLevelDate = resolveNearestAvailableDate(thirdLevelMeta, regionalSnapshotDate)

        if (!thirdLevelDate) {
          setExpandedSubregionRows([])
          setExpandedSubregionRowsDate('')
          return
        }

        const thirdLevelDaySnapshot = await fetchWorldNestedDaySnapshot(
          [expandedCountryName, expandedSubregionName],
          thirdLevelDate,
          controller.signal
        )
        const thirdLevelRows = buildWorldCountryRows(
          thirdLevelMeta,
          thirdLevelDaySnapshot,
          {
            parentRegionName: expandedSubregionName,
            regionLevel: 3,
            seriesPathHierarchy: [expandedCountryName, expandedSubregionName],
          }
        )

        const nextFrame = {
          date: thirdLevelDate,
          rows: thirdLevelRows,
        }
        expandedSubregionFrameCacheRef.current.set(subregionFrameKey, nextFrame)
        expandedSubregionFrameCacheRef.current.set(subregionLatestKey, nextFrame)

        setExpandedSubregionRows(thirdLevelRows)
        setExpandedSubregionRowsDate(thirdLevelDate)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setExpandedSubregionRowsError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading third-level region data'
          )
        }
      } finally {
        setIsExpandedSubregionRowsLoading(false)
      }
    }

    loadExpandedSubregionRows()

    return () => controller.abort()
  }, [expandedCountryName, expandedSubregionName, regionalSnapshotDate])

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

  const sortedExpandedCountryRows = useMemo(
    () =>
      sortCountries(
        expandedCountryRows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, expandedCountryRows, sortMode, sortDirection]
  )

  const sortedExpandedSubregionRows = useMemo(
    () =>
      sortCountries(
        expandedSubregionRows,
        displayMode.metric,
        displayMode.timeMode,
        sortMode,
        sortDirection
      ),
    [displayMode.metric, displayMode.timeMode, expandedSubregionRows, sortMode, sortDirection]
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
      if (expandedCountryName) {
        const expandedSelectionScope = buildExpandedSelectionScope({
          expandedCountryName,
          expandedCountryRows: sortedExpandedCountryRows,
          expandedSubregionName,
          expandedSubregionRows: sortedExpandedSubregionRows,
        })
        const availableExpandedSelection = currentSelection.filter((name) =>
          expandedSelectionScope?.has(name)
        )

        if (availableExpandedSelection.length > 0) {
          return availableExpandedSelection
        }

        return [expandedCountryName]
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
    expandedCountryName,
    expandedSubregionName,
    sortedExpandedCountryRows,
    sortedExpandedSubregionRows,
    sortMode,
    sortDirection,
  ])

  const selectedCountryRows = useMemo(() => {
    const countriesByName = new Map(countries.map((country) => [country.name, country]))

    sortedExpandedCountryRows.forEach((country) => {
      countriesByName.set(country.name, country)
    })
    sortedExpandedSubregionRows.forEach((country) => {
      countriesByName.set(country.name, country)
    })

    return selectedCountries
      .map((countryName) => countriesByName.get(countryName))
      .filter(Boolean)
  }, [countries, selectedCountries, sortedExpandedCountryRows, sortedExpandedSubregionRows])

  const countryRowsByName = useMemo(() => {
    const rowsByName = new Map()
    countries.forEach((country) => rowsByName.set(country.name, country))
    sortedExpandedCountryRows.forEach((country) => rowsByName.set(country.name, country))
    sortedExpandedSubregionRows.forEach((country) => rowsByName.set(country.name, country))
    return rowsByName
  }, [countries, sortedExpandedCountryRows, sortedExpandedSubregionRows])

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

      if (expandedCountryName) {
        const allowedNames = buildExpandedSelectionScope({
          expandedCountryName,
          expandedCountryRows: sortedExpandedCountryRows,
          expandedSubregionName,
          expandedSubregionRows: sortedExpandedSubregionRows,
        })

        if (!allowedNames?.has(regionName)) {
          return currentSelection
        }
      }

      const isSelecting = !currentSelection.includes(regionName)
      let nextSelection = toggleCountrySelection(currentSelection, regionName)

      if (isSelecting && Number(regionRow?.regionLevel) === 3) {
        const parentSecondLevelName =
          regionRow?.seriesPathHierarchy?.[1] ?? regionRow?.parentRegionName
        const secondLevelNames = new Set(
          sortedExpandedCountryRows.map((country) => country.name)
        )

        nextSelection = nextSelection.filter(
          (name) => !secondLevelNames.has(name) || name === parentSecondLevelName
        )
      }

      return nextSelection
    })
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
                expandedCountryName,
                expandedCountryRows: sortedExpandedCountryRows,
                expandedCountryRowsDate,
                isExpandedCountryRowsLoading,
                expandedCountryRowsError,
                expandedSubregionName,
                expandedSubregionRows: sortedExpandedSubregionRows,
                expandedSubregionRowsDate,
                isExpandedSubregionRowsLoading,
                expandedSubregionRowsError,
                onToggleCountryExpansion: (countryName) =>
                  setExpandedCountryName((currentExpandedCountryName) => {
                    const nextExpandedCountryName =
                      currentExpandedCountryName === countryName ? '' : countryName

                    setExpandedSubregionName('')
                    setExpandedSubregionRows([])
                    setExpandedSubregionRowsDate('')
                    setExpandedSubregionRowsError('')

                    if (nextExpandedCountryName) {
                      setSelectedCountries([nextExpandedCountryName])
                    } else {
                      setSelectedCountries((currentSelection) =>
                        currentSelection.filter((name) =>
                          countries.some((country) => country.name === name)
                        )
                      )
                    }

                    return nextExpandedCountryName
                  }),
                onToggleSubregionExpansion: (subregionName) =>
                  setExpandedSubregionName((currentExpandedSubregionName) => {
                    const nextExpandedSubregionName =
                      currentExpandedSubregionName === subregionName
                        ? ''
                        : subregionName

                    if (nextExpandedSubregionName) {
                      setSelectedCountries([
                        expandedCountryName,
                        nextExpandedSubregionName,
                      ].filter(Boolean))
                    } else {
                      setSelectedCountries((currentSelection) =>
                        currentSelection.filter(
                          (name) =>
                            name === expandedCountryName ||
                            sortedExpandedCountryRows.some((country) => country.name === name)
                        )
                      )
                    }

                    return nextExpandedSubregionName
                  }),
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
                  setExpandedCountryName('')
                  setExpandedCountryRows([])
                  setExpandedCountryRowsDate('')
                  setExpandedCountryRowsError('')
                  setExpandedSubregionName('')
                  setExpandedSubregionRows([])
                  setExpandedSubregionRowsDate('')
                  setExpandedSubregionRowsError('')
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
          ) : (
            <WorldProjectionMap
              countries={mapCountries}
              regionalCountries={sortedExpandedCountryRows}
              subregionalCountries={sortedExpandedSubregionRows}
              focusedCountryName={expandedCountryName}
              focusedSubregionName={expandedSubregionName}
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

