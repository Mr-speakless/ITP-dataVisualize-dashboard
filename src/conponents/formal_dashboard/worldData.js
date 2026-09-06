const dataPrefix = import.meta.env.VITE_C19_C_DATA
const worldDataPath = 'c_data/world'

export const DEFAULT_WORLD_DATE = '2023-03-09'

// The data warehouse is served from a CDN (jsDelivr). On the first hit to a
// cold branch path the CDN can answer 503/504 while it warms from origin,
// then succeed on an immediate retry. Retry a few times before giving up.
const MAX_FETCH_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 400

function buildWorldBaseUrl(relativePath = worldDataPath) {
  if (!dataPrefix) {
    throw new Error('Missing VITE_C19_C_DATA in .env')
  }

  const normalizedDataPrefix = dataPrefix.replace(/\/$/, '')
  const normalizedRelativePath = String(relativePath ?? worldDataPath).replace(/^\/+/, '')
  return `${normalizedDataPrefix}/${normalizedRelativePath}`
}

function delayWithSignal(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599)
}

async function fetchWorldJson(path, signal, relativePath = worldDataPath) {
  const url = `${buildWorldBaseUrl(relativePath)}/${path}`
  let lastError

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    let response

    try {
      response = await fetch(url, { signal })
    } catch (error) {
      // A caller-triggered abort must surface immediately, never be retried.
      if (error?.name === 'AbortError') {
        throw error
      }

      lastError = error

      if (attempt === MAX_FETCH_ATTEMPTS) {
        throw error
      }

      await delayWithSignal(RETRY_BASE_DELAY_MS * attempt, signal)
      continue
    }

    if (response.ok) {
      return response.json()
    }

    const statusError = new Error(
      `World data request failed with status ${response.status}`
    )

    // 4xx (e.g. a genuinely missing file) will not fix itself on retry.
    if (!isRetryableStatus(response.status) || attempt === MAX_FETCH_ATTEMPTS) {
      throw statusError
    }

    lastError = statusError
    await delayWithSignal(RETRY_BASE_DELAY_MS * attempt, signal)
  }

  throw lastError
}

function computePer100k(value, population) {
  if (!population) {
    return 0
  }

  return (value / population) * 100000
}

function buildMetaByRegion(regions = []) {
  return regions.reduce((accumulator, region) => {
    accumulator[region.c_ref] = region
    return accumulator
  }, {})
}

export function formatDashboardNumber(value) {
  const normalizedValue = Number.isFinite(value) ? value : 0

  if (Math.abs(normalizedValue) >= 1000 && !Number.isInteger(normalizedValue)) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(normalizedValue)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Number.isInteger(normalizedValue) ? 0 : 1,
  }).format(normalizedValue)
}

export function getMetricLabel(metric) {
  return metric === 'deaths' ? 'Deaths' : 'Cases'
}

export function getScaleLabel(scale) {
  return scale === 'per-100k' ? 'Per 100k' : 'Total'
}

export function getTimeModeLabel(timeMode) {
  return timeMode === 'on-day' ? 'on day' : 'to date'
}

export async function fetchWorldMeta(signal) {
  return fetchWorldJson('c_meta.json', signal)
}

export async function fetchWorldDaySnapshot(date, signal) {
  return fetchWorldJson(`c_days/${date}.json`, signal)
}

export function normalizeWorldRegionPathName(regionName) {
  return String(regionName ?? '')
    .trim()
    .replace(/ /g, '_')
    .replace(/,/g, '')
}

export function buildWorldSubregionPath(parentRegionName) {
  return buildWorldSubregionPathByHierarchy([parentRegionName])
}

export function buildWorldSubregionPathByHierarchy(regionHierarchy = []) {
  const normalizedHierarchy = (Array.isArray(regionHierarchy) ? regionHierarchy : [])
    .map((regionName) => normalizeWorldRegionPathName(regionName))
    .filter(Boolean)

  if (normalizedHierarchy.length === 0) {
    return worldDataPath
  }

  return `${worldDataPath}/c_subs/${normalizedHierarchy.join('/c_subs/')}`
}

