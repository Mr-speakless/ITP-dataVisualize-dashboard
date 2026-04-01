import { useEffect, useState } from 'react'
import ascendingIcon from '../../../assets/ascendingIcon.svg?raw'
import descendingIcon from '../../../assets/descendingIcon.svg?raw'
import expendIcon from '../../../assets/ExpendIcon.svg?raw'
import resetDataIcon from '../../../assets/ResetData.svg?raw'
import searchIcon from '../../../assets/searchIcon.svg?raw'
import sortIcon from '../../../assets/sortIcon.svg?raw'
import toggleIcon from '../../../assets/Toggle.svg?raw'
import {
  formatDashboardNumber,
  getMetricLabel,
  getSortValue,
} from '../worldData.js'
import { getFlagUrlForRegion, getNationalColorForRegion } from '../countryFlags.js'

const iconClassName =
  'shrink-0 text-inherit [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current'

function CountryRow({
  country,
  metric,
  sortMode,
  isSelected,
  onToggle,
  nestLevel = 0,
  isExpanded = false,
  onToggleExpand,
}) {
  const value = getSortValue(country, metric, sortMode)
  const isNested = nestLevel > 0
  const flagUrl = isNested ? null : getFlagUrlForRegion(country.name)
  const nationalColor = getNationalColorForRegion(country.name)
  const [hasFlagLoadError, setHasFlagLoadError] = useState(false)
  const selectionIndicatorClassName = isSelected ? '' : 'bg-white'
  const selectionIndicatorStyle = isSelected ? { backgroundColor: nationalColor } : undefined
  const isExpandable = Boolean(country.hasSubregions) && nestLevel < 2

  useEffect(() => {
    setHasFlagLoadError(false)
  }, [flagUrl])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(country)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle(country)
        }
      }}
      className={`grid w-full ${
        isNested
          ? 'grid-cols-[20px_minmax(0,1fr)_minmax(96px,auto)]'
          : 'grid-cols-[20px_30px_minmax(0,1fr)_minmax(96px,auto)]'
      } items-center gap-2 rounded-[5px] py-1 text-left text-black opacity-100 ${
        nestLevel === 2 ? 'pl-[3.25rem] pr-1' : isNested ? 'pl-7 pr-1' : 'px-1'
      }`}
      aria-pressed={isSelected}
      aria-label={`${isNested ? 'Region' : 'Country'} ${country.name}`}
      data-name="CountryRow"
    >
      <span
        className={`h-[18px] w-[18px] rounded-[5px] border border-medium-grey ${selectionIndicatorClassName}`}
        style={selectionIndicatorStyle}
        aria-hidden="true"
      />
      {!isNested ? (
        <span
          className="flex h-[18px] w-[29px] shrink-0 items-center overflow-hidden rounded-[2px] border border-grey bg-grey"
          aria-hidden="true"
        >
          {flagUrl && !hasFlagLoadError ? (
            <img
              src={flagUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setHasFlagLoadError(true)}
            />
          ) : (
            <span className="block h-[18px] w-[29px] bg-grey" />
          )}
        </span>
      ) : null}
      {isExpandable ? (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand?.(country.name)
            }}
            className="flex items-center gap-2 rounded-[4px] px-1 transition-all duration-150 hover:bg-grey-bg hover:shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
            aria-label={isExpanded ? `Collapse ${country.name}` : `Expand ${country.name}`}
            aria-expanded={isExpanded}
          >
            <span className="ty-small truncate text-black">{country.name}</span>
            <span
              className={`flex h-[10px] w-[5px] items-center justify-center text-medium-grey transition-transform duration-150 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            >
              <span
                className="h-[10px] w-[5px] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: toggleIcon }}
              />
            </span>
          </button>
        </div>
      ) : (
        <div className="min-w-0">
          <span className="ty-small truncate text-black">{country.name}</span>
        </div>
      )}
      <span className="ty-small text-right text-black">{formatDashboardNumber(value)}</span>
    </div>
  )
}

const SideBar = ({
  isOpen,
  onClose,
  mobileLayout,
  selectedDate,
  onDateChange,
  searchQuery,
  onSearchQueryChange,
  sortMode,
  onSortModeChange,
  sortDirection,
  onToggleSortDirection,
  countries,
  selectedCountries,
  onToggleCountry,
  expandedCountryName,
  expandedCountryRows,
  expandedCountryRowsDate,
  isExpandedCountryRowsLoading,
  expandedCountryRowsError,
  expandedSubregionName,
  expandedSubregionRows,
  expandedSubregionRowsDate,
  isExpandedSubregionRowsLoading,
  expandedSubregionRowsError,
  onToggleCountryExpansion,
  onToggleSubregionExpansion,
  onSelectTopTen,
  isTopTenSelected,
  onResetSidebar,
  metric,
}) => {
  if (!isOpen) {
    return null
  }

  const sortDirectionIcon = sortDirection === 'asc' ? ascendingIcon : descendingIcon
  const sortDirectionLabel = sortDirection === 'asc' ? 'Ascending order' : 'Descending order'
  const sortLabel = sortMode === 'per-100k' ? 'Per 100k' : 'Total'
  const sidebarStyle = {
    '--sidebar-mobile-left': `${mobileLayout?.left ?? 0}px`,
    '--sidebar-mobile-width': mobileLayout?.width
      ? `${mobileLayout.width}px`
      : 'calc(100vw - 2rem)',
    zIndex: 3001,
  }

  return (
    <aside
      className="absolute left-[var(--sidebar-mobile-left)] top-[calc(100%+12px)] isolate w-[var(--sidebar-mobile-width)] max-w-[var(--sidebar-mobile-width)] opacity-100 md:left-auto md:right-0 md:w-full md:max-w-[460px]"
      style={sidebarStyle}
    >
      <div
        className="flex max-h-[min(70vh,560px)] flex-col gap-3 overflow-hidden rounded-[4px] border border-grey bg-white px-4 py-3 text-black opacity-100 shadow-[0_0_4px_0_rgba(0,0,0,0.25)]"
        data-name="RegionSelecting Bar"
        data-node-id="75:446"
      >
        <div className="flex items-center justify-between gap-3" data-node-id="75:447">
          <label className="flex min-w-0 items-center gap-2 ty-small text-black" data-node-id="75:448">
            <span className="shrink-0">On Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="min-w-0 rounded-[4px] border border-grey bg-grey-bg px-2 py-1 text-black outline-none transition-colors duration-150 focus:border-theme"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[var(--color-medium-grey)] opacity-100 transition-colors duration-150 hover:bg-grey-bg hover:text-black"
            aria-label="Close side bar"
            data-node-id="75:449"
          >
            <span className="ty-small leading-none">x</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label
            className="flex h-8 min-w-0 flex-1 items-center gap-[10px] rounded-[5px] border-2 border-grey bg-white px-2 py-1 text-[var(--color-medium-grey)] opacity-100 transition-colors duration-150 focus-within:border-theme focus-within:text-theme"
            data-node-id="75:450"
          >
            <span
              className={`${iconClassName} h-4 w-4`}
              aria-hidden="true"
              data-node-id="75:451"
              dangerouslySetInnerHTML={{ __html: searchIcon }}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search for a country"
              className="ty-small w-full bg-transparent text-black outline-none placeholder:text-[#d9d9d9]"
            />
          </label>
          <button
            type="button"
            onClick={onResetSidebar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border-2 border-grey bg-white text-[var(--color-medium-grey)] opacity-100 transition-colors duration-150 hover:border-theme hover:text-theme"
            aria-label="Reset sidebar filters"
            title="Reset sidebar filters"
          >
            <span
              className={`${iconClassName} h-[18px] w-[18px]`}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: resetDataIcon }}
            />
          </button>
        </div>

        <div className="flex items-center gap-2" data-node-id="75:453">
          <div
            className="relative flex h-8 min-w-0 flex-1 items-center rounded-[5px] border-2 border-grey bg-white px-2 py-1 text-[var(--color-dark-grey)] opacity-100 transition-colors duration-150 focus-within:border-theme"
            data-node-id="75:454"
          >
            <span
              className={`${iconClassName} pointer-events-none h-4 w-4 text-[var(--color-medium-grey)] opacity-100`}
              aria-hidden="true"
              data-node-id="75:455"
              dangerouslySetInnerHTML={{ __html: sortIcon }}
            />
            <select
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value)}
              className="ty-small h-full w-full appearance-none bg-transparent pl-2 pr-7 text-dark-grey outline-none"
              aria-label="Sort countries by"
            >
              <option value="total">Sort by Total</option>
              <option value="per-100k">Sort by Per 100k</option>
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-dark-grey)] opacity-100 [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current [&>svg]:fill-none"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: expendIcon }}
            />
          </div>

          <button
            type="button"
            onClick={onToggleSortDirection}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border-2 border-grey bg-white text-[var(--color-medium-grey)] opacity-100 transition-colors duration-150 hover:border-theme hover:text-theme"
            aria-label={sortDirectionLabel}
            title={sortDirectionLabel}
            data-node-id="75:459"
          >
            <span
              className={`${iconClassName} h-[18px] w-[18px]`}
              aria-hidden="true"
              data-node-id="75:460"
              dangerouslySetInnerHTML={{ __html: sortDirectionIcon }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3" data-node-id="75:466">
          <button
            type="button"
            onClick={onSelectTopTen}
            className="flex min-w-0 items-center gap-2 rounded-[4px] px-1 py-1 text-black transition-colors duration-150 hover:bg-grey-bg"
          >
            <span
              className={`h-[18px] w-[18px] rounded-[5px] border border-medium-grey ${
                isTopTenSelected ? 'bg-theme' : 'bg-white'
              }`}
              aria-hidden="true"
            />
            <span className="ty-small whitespace-nowrap">Select Top 10</span>
          </button>
          <span className="ty-small shrink-0 whitespace-nowrap text-black">
            {getMetricLabel(metric)} {sortLabel}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            {countries.map((country) => {
              const isExpanded = expandedCountryName === country.name

              return (
                <div key={country.key ?? country.name} className="flex flex-col gap-1">
                  <CountryRow
                    country={country}
                    metric={metric}
                    sortMode={sortMode}
                    isSelected={selectedCountries.includes(country.name)}
                    onToggle={onToggleCountry}
                    nestLevel={0}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleCountryExpansion}
                  />

                  {isExpanded ? (
                    <div className="flex flex-col gap-1">
                      {isExpandedCountryRowsLoading ? (
                        <p className="ty-small pl-7 text-medium-grey">Loading regions...</p>
                      ) : null}

                      {!isExpandedCountryRowsLoading && expandedCountryRowsError ? (
                        <p className="ty-small pl-7 text-medium-grey">
                          Unable to load regions: {expandedCountryRowsError}
                        </p>
                      ) : null}

                      {!isExpandedCountryRowsLoading &&
                      !expandedCountryRowsError &&
                      expandedCountryRows.length === 0 ? (
                        <p className="ty-small pl-7 text-medium-grey">
                          No region-level data is available for this country.
                        </p>
                      ) : null}

                      {!isExpandedCountryRowsLoading &&
                      !expandedCountryRowsError &&
                      expandedCountryRows.length > 0
                        ? expandedCountryRows.map((region) => (
                            <div
                              key={region.key ?? `${country.name}::${region.name}`}
                              className="flex flex-col gap-1"
                            >
                              <CountryRow
                                country={region}
                                metric={metric}
                                sortMode={sortMode}
                                isSelected={selectedCountries.includes(region.name)}
                                onToggle={onToggleCountry}
                                nestLevel={1}
                                isExpanded={expandedSubregionName === region.name}
                                onToggleExpand={onToggleSubregionExpansion}
                              />

                              {expandedSubregionName === region.name ? (
                                <div className="flex flex-col gap-1">
                                  {isExpandedSubregionRowsLoading ? (
                                    <p className="ty-small pl-[3.25rem] text-medium-grey">
                                      Loading third-level regions...
                                    </p>
                                  ) : null}

                                  {!isExpandedSubregionRowsLoading &&
                                  expandedSubregionRowsError ? (
                                    <p className="ty-small pl-[3.25rem] text-medium-grey">
                                      Unable to load third-level regions: {expandedSubregionRowsError}
                                    </p>
                                  ) : null}

                                  {!isExpandedSubregionRowsLoading &&
                                  !expandedSubregionRowsError &&
                                  expandedSubregionRows.length === 0 ? (
                                    <p className="ty-small pl-[3.25rem] text-medium-grey">
                                      No third-level region data is available.
                                    </p>
                                  ) : null}

                                  {!isExpandedSubregionRowsLoading &&
                                  !expandedSubregionRowsError &&
                                  expandedSubregionRows.length > 0
                                    ? expandedSubregionRows.map((thirdRegion) => (
                                        <CountryRow
                                          key={
                                            thirdRegion.key ??
                                            `${country.name}::${region.name}::${thirdRegion.name}`
                                          }
                                          country={thirdRegion}
                                          metric={metric}
                                          sortMode={sortMode}
                                          isSelected={selectedCountries.includes(
                                            thirdRegion.name
                                          )}
                                          onToggle={onToggleCountry}
                                          nestLevel={2}
                                        />
                                      ))
                                    : null}

                                  {!isExpandedSubregionRowsLoading &&
                                  !expandedSubregionRowsError &&
                                  expandedSubregionRowsDate &&
                                  expandedSubregionRowsDate !== selectedDate ? (
                                    <p className="ty-small pl-[3.25rem] text-medium-grey">
                                      Third-level regions shown on nearest available date:{' '}
                                      {expandedSubregionRowsDate}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ))
                        : null}

                      {!isExpandedCountryRowsLoading &&
                      !expandedCountryRowsError &&
                      expandedCountryRowsDate &&
                      expandedCountryRowsDate !== selectedDate ? (
                        <p className="ty-small pl-7 text-medium-grey">
                          Regions shown on nearest available date: {expandedCountryRowsDate}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
            {countries.length === 0 ? (
              <p className="ty-small text-medium-grey">No countries match the current filters.</p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default SideBar
