import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildAggregateRegionRow,
  buildWorldCountryRows,
  fetchWorldNestedDaySnapshot,
  fetchWorldNestedMeta,
} from '../worldData.js'

const LATEST_FRAME_KEY = '__latest__'
const PATH_SEPARATOR = '::'
const NYC_CITY_HIERARCHY = ['United States', 'New York', 'New York City']

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

/**
 * Loads one drill level of the region hierarchy: the children of the region
 * named `name`, whose ancestors above it are `ancestorPath` (a `::`-joined
 * chain of raw region names, empty at the country level).
 *
 * `extraRows` are merged in after the fetched rows (deduped by name) so a
 * synthesised row (e.g. a live "New York City") can join a real level.
 *
 * Generalises the two hand-rolled subregion effects that middleChartArea used
 * to carry, so extra levels (NYC borough / zipcode) cost one more hook call.
 */
export function useNestedRegionLevel({
  name = '',
  setName,
  ancestorPath = '',
  parentRows = [],
  snapshotDate = '',
  enabled = true,
  extraRows = [],
}) {
  const [loadedRows, setLoadedRows] = useState([])
  const [date, setDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const frameCacheRef = useRef(new Map())

  const ancestorsReady = !ancestorPath || !ancestorPath.split(PATH_SEPARATOR).includes('')
  const isActive = enabled && ancestorsReady && Boolean(name)

  const rows = useMemo(() => {
    const base = Array.isArray(loadedRows) ? loadedRows : []
    const extras = Array.isArray(extraRows) ? extraRows.filter(Boolean) : []

    if (extras.length === 0) {
      return base
    }

    const presentNames = new Set(base.map((region) => region.name))
    return [...base, ...extras.filter((region) => !presentNames.has(region.name))]
  }, [loadedRows, extraRows])

  const reset = useCallback(() => {
    setName?.('')
    setLoadedRows([])
    setDate('')
    setError('')
    setIsLoading(false)
  }, [setName])

  // Collapse this level when the region it points at drops out of its parent
  // list (parent reloaded, switched country, etc.).
  useEffect(() => {
    if (!name || !Array.isArray(parentRows) || parentRows.length === 0) {
      return
    }

    if (!parentRows.some((region) => region.name === name)) {
      reset()
    }
  }, [name, parentRows, reset])

  useEffect(() => {
    if (!isActive) {
      setLoadedRows([])
      setDate('')
      setError('')
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const fetchHierarchy = ancestorPath
      ? [...ancestorPath.split(PATH_SEPARATOR), name]
      : [name]
    const regionLevel = fetchHierarchy.length + 1
    const frameCache = frameCacheRef.current
    const hierarchyKey = fetchHierarchy.join(PATH_SEPARATOR)
    const frameKey = `${hierarchyKey}${PATH_SEPARATOR}${snapshotDate}`
    const latestKey = `${hierarchyKey}${PATH_SEPARATOR}${LATEST_FRAME_KEY}`

    async function load() {
      const cachedFrame = frameCache.get(frameKey) ?? frameCache.get(latestKey)

      if (cachedFrame) {
        setLoadedRows(cachedFrame.rows)
        setDate(cachedFrame.date)
      }

      setIsLoading(true)
      setError('')

      try {
        const nestedMeta = await fetchWorldNestedMeta(fetchHierarchy, controller.signal)
        const nestedDate = resolveNearestAvailableDate(nestedMeta, snapshotDate)

        if (!nestedDate) {
          setLoadedRows([])
          setDate('')
          return
        }

        const nestedDaySnapshot = await fetchWorldNestedDaySnapshot(
          fetchHierarchy,
          nestedDate,
          controller.signal
        )
        const nestedRows = buildWorldCountryRows(nestedMeta, nestedDaySnapshot, {
          parentRegionName: name,
          regionLevel,
          seriesPathHierarchy: fetchHierarchy,
        })

        const nextFrame = { date: nestedDate, rows: nestedRows }
        frameCache.set(frameKey, nextFrame)
        frameCache.set(latestKey, nextFrame)

        setLoadedRows(nestedRows)
        setDate(nestedDate)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unknown error while loading region data'
          )
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [isActive, name, ancestorPath, snapshotDate])

  return { name, setName, rows, date, isLoading, error, reset }
}

/**
 * Builds a live "New York City" county row by summing its five boroughs from
 * the dedicated NYC warehouse. JHU dropped the NYC county row in 2020, so
 * without this the New-York-state level has no way into the borough / zipcode
 * breakdown for any recent date.
 */
export function useNycCityRow({ enabled = false, snapshotDate = '' }) {
  const [row, setRow] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      if (!enabled) {
        setRow(null)
        return
      }

      try {
        const boroughMeta = await fetchWorldNestedMeta(NYC_CITY_HIERARCHY, controller.signal)
        const nearestDate = resolveNearestAvailableDate(boroughMeta, snapshotDate)

        if (!nearestDate) {
          setRow(null)
          return
        }

        const boroughDay = await fetchWorldNestedDaySnapshot(
          NYC_CITY_HIERARCHY,
          nearestDate,
          controller.signal
        )
        const boroughRows = buildWorldCountryRows(boroughMeta, boroughDay, {
          parentRegionName: 'New York City',
          regionLevel: 4,
          seriesPathHierarchy: NYC_CITY_HIERARCHY,
        })

        setRow(
          buildAggregateRegionRow(boroughRows, {
            name: 'New York City',
            parentRegionName: 'New York',
            seriesPathHierarchy: ['United States', 'New York'],
          })
        )
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setRow(null)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [enabled, snapshotDate])

  return row
}
