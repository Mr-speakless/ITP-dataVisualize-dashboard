# AGENT.md

## Purpose

This file is for future agents working on this repository.

It has two goals:

1. Help an agent understand the project architecture quickly.
2. Make it explicit that the "database" is a hierarchical static JSON data store, not a traditional backend API.

If you are picking up a new task, read these first:

1. `dataBase_explain.md`
2. `src/conponents/formal_dashboard/worldData.js`
3. `src/conponents/formal_dashboard/middleChartArea.jsx`

## Project Overview

- Project type: React 19 + Vite + Tailwind CSS 4 single-page frontend
- Business goal: redesign and rebuild the COVID-19 dashboard frontend
- Current page entry: `src/App.jsx` renders `Dashboard`
- Current main feature area: `src/conponents/formal_dashboard/middleChartArea.jsx`
- Backend shape: no traditional backend; the frontend fetches static JSON files directly

Important notes:

- The directory is intentionally spelled `src/conponents/`, not `components`. Do not silently rename it during unrelated work.
- The root `README.md` is still the default Vite template and should not be treated as project documentation.

## Quick Start

### Local Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy static site: `npm run deploy`

### Environment Variable

The project depends on this value in `.env`:

- `VITE_C19_C_DATA`

Current value:

- `https://jht1493.net/COVID-19-Impact/Dashboard/a0`

This is the root URL of the static data warehouse. If it is missing, fetch helpers in `worldData.js` will throw immediately.

### Vite Base Path

`vite.config.js` sets:

- `base: '/ITP-dataVisualize-dashboard/'`

Implications:

- assets are resolved as if the site is deployed under a GitHub Pages subpath
- flag assets under `public/flags/` are resolved through `import.meta.env.BASE_URL`

## Directory Structure

### Runtime Path

- `src/main.jsx`
  - React root entry.
- `src/App.jsx`
  - Currently renders only `Dashboard`.
- `src/conponents/formal_dashboard/dashboard.jsx`
  - Page-level composition.
- `src/conponents/formal_dashboard/topNavBar.jsx`
  - Top navigation section.
- `src/conponents/formal_dashboard/introDashboard.jsx`
  - Hero / introduction section.
- `src/conponents/formal_dashboard/middleChartArea.jsx`
  - Core business component. Handles data loading, filtering, caching, chart/map switching, and selection state.
- `src/conponents/formal_dashboard/bottomDescription.jsx`
  - Footer description / credits section.

### Data and Visualization Support

- `src/conponents/formal_dashboard/worldData.js`
  - Most important data-access and data-transformation module.
- `src/conponents/formal_dashboard/countryFlags.js`
  - Mapping layer from region names to ISO codes, flag asset URLs, and national colors.
- `src/conponents/formal_dashboard/chartConponents/`
  - Visualization and filter UI components.

### Static Assets

- `public/flags/`
  - Local SVG flag assets.
- `src/assets/world.svg`
  - World map base SVG.
- `src/assets/mapIncludedCountry.json`
  - Lookup table used to reconcile map names and country codes.

### Historical / Experimental Area

- `src/conponents/dataFetchTest/`
  - Early data-fetching experiments. Not the current production path.

## Page Architecture

The page structure is simple:

1. `TopNavBar`
2. `IntroDashboard`
3. `MiddleChartArea`
4. `BottomDescription`

Only `MiddleChartArea` contains significant business state and data flow.

A practical mental model:

- `Dashboard.jsx` assembles the page
- `MiddleChartArea.jsx` orchestrates behavior
- `worldData.js` is the data boundary
- `CountryTrendChart.jsx` and `WorldProjectionMap.jsx` render the final visualizations

## Core Runtime Architecture

### 1. `MiddleChartArea.jsx` Is the State Center

It currently owns these categories of state:

- View mode
  - `chart`: line chart or projection map
  - `displayMode.metric`: `cases` / `deaths`
  - `displayMode.timeMode`: `to-date` / `on-day`
  - `displayMode.scale`: `per-100k` / `total`