// New York City has its own maintained warehouse (`c_data/nyc`) that breaks the
// city down by borough and then by zipcode. It lives outside the `c_data/world`
// tree, so any drill path that passes through it must be re-rooted there.
const NYC_DATA_PATH = 'c_data/nyc'
const NYC_ROW_NAME = 'New York City'
const NYC_HIERARCHY_PREFIX = ['United States', 'New York', NYC_ROW_NAME]

function hierarchyStartsWith(hierarchy, prefix) {
  return (
    hierarchy.length >= prefix.length &&
    prefix.every((segment, index) => hierarchy[index] === segment)
  )
}

// Maps a region hierarchy of raw region names to the base data path its
// meta/day/series files live under. Everything routes through the world tree
// except the New York City subtree, which is served from `c_data/nyc`.
export function resolveRegionBasePath(regionHierarchy = []) {
  const hierarchy = (Array.isArray(regionHierarchy) ? regionHierarchy : []).filter(Boolean)

  if (hierarchyStartsWith(hierarchy, NYC_HIERARCHY_PREFIX)) {
    const remainder = hierarchy
      .slice(NYC_HIERARCHY_PREFIX.length)
      .map((regionName) => normalizeWorldRegionPathName(regionName))

    if (remainder.length === 0) {
      return NYC_DATA_PATH
    }

    return `${NYC_DATA_PATH}/c_subs/${remainder.join('/c_subs/')}`
  }

  return buildWorldSubregionPathByHierarchy(hierarchy)
}

// The world `New York` county meta lists a `New York City` row with no `n_subs`
// (JHU stopped reporting it as one unit in 2020), so nothing would flag it as
// expandable. We know it drills into the `c_data/nyc` warehouse, so mark it.
export function regionHasKnownSubregions(regionName, seriesPathHierarchy = []) {
  const hierarchy = Array.isArray(seriesPathHierarchy)
    ? seriesPathHierarchy.filter(Boolean)
    : []

  return (
    regionName === NYC_ROW_NAME &&
    hierarchy.length === 2 &&
    hierarchy[0] === 'United States' &&
    hierarchy[1] === 'New York'
  )
}

export async function fetchWorldRegionSeries(regionName, signal) {
  const normalizedRegionName = normalizeWorldRegionPathName(regionName)

  if (!normalizedRegionName) {
    return []
  }

  return fetchWorldJson(`c_series/${normalizedRegionName}.json`, signal)
}

export async function fetchWorldSubregionMeta(parentRegionName, signal) {
  return fetchWorldNestedMeta([parentRegionName], signal)
}

export async function fetchWorldSubregionDaySnapshot(parentRegionName, date, signal) {
  return fetchWorldNestedDaySnapshot([parentRegionName], date, signal)
}

export async function fetchWorldNestedMeta(regionHierarchy, signal) {
  return fetchWorldJson('c_meta.json', signal, resolveRegionBasePath(regionHierarchy))
}

export async function fetchWorldNestedDaySnapshot(regionHierarchy, date, signal) {
  return fetchWorldJson(
    `c_days/${date}.json`,
    signal,
    resolveRegionBasePath(regionHierarchy)
  )
}

export async function fetchWorldSubregionSeries(parentRegionName, regionName, signal) {
  return fetchWorldNestedSeries([parentRegionName], regionName, signal)
}

export function isNycCityRegion(regionHierarchy = [], regionName = '') {
  const hierarchy = (Array.isArray(regionHierarchy) ? regionHierarchy : []).filter(Boolean)

  return (
    regionName === NYC_ROW_NAME &&
    hierarchy.length === 2 &&
    hierarchy[0] === 'United States' &&
    hierarchy[1] === 'New York'
  )
}

export async function fetchWorldNestedSeries(regionHierarchy, regionName, signal) {
  // The synthesised "New York City" county row is fed by the NYC warehouse's
  // city-wide totals series rather than a (non-existent) world c_series file.
  if (isNycCityRegion(regionHierarchy, regionName)) {
    return fetchWorldJson('c_series/_totals.json', signal, NYC_DATA_PATH)
  }

  const normalizedRegionName = normalizeWorldRegionPathName(regionName)

  if (!normalizedRegionName) {
    return []
  }

  return fetchWorldJson(
    `c_series/${normalizedRegionName}.json`,
    signal,
    resolveRegionBasePath(regionHierarchy)
  )
}

