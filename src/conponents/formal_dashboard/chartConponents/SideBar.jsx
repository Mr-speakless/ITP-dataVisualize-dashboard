import { useEffect, useState } from 'react'
import ascendingIcon from '../../../assets/ascendingIcon.svg?raw'
import descendingIcon from '../../../assets/descendingIcon.svg?raw'
import resetDataIcon from '../../../assets/ResetData.svg?raw'
import searchIcon from '../../../assets/searchIcon.svg?raw'
import sortIcon from '../../../assets/sortIcon.svg?raw'
import {
  formatDashboardNumber,
  getMetricLabel,
  getSortValue,
} from '../worldData.js'
import { getFlagUrlForRegion, getNationalColorForRegion } from '../countryFlags.js'

const iconClassName =
  'shrink-0 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current'

function CountryRow({
  country,
  metric,
  sortMode,
  isSelected,
  onToggle,
}) {
  const value = getSortValue(country, metric, sortMode)
  const flagUrl = getFlagUrlForRegion(country.name)
  const nationalColor = getNationalColorForRegion(country.name)
  const [hasFlagLoadError, setHasFlagLoadError] = useState(false)
  const selectionIndicatorClassName = isSelected ? '' : 'bg-white'
  const selectionIndicatorStyle = isSelected ? { backgroundColor: nationalColor } : undefined

  useEffect(() => {
    setHasFlagLoadError(false)
  }, [flagUrl])

  return (
    <button
      type="button"
      onClick={() => onToggle(country.name)}
      className="grid w-full grid-cols-[20px_30px_minmax(0,1fr)_minmax(96px,auto)] items-center gap-3 rounded-[5px] px-1 py-1 text-left transition-colors duration-150 hover:bg-grey-bg"
      aria-pressed={isSelected}
      data-name="CountryRow"
    >
      <span
        className={`h-[18px] w-[18px] rounded-[5px] border border-medium-grey ${selectionIndicatorClassName}`}
        style={selectionIndicatorStyle}
        aria-hidden="true"
      />
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
      <span className="ty-small truncate text-black">{country.name}</span>
      <span className="ty-small text-right text-black">{formatDashboardNumber(value)}</span>
    </button>
  )
}

const SideBar = ({
  isOpen,
  onClose,
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

  return (
    <aside className="absolute right-0 top-[calc(100%+12px)] z-20 w-full max-w-[380px]">
      <div
        className="flex max-h-[min(70vh,560px)] flex-col gap-3 overflow-hidden rounded-[4px] border border-grey bg-white px-4 py-3 shadow-[0_0_4px_0_rgba(0,0,0,0.25)]"
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
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-medium-grey transition-colors duration-150 hover:bg-grey-bg hover:text-black"
            aria-label="Close side bar"
            data-node-id="75:449"
          >
            <span className="ty-small leading-none">x</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label
            className="flex h-8 min-w-0 flex-1 items-center gap-[10px] rounded-[5px] border-2 border-grey bg-white px-2 py-1 text-medium-grey transition-colors duration-150 focus-within:border-theme focus-within:text-theme"
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border-2 border-grey bg-white text-medium-grey transition-colors duration-150 hover:border-theme hover:text-theme"
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

        <div className="flex h-10 items-start justify-between gap-3" data-node-id="75:453">
          <div
            className="relative flex h-10 min-w-0 flex-1 items-center rounded-[5px] border-2 border-grey bg-white text-dark-grey transition-colors duration-150 focus-within:border-theme"
            data-node-id="75:454"
          >
            <span
              className={`${iconClassName} pointer-events-none ml-3 h-[9px] w-[14px] text-medium-grey`}
              aria-hidden="true"
              data-node-id="75:455"
              dangerouslySetInnerHTML={{ __html: sortIcon }}
            />
            <select
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value)}
              className="ty-small h-full w-full appearance-none bg-transparent pl-2 pr-10 text-dark-grey outline-none"
              aria-label="Sort countries by"
            >
              <option value="total">Sort by Total</option>
              <option value="per-100k">Sort by Per 100k</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ty-small text-dark-grey">
              v
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleSortDirection}
            className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[5px] bg-grey text-dark-grey transition-colors duration-150 hover:bg-medium-grey/30 hover:text-black"
            aria-label={sortDirectionLabel}
            title={sortDirectionLabel}
            data-node-id="75:459"
          >
            <span
              className={`${iconClassName} h-[17px] w-[20px]`}
              aria-hidden="true"
              data-node-id="75:460"
              dangerouslySetInnerHTML={{ __html: sortDirectionIcon }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between" data-node-id="75:466">
          <button
            type="button"
            onClick={onSelectTopTen}
            className="flex items-center gap-2 rounded-[4px] px-1 py-1 text-black transition-colors duration-150 hover:bg-grey-bg"
          >
            <span
              className={`h-[18px] w-[18px] rounded-[5px] border border-medium-grey ${
                isTopTenSelected ? 'bg-theme' : 'bg-white'
              }`}
              aria-hidden="true"
            />
            <span className="ty-small">Select Top 10</span>
          </button>
          <span className="ty-small text-black">
            {getMetricLabel(metric)} {sortLabel}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            {countries.map((country) => (
              <CountryRow
                key={country.name}
                country={country}
                metric={metric}
                sortMode={sortMode}
                isSelected={selectedCountries.includes(country.name)}
                onToggle={onToggleCountry}
              />
            ))}
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
