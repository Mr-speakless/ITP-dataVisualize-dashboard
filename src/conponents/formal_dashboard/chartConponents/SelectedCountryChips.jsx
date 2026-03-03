import { getNationalColorForRegion } from '../countryFlags.js'

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

function SelectedCountryChip({ countryName, onRemove }) {
  const nationalColor = getNationalColorForRegion(countryName)

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
      className="group inline-flex h-11 items-center rounded-full border px-3 transition-colors duration-150 hover:bg-[var(--chip-hover-bg)] focus-within:bg-[var(--chip-hover-bg)]"
      style={chipStyle}
    >
      <span
        className="mr-3 h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: nationalColor }}
        aria-hidden="true"
      />
      <span className="ty-small whitespace-nowrap text-black">{countryName}</span>
      <button
        type="button"
        onClick={() => onRemove(countryName)}
        className="ml-0 flex h-6 w-0 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent text-[var(--chip-close-color)] opacity-0 transition-all duration-150 hover:bg-[var(--chip-close-hover-bg)] hover:text-[var(--chip-close-hover-color)] group-hover:ml-2 group-hover:w-6 group-hover:opacity-100 group-focus-within:ml-2 group-focus-within:w-6 group-focus-within:opacity-100 active:bg-[var(--chip-close-active-bg)] active:text-white"
        aria-label={`Remove ${countryName}`}
      >
        <span className="text-base leading-none">x</span>
      </button>
    </div>
  )
}

const SelectedCountryChips = ({ countries, onRemove }) => {
  if (countries.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3" aria-label="Selected countries">
      {countries.map((country) => (
        <SelectedCountryChip
          key={country.name}
          countryName={country.name}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

export default SelectedCountryChips