// Rolls a set of already-normalised child rows up into a single parent row
// (used to give "New York City" a live entry at the county level, summed from
// its boroughs).
export function buildAggregateRegionRow(childRows, options = {}) {
  const {
    name = '',
    parentRegionName = '',
    seriesPathHierarchy = [],
    hasSubregions = true,
  } = options
  const rows = Array.isArray(childRows) ? childRows : []
  const sumBy = (pick) => rows.reduce((total, row) => total + (Number(pick(row)) || 0), 0)

  const population = sumBy((row) => row.population)
  const totalCases = sumBy((row) => row.totals?.cases)
  const totalDeaths = sumBy((row) => row.totals?.deaths)
  const dailyCases = sumBy((row) => row.daily?.cases)
  const dailyDeaths = sumBy((row) => row.daily?.deaths)
  const seriesKey = seriesPathHierarchy.length > 0
    ? `${seriesPathHierarchy.join('::')}::${name}`
    : name

  return {
    key: seriesKey,
    name,
    caption: '',
    parentRegionName,
    regionLevel: seriesPathHierarchy.length + 1,
    seriesPathHierarchy,
    isSubregion: seriesPathHierarchy.length > 0,
    hasSubregions,
    seriesKey,
    population,
    totals: { cases: totalCases, deaths: totalDeaths },
    daily: { cases: dailyCases, deaths: dailyDeaths },
    per100kTotals: {
      cases: computePer100k(totalCases, population),
      deaths: computePer100k(totalDeaths, population),
    },
    per100kDaily: {
      cases: computePer100k(dailyCases, population),
      deaths: computePer100k(dailyDeaths, population),
    },
  }
}

export function isDateAvailable(meta, date) {
  return Boolean(meta?.c_dates?.includes(date))
}

export function getFallbackWorldDate(meta) {
  if (isDateAvailable(meta, DEFAULT_WORLD_DATE)) {
    return DEFAULT_WORLD_DATE
  }

  return meta?.c_dates?.[meta.c_dates.length - 1] ?? DEFAULT_WORLD_DATE
}

export function buildWorldCountryRows(meta, dayItems, context = '') {
  const metaByRegion = buildMetaByRegion(meta?.c_regions)
  const items = Array.isArray(dayItems) ? dayItems : []
  const isContextString = typeof context === 'string'
  const contextObject = !isContextString && context && typeof context === 'object'
    ? context
    : {}
  const parentRegionName = isContextString
    ? context
    : contextObject.parentRegionName ?? ''
  const seriesPathHierarchy = isContextString
    ? (parentRegionName ? [parentRegionName] : [])
    : Array.isArray(contextObject.seriesPathHierarchy)
      ? contextObject.seriesPathHierarchy.filter(Boolean)
      : []
  const regionLevel = Number(contextObject.regionLevel) > 0
    ? Number(contextObject.regionLevel)
    : seriesPathHierarchy.length > 0
      ? seriesPathHierarchy.length + 1
      : 1
  const isSubregionLevel = regionLevel > 1
  const captionByRegion = meta?.c_sub_captions ?? {}

  return items.map((item) => {
    const regionMeta = metaByRegion[item.c_ref] ?? {}
    const caption = captionByRegion[item.c_ref] ?? ''
    const population = regionMeta.c_people ?? 0
    const totalCases = item.totals?.Cases ?? 0
    const totalDeaths = item.totals?.Deaths ?? 0
    const dailyCases = item.daily?.Cases ?? 0
    const dailyDeaths = item.daily?.Deaths ?? 0

    const seriesKey = seriesPathHierarchy.length > 0
      ? `${seriesPathHierarchy.join('::')}::${item.c_ref}`
      : item.c_ref

    return {
      key: seriesKey,
      name: item.c_ref,
      caption,
      parentRegionName,
      regionLevel,
      seriesPathHierarchy,
      isSubregion: isSubregionLevel,
      hasSubregions:
        Number(regionMeta.n_subs ?? 0) > 0 ||
        regionHasKnownSubregions(item.c_ref, seriesPathHierarchy),
      seriesKey,
      population,
      totals: {
        cases: totalCases,
        deaths: totalDeaths,
      },
      daily: {
        cases: dailyCases,
        deaths: dailyDeaths,
      },
      per100kTotals: {
        cases: computePer100k(totalCases, population),
        deaths: computePer100k(totalDeaths, population),
      },
      per100kDaily: {
        cases: computePer100k(dailyCases, population),
        deaths: computePer100k(dailyDeaths, population),
      },
    }
  })
}