- Time state
  - `selectedDate`
  - `timelineStartDate`
  - `timelineDate`
- Filtering / interaction state
  - `searchQuery`
  - `sortMode`
  - `sortDirection`
  - `selectedCountries`
  - `hoveredCountryName`
- Drill-down state
  - `expandedCountryName`
  - `expandedCountryRows`
  - `expandedCountryRowsDate`
- Cache state
  - `worldSnapshotByDate`
  - `countrySeriesByName`
- Request state
  - `isMetaLoading`
  - `isDayLoading`
  - `isSeriesLoading`
  - `error`
  - `seriesError`

### 2. Main Data Flow

The main flow is:

1. Load `fetchWorldMeta()`
2. Validate that `selectedDate` exists in `meta.c_dates`
3. Load `fetchWorldDaySnapshot(selectedDate)`
4. Transform the result with `buildWorldCountryRows(meta, daySnapshot)`
5. Use the normalized rows for:
   - search
   - sorting
   - default Top 10 selection
   - chart rendering
   - map coloring
6. If the line chart needs a country time series, lazily load `fetchWorldRegionSeries()`
7. If the user drills into a country, load that country's child level under `c_subs/...`

### 3. Component Responsibility Boundaries

#### `ChartViewToggle.jsx`

- switches between line chart and map
- does not own business data

#### `ViewSwitcher.jsx`

- switches:
  - Cases / Deaths
  - To Date / On Day
  - Per 100k / Total

#### `DataFilterBar.jsx` + `SideBar.jsx`

- date input
- country search
- sort mode
- Top 10 quick select
- country selection

Important:

- `MiddleChartArea.jsx` already passes drill-down-related props into `SideBar.jsx`
- `SideBar.jsx` currently does not consume those props
- this means drill-down logic exists at the state layer, but the sidebar UI is not fully wired yet

#### `SelectedCountryChips.jsx`

- shows currently selected country / region chips
- uses abbreviated labels on compact layouts

#### `CountryTrendChart.jsx`

- pure frontend SVG chart
- no third-party chart library
- consumes already normalized `series`
- daily values are derived by differencing cumulative totals, not fetched as a ready-made time series

#### `WorldProjectionMap.jsx`

- uses `world.svg` as the geographic base
- injects dynamic CSS rules to color countries
- uses fixed bucket thresholds, not date-specific quantiles

Important:

- the map is currently a world-country-level view
- drill-down child-region data mainly supports lists and line charts, not the world map geometry

#### `TimeProgressBar.jsx`

- manages the time range and playback axis
- supports drag, play/pause, and start/end date input
- effectively drives `timelineDate`

## Database Structure

### Bottom Line

This project does not have a traditional database connection, ORM, SQL layer, or REST API.

The "database" is:

- a static JSON file warehouse
- organized by geographic level
- split into many JSON files by date and region

The frontend builds URLs and fetches the files directly.

The most important reference for this is:

- `dataBase_explain.md`

### Data Root

The base prefix comes from:

- `VITE_C19_C_DATA`

The current world-level data root is:

- `c_data/world/`

Common request patterns:

- `${VITE_C19_C_DATA}/c_data/world/c_meta.json`
- `${VITE_C19_C_DATA}/c_data/world/c_days/<date>.json`
- `${VITE_C19_C_DATA}/c_data/world/c_series/<region>.json`

### Three Core File Types

### 1. `c_meta.json`

Purpose:

- index file for the current geographic level
- used to initialize UI and validate inputs

Key fields:

- `c_title`: title for the current level
- `c_sub_title`: child-level label such as `Country` or `State`
- `c_dates`: available dates for the current level
- `c_regions`: child region list for the current level

Typical `c_regions[]` fields:

- `c_ref`: display name and primary lookup key
- `c_first`: first known date per metric
- `n_subs`: child count; drill-down is possible when this is greater than 0
- `c_people`: population
- `last_date`: last available date for that region

In the current app, `meta` is mainly used for:

- date validation
- country list initialization
- population enrichment
- drill-down availability

### 2. `c_days/<date>.json`

Purpose:

- one-day snapshot for the current level
- contains all child regions for that date

Typical structure:

- `c_ref`
- `totals.Cases`
- `totals.Deaths`
- `daily.Cases`
- `daily.Deaths`

Current usage:

1. validate with `c_meta.json`
2. fetch `c_days/<date>.json`
3. merge snapshot data with metadata through `buildWorldCountryRows()`

### 3. `c_series/<region>.json`

Purpose:

- full time series for a single region

Typical structure:

- `on`
- `Cases`
- `Deaths`

Current usage:

- lazily loaded after a country is selected for the line chart
- `buildCountryTrendSeriesPoints()` derives daily values from cumulative totals

### Hierarchy

World-level data can be drilled into through:

- `c_data/world/c_subs/<region>/`

Examples:

- `c_data/world/c_subs/United_States/`
- `c_data/world/c_subs/United_States/c_subs/New_York/`

Current drill-down fetch helpers:

- `fetchWorldSubregionMeta(parentRegionName)`
- `fetchWorldSubregionDaySnapshot(parentRegionName, date)`
- `fetchWorldSubregionSeries(parentRegionName, regionName)`

### Path Normalization Rules

Region names are converted to path names through `normalizeWorldRegionPathName()`:

- replace spaces with `_`
- remove commas

Examples:

- `United States` -> `United_States`
- `Korea, South` -> `Korea_South`

If you add new data-access behavior, reuse this existing normalization instead of inventing a second rule set.

### `worldData.js` Is the Current Single Data Boundary

If you need to change data access behavior, change this file first instead of adding fetch logic inside leaf components.

### What It Already Encapsulates

- URL construction
  - `buildWorldBaseUrl()`
- world-level requests
  - `fetchWorldMeta()`
  - `fetchWorldDaySnapshot()`
  - `fetchWorldRegionSeries()`
- subregion requests
  - `fetchWorldSubregionMeta()`
  - `fetchWorldSubregionDaySnapshot()`
  - `fetchWorldSubregionSeries()`
- normalization
  - `buildWorldCountryRows()`
  - `buildCountryTrendSeriesPoints()`
  - `buildTrendDateRange()`
- display helpers
  - `getDisplayValue()`
  - `getSortValue()`
  - `formatDashboardNumber()`

### Internal UI Row Shape Produced by `buildWorldCountryRows()`

This is the real data shape consumed by the UI. A row typically contains:

- `key`
- `name`
- `parentRegionName`
- `isSubregion`
- `hasSubregions`
- `seriesKey`
- `population`
- `totals.cases`
- `totals.deaths`
- `daily.cases`
- `daily.deaths`
- `per100kTotals.cases`
- `per100kTotals.deaths`
- `per100kDaily.cases`
- `per100kDaily.deaths`

Important:

- map, list, chips, and chart components do not directly consume raw JSON
- they consume normalized objects returned by `buildWorldCountryRows()`

### Current Cache Strategy

The project does not use React Query or SWR. Caching is currently local component-state caching.

### Top-Level Snapshot Cache

- `worldSnapshotByDate`

Purpose:

- caches already fetched `c_days/<date>.json` snapshots for map mode timeline switching

### Time-Series Cache

- `countrySeriesByName`

Purpose:

- caches loaded `c_series` results for countries and subregions

Important:

- subregion time series use `seriesKey`
- the format is `parentRegionName::childRegionName`

Do not reduce this to `country.name` only when adding features, or parent/child regions with the same name can collide.

### Subregion Snapshot State

Subregion drill-down is not yet cached as a generalized dictionary. The component only keeps the current expanded region:

- `expandedCountryName`
- `expandedCountryRows`
- `expandedCountryRowsDate`

