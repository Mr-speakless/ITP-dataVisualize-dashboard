import lineChartIcon from '../../../assets/lineChart.svg?raw'
import mapChartIcon from '../../../assets/mapChart.svg?raw'

// Each option maps directly to the boolean chart state used by MiddleChartArea.
const views = [
  { value: true, label: 'Line', icon: lineChartIcon, iconClassName: 'h-4 w-4' },
  { value: false, label: 'Projection Map', icon: mapChartIcon, iconClassName: 'h-5 w-5' },
]

const baseItemClass =
  'flex items-center gap-1 rounded-[36px] border border-transparent px-4 py-2.5 transition-colors duration-150 hover:bg-white/50'

export default function ChartViewToggle({ value = true, onChange }) {
  return (
    <div
      className="inline-flex flex-row items-center gap-2 rounded-[36px] bg-black p-1"
      data-node-id="75:496"
    >
      {views.map((view) => {
        const isActive = view.value === value
        // Active stays solid white; inactive gets the translucent white hover state.
        const itemClassName = `${baseItemClass} ${
          isActive
            ? 'border-black bg-white text-black hover:bg-white'
            : 'bg-transparent text-[#d9d9d9] hover:text-black'
        }`

        return (
          <button
            key={view.label}
            type="button"
            onClick={() => onChange?.(view.value)}
            className={itemClassName}
            aria-pressed={isActive}
            data-node-id={view.value ? '75:497' : '75:500'}
          >
            <span
              aria-hidden="true"
              className={view.iconClassName}
              data-node-id={view.value ? '75:498' : '75:501'}
              dangerouslySetInnerHTML={{ __html: view.icon }}
            />
            <span className="ty-body whitespace-nowrap leading-[1.083]">{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}