export function buildTrendDateRange(meta, endDate, startDate) {
  const dates = Array.isArray(meta?.c_dates) ? meta.c_dates : []

  return dates.filter(
    (date) => (!startDate || date >= startDate) && (!endDate || date <= endDate)
  )
}

function findLatestSeriesItemBeforeDate(seriesItems, date) {
  if (!Array.isArray(seriesItems) || !date) {
    return null
  }

  return seriesItems.reduce((latestItem, candidate) => {
    if (!candidate?.on || candidate.on >= date) {
      return latestItem
    }

    if (!latestItem?.on || candidate.on > latestItem.on) {
      return candidate
    }

    return latestItem
  }, null)
}

export function buildCountryTrendSeriesPoints(country, seriesItems, displayMode, dates) {
  if (!country || !Array.isArray(dates) || dates.length === 0) {
    return []
  }

  const population = country.population ?? 0
  const items = Array.isArray(seriesItems) ? seriesItems : []
  const itemsByDate = items.reduce((accumulator, item) => {
    if (item?.on) {
      accumulator[item.on] = item
    }

    return accumulator
  }, {})

  const baselineItem = findLatestSeriesItemBeforeDate(items, dates[0])
  let previousTotalCases = Number(baselineItem?.Cases ?? 0)
  let previousTotalDeaths = Number(baselineItem?.Deaths ?? 0)

  return dates.map((date, index) => {
    const item = itemsByDate[date]
    const nextTotalCases = Number(item?.Cases)
    const nextTotalDeaths = Number(item?.Deaths)
    const totalCases = Number.isFinite(nextTotalCases) ? nextTotalCases : previousTotalCases
    const totalDeaths = Number.isFinite(nextTotalDeaths) ? nextTotalDeaths : previousTotalDeaths

    // Some historical corrections can create negative daily diffs.
    // Clamp them to zero so the chart stays legible for "On Day" mode.
    const dailyCases = Math.max(0, totalCases - previousTotalCases)
    const dailyDeaths = Math.max(0, totalDeaths - previousTotalDeaths)

    const point = {
      index,
      date,
      totals: {
        cases: totalCases,
        deaths: totalDeaths,
      },
      daily: {
        cases: dailyCases,
        deaths: dailyDeaths,
      },
      per100kTotals: {
        cases: computePer100k(totalCases, population),
        deaths: computePer100k(totalDeaths, population),
      },
      per100kDaily: {
        cases: computePer100k(dailyCases, population),
        deaths: computePer100k(dailyDeaths, population),
      },
    }

    previousTotalCases = totalCases
    previousTotalDeaths = totalDeaths

    return {
      ...point,
      value: getDisplayValue(point, displayMode),
    }
  })
}

export function getSortValue(country, metric, sortMode, timeMode = 'to-date') {
  if (!country) {
    return 0
  }

  const isDailyMode = timeMode === 'on-day'

  if (sortMode === 'per-100k') {
    return isDailyMode
      ? country.per100kDaily[metric] ?? 0
      : country.per100kTotals[metric] ?? 0
  }

  return isDailyMode
    ? country.daily[metric] ?? 0
    : country.totals[metric] ?? 0
}

export function getDisplayValue(country, displayMode) {
  if (!country) {
    return 0
  }

  const collection =
    displayMode.scale === 'per-100k'
      ? displayMode.timeMode === 'on-day'
        ? country.per100kDaily
        : country.per100kTotals
      : displayMode.timeMode === 'on-day'
        ? country.daily
        : country.totals

  return collection[displayMode.metric] ?? 0
}

export function buildWorldSummary(countries, displayMode) {
  const metric = displayMode.metric
  const totals = countries.reduce(
    (accumulator, country) => {
      accumulator.population += country.population ?? 0
      accumulator.total += country.totals[metric] ?? 0
      accumulator.daily += country.daily[metric] ?? 0
      return accumulator
    },
    { population: 0, total: 0, daily: 0 }
  )

  return {
    total: totals.total,
    daily: totals.daily,
    per100kTotal: computePer100k(totals.total, totals.population),
    per100kDaily: computePer100k(totals.daily, totals.population),
  }
}