If future work needs frequent expand/collapse or multi-region drill-down, this area can be abstracted further.

## Gap Between Current Implementation and Project Guidance

`ForAI.txt` contains an important preference:

- prefer React `use` + `Suspense`
- avoid `useEffect + try/catch` when possible

However, the production path does not fully follow that preference yet:

- `MiddleChartArea.jsx` mainly uses `useEffect + AbortController`
- `src/conponents/dataFetchTest/` contains the experimental `use()` / `Suspense` examples

Practical guidance:

- for stable feature work, prefer the existing production pattern
- for a deliberate data-layer refactor, consider introducing a cleaner Suspense resource layer around `worldData`

Do not mix two radically different fetch patterns inside a small unrelated change.

## Current Stability Risks

### 1. `MiddleChartArea.jsx` Is Large

It currently owns:

- requests
- caching
- filtering
- selection
- timeline behavior
- drill-down behavior
- view switching

Any change here should be evaluated for side effects on:

- default Top 10 selection
- map timeline cache
- subregion series keys
- date fallback logic

### 2. Dates Are Not Uniform Across Levels

The project already handles this through `resolveNearestAvailableDate()`.

That means:

- a world-level `selectedDate` may not exist in a country's `c_subs` level
- drill-down must use nearest-available-date fallback

### 3. Map Names and Dataset Names Are Not Perfectly Aligned

The project compensates through:

- `countryFlags.js`
- `mapIncludedCountry.json`
- alias mappings inside `WorldProjectionMap.jsx`

If a new region fails to map correctly, check normalization and code resolution before blaming the SVG.

### 4. `SideBar.jsx` Has Interface Drift

`MiddleChartArea.jsx` already passes:

- `expandedCountryName`
- `expandedCountryRows`
- `expandedCountryRowsDate`
- `isExpandedCountryRowsLoading`
- `expandedCountryRowsError`
- `onToggleCountryExpansion`

But `SideBar.jsx` does not visibly use those fields yet.

That usually means:

- the state layer already anticipates drill-down
- the UI layer has not caught up yet

If future work involves "expand a country and show states/provinces/child regions", start here.

## Recommended Modification Strategy for Future Agents

### When Changing Data Logic

Prefer this order:

1. `worldData.js`
2. `MiddleChartArea.jsx`
3. presentation components

Do not add direct fetching inside `CountryTrendChart.jsx` or `WorldProjectionMap.jsx`.

### When Changing Filtering or Selection Logic

Check these carefully:

- `selectedCountries`
- `filteredCountries`
- `selectedCountryRows`
- `selectedMapCountries`

The chart and the map do not use exactly the same subsets.

### When Changing Drill-Down Logic

Check:

- `expandedCountryName`
- `expandedCountryRows`
- `resolveNearestAvailableDate()`
- `seriesKey`
- `fetchWorldSubregion*()`

### When Changing the Map

Check:

- `WorldProjectionMap.jsx`
- `countryFlags.js`
- `src/assets/mapIncludedCountry.json`
- `src/assets/world.svg`

### When Changing the Styling System

Check:

- `src/index.css`

This file defines theme colors, fonts, text sizes, and typography tokens. Much of the page styling depends on these CSS variables.

## Recommended Task Intake Checklist

If you are a new agent entering the repo, use this order:

1. Decide whether the task changes the data layer, state layer, or only UI.
2. Read `dataBase_explain.md` and confirm whether the target data comes from `c_meta`, `c_days`, or `c_series`.
3. Read `worldData.js` and check whether an existing helper already covers the task.
4. Read `middleChartArea.jsx` and identify which state the task affects.
5. Read leaf components only when necessary.

## One-Sentence Summary

This project is a React dashboard centered on `MiddleChartArea.jsx`, backed by a hierarchical static JSON file store rather than an API, with `worldData.js` acting as the data boundary that should stay authoritative.

