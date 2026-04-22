# COVID-19 Dashboard Architecture

## 1. Project Overview

This project is a React + Vite dashboard for global COVID-19 trend exploration, with:

- World-level timeline snapshots (`country/day` values)
- Country-to-subregion drill-down (up to third-level regions where data exists)
- Two coordinated views:
  - Trend line chart view
  - Projection map view
- Interactive filters (date, search, sorting, country selection, top-10 quick select)

The production build is static and intended for GitHub Pages deployment.

## 2. Runtime & Build Stack

- Runtime: React 19
- Bundler: Vite 8
- Styling: Tailwind CSS v4 + design tokens in `src/index.css`
- Hosting: `gh-pages` deploy from `dist/`

Key config:

- `vite.config.js`
  - `base: '/ITP-dataVisualize-dashboard/'` for GitHub Pages subpath hosting
  - `@vitejs/plugin-react`
  - `@tailwindcss/vite`

## 3. Source Layout

```text
src/
  main.jsx                         # React bootstrap
  App.jsx                          # App root (dashboard entry)
  index.css                        # Global tokens + typography + base styles
  conponents/                      # NOTE: historical typo kept for compatibility
    formal_dashboard/
      dashboard.jsx                # Top-level page composition
      topNavBar.jsx
      introDashboard.jsx
      middleChartArea.jsx          # Main state orchestration + data loading
      bottomDescription.jsx
      worldData.js                 # Data access + data-shaping utilities
      countryFlags.js              # Country code/flag/color mapping
      hooks/
        useMediaQuery.js           # Shared media query hooks
      chartConponents/
        ViewSwitcher.jsx
        ChartViewToggle.jsx
        DataFilterBar.jsx
        SideBar.jsx
        SelectedCountryChips.jsx
        TimeProgressBar.jsx
        CountryTrendChart.jsx
        WorldProjectionMap.jsx
```

## 4. Data Model & API Contract

The dashboard reads static JSON via `VITE_C19_C_DATA` + `c_data/world` path conventions.

### 4.1 Dataset shape

- `c_meta.json`
  - `c_dates`: available date list
  - `c_regions`: region metadata (population, children count, etc.)
- `c_days/<date>.json`
  - one-day snapshot per region
- `c_series/<region>.json`
  - time series per region
- nested region data:
  - `c_subs/<region>/.../c_meta.json`
  - `c_subs/<region>/.../c_days/<date>.json`
  - `c_subs/<region>/.../c_series/<region>.json`

### 4.2 Normalized row shape used in UI

`worldData.buildWorldCountryRows(...)` normalizes each region row into:

- identity: `name`, `seriesKey`, `seriesPathHierarchy`, `regionLevel`
- structure: `hasSubregions`, `parentRegionName`
- metrics:
  - `totals.cases/deaths`
  - `daily.cases/deaths`
  - `per100kTotals.cases/deaths`
  - `per100kDaily.cases/deaths`

This normalized structure is the shared contract for list, chart, and map.

## 5. State Architecture

## 5.1 Orchestration boundary

`middleChartArea.jsx` is the container/orchestrator. Child components are mostly presentational + interaction emitters.

Main responsibilities:

- Load metadata and snapshots
- Track selected time window and timeline playback state
- Manage region drill-down and selection state
- Manage trend-series cache and snapshot cache
- Derive sorted/filtered/selected views for chart and map

## 5.2 State categories

- Source data state:
  - `meta`, `countries`, nested region rows
- Async status state:
  - loading flags + error messages for each fetch phase
- Filter/control state:
  - `displayMode` (`metric/timeMode/scale`)
  - `sortMode`, `sortDirection`, `searchQuery`
  - `selectedDate`, `timelineStartDate`, `timelineDate`
- Selection/drill state:
  - `selectedCountries`
  - `expandedCountryName`, `expandedSubregionName`
- Caches:
  - `worldSnapshotByDate`
  - `countrySeriesByName`
  - `pendingMapDatesRef`

## 5.3 Data flow (high level)

1. Load `meta` once on mount.
2. Load world day snapshot for `selectedDate`.
3. In map mode, prefetch timeline snapshots for `timelineDate` when needed.
4. When a country/subregion is expanded, load nested meta + nearest-date snapshot.
5. When selected rows require trend data, load and cache missing series.
6. Derived data (`useMemo`) drives chart/map rendering.

## 6. Interaction & Visualization Pipeline

## 6.1 Sorting semantics

Sorting now follows current `displayMode.timeMode`:

- `to-date`: sorts by total/per100k totals
- `on-day`: sorts by daily/per100k daily

This keeps sidebar values and ordering consistent with the selected temporal mode.

## 6.2 Map + chart coordination

- Chart hover can drive map highlight through `hoveredCountryName`.
- Map pointer hover drives internal hover + tooltip.
- Selection updates propagate to both chart series and map coloring.

## 6.3 Responsive strategy

A shared hook (`hooks/useMediaQuery.js`) provides `useCompactLayout()` and replaces duplicated `matchMedia` logic across chart/map/chips.

## 7. Key Reliability Improvements Applied

The following issues were addressed in this revision:

1. Dead app entry imports removed (`App.jsx`) to keep root clean.
2. Sorting bug fixed for `on-day` mode (`worldData.js` + `middleChartArea.jsx` + `SideBar.jsx`).
3. Map prefetch effect hardened with cancellation guards and deterministic cleanup (`middleChartArea.jsx`).
4. Repeated media-query side effects consolidated into a shared hook.
5. React hook rule violations fixed:
   - Removed render-time ref reads in tooltips (chart/map)
   - Replaced effect-driven hover sync in map with derived state
   - Removed synchronous effect resets in chips/sidebar patterns
6. Duplicate keys in country overrides removed (`countryFlags.js`).
7. ESLint now passes cleanly under WSL (`npm run lint`).

## 8. Performance Notes

Current build still produces a large JS bundle (~6.2MB pre-gzip, ~1.31MB gzip). Main causes:

- Large inline SVG assets
- Single-bundle dashboard rendering path

Recommended next optimization steps:

1. Lazy-load heavy map assets/components (`WorldProjectionMap` and regional maps).
2. Split chart/map view code via dynamic imports.
3. Consider moving large static map SVGs to CDN/static fetch paths when practical.

## 9. Known Constraints

- Directory names `conponents` and `chartConponents` are misspelled but intentionally preserved to avoid broad path churn.
- Base path is hardcoded for GitHub Pages deployment; changing repo/site path requires updating `vite.config.js`.
- Data path depends on `VITE_C19_C_DATA`; missing value will break data loading at runtime.

## 10. Extension Guide

For new features, follow these boundaries:

1. Put fetch/shape logic in `worldData.js` (or split into data modules if expanded).
2. Keep orchestration in `middleChartArea.jsx` (or extract custom hooks for major flows).
3. Keep chart/map components focused on rendering + event emission.
4. Reuse shared hooks from `formal_dashboard/hooks`.
5. Maintain row-shape compatibility (`totals/daily/per100k`) so downstream components remain stable.
