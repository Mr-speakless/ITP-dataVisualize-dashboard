const dataPrefix = import.meta.env.VITE_C19_C_DATA
const worldDataPath = 'c_data/world'

export const DEFAULT_WORLD_DATE = '2023-03-09'

function buildWorldBaseUrl() {
  if (!dataPrefix) {
    throw new Error('Missing VITE_C19_C_DATA in .env')
  }

  return `${dataPrefix.replace(/\/$/, '')}/${worldDataPath}`
}

async function fetchWorldJson(path, signal) {
  const response = await fetch(`${buildWorldBaseUrl()}/${path}`, { signal })

  if (!response.ok) {
    throw new Error(`World data request failed with status ${response.status}`)
  }

  return response.json()
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

export function isDateAvailable(meta, date) {
  return Boolean(meta?.c_dates?.includes(date))
}

export function getFallbackWorldDate(meta) {
  if (isDateAvailable(meta, DEFAULT_WORLD_DATE)) {
    return DEFAULT_WORLD_DATE
  }

  return meta?.c_dates?.[meta.c_dates.length - 1] ?? DEFAULT_WORLD_DATE
}

export function buildWorldCountryRows(meta, dayItems) {
  const metaByRegion = buildMetaByRegion(meta?.c_regions)
  const items = Array.isArray(dayItems) ? dayItems : []

  return items.map((item) => {
    const regionMeta = metaByRegion[item.c_ref] ?? {}
    const population = regionMeta.c_people ?? 0
    const totalCases = item.totals?.Cases ?? 0
    const totalDeaths = item.totals?.Deaths ?? 0
    const dailyCases = item.daily?.Cases ?? 0
    const dailyDeaths = item.daily?.Deaths ?? 0

    return {
      name: item.c_ref,
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

export function getSortValue(country, metric, sortMode) {
  if (!country) {
    return 0
  }

  return sortMode === 'per-100k'
    ? country.per100kTotals[metric] ?? 0
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
