import { useMemo, useState } from 'react'
import { getCountryCodeForRegion, getNationalColorForRegion } from '../countryFlags.js'
import { useCompactLayout } from '../hooks/useMediaQuery.js'

function hexToRgb(hexColor) {
  const normalizedHex = hexColor.replace('#', '')

  if (normalizedHex.length !== 6) {
    return { red: 0, green: 0, blue: 0 }
  }

  return {
    red: Number.parseInt(normalizedHex.slice(0, 2), 16),
    green: Number.parseInt(normalizedHex.slice(2, 4), 16),
    blue: Number.parseInt(normalizedHex.slice(4, 6), 16),
  }
}

function withOpacity(hexColor, opacity) {
  const { red, green, blue } = hexToRgb(hexColor)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function buildCountryAbbreviation(countryName) {
  const countryCode = getCountryCodeForRegion(countryName)

  if (countryCode === 'GB') {
    return 'UK'
  }

  if (countryCode) {
    return countryCode
  }

  const words = String(countryName ?? '')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  return String(countryName ?? '').slice(0, 3).toUpperCase()
}

function SelectedCountryChip({
  countryName,
  isCompactLayout,
  isExpanded,
  onExpand,
  onRemove,
}) {
  const nationalColor = getNationalColorForRegion(countryName)
  const compactLabel = buildCountryAbbreviation(countryName)

  const chipStyle = {
    borderColor: withOpacity(nationalColor, 0.9),
    backgroundColor: withOpacity(nationalColor, 0.08),
    '--chip-hover-bg': withOpacity(nationalColor, 0.18),
    '--chip-close-color': withOpacity(nationalColor, 0.55),
    '--chip-close-hover-bg': withOpacity(nationalColor, 0.18),
    '--chip-close-hover-color': withOpacity(nationalColor, 0.9),
    '--chip-close-active-bg': nationalColor,
  }

  return (
    <div
      className={`group inline-flex max-w-full items-center rounded-full border px-2 py-1 transition-colors duration-150 hover:bg-[var(--chip-hover-bg)] focus-within:bg-[var(--chip-hover-bg)] ${
        isCompactLayout && isExpanded ? 'gap-1' : ''
      }`}
      style={chipStyle}
    >
      <button
        type="button"
        onClick={() => {
          if (isCompactLayout) {
            onExpand(countryName)
          }
        }}
        className="flex min-w-0 flex-row items-center gap-1 bg-transparent p-0 text-left"
        aria-expanded={isCompactLayout ? isExpanded : undefined}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: nationalColor }}
          aria-hidden="true"
        />
        <span className="ty-small whitespace-nowrap text-black">
          {isCompactLayout && !isExpanded ? compactLabel : countryName}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRemove(countryName)}
        className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-150 active:bg-[var(--chip-close-active-bg)] active:text-white ${
          isCompactLayout
            ? isExpanded
              ? 'ml-1 h-4 w-4 bg-transparent text-[var(--chip-close-color)] hover:bg-[var(--chip-close-hover-bg)] hover:text-[var(--chip-close-hover-color)]'
              : 'h-0 w-0 overflow-hidden opacity-0'
            : 'ml-0 h-4 w-0 overflow-hidden bg-transparent text-[var(--chip-close-color)] opacity-0 hover:bg-[var(--chip-close-hover-bg)] hover:text-[var(--chip-close-hover-color)] group-hover:ml-1 group-hover:w-4 group-hover:opacity-100 group-focus-within:ml-1 group-focus-within:w-4 group-focus-within:opacity-100'
        }`}
        aria-label={`Remove ${countryName}`}
      >
        <span className="text-base leading-none">x</span>
      </button>
    </div>
  )
}

const SelectedCountryChips = ({ countries, onRemove }) => {
  const isCompactLayout = useCompactLayout()
  const [expandedCountryName, setExpandedCountryName] = useState('')
  const normalizedExpandedCountryName = useMemo(() => {
    if (!isCompactLayout) {
      return ''
    }

    const isExpandedCountryVisible = countries.some(
      (country) => country.name === expandedCountryName
    )

    return isExpandedCountryVisible ? expandedCountryName : ''
  }, [countries, expandedCountryName, isCompactLayout])

  if (countries.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3" aria-label="Selected countries">
      {countries.map((country) => (
        <SelectedCountryChip
          key={country.name}
          countryName={country.name}
          isCompactLayout={isCompactLayout}
          isExpanded={normalizedExpandedCountryName === country.name}
          onExpand={(countryValue) =>
            setExpandedCountryName((currentCountryName) =>
              currentCountryName === countryValue ? '' : countryValue
            )
          }
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

export default SelectedCountryChips
