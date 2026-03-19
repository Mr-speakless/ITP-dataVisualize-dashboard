const controlGroups = [
  {
    key: 'metric',
    wrapperNodeId: '80:667',
    options: [
      { label: 'Cases', value: 'cases', activeNodeId: '80:668', inactiveNodeId: '80:670' },
      { label: 'Deaths', value: 'deaths', activeNodeId: '80:670', inactiveNodeId: '80:668' },
    ],
  },
  {
    key: 'timeMode',
    wrapperNodeId: '80:673',
    options: [
      { label: 'To Date', value: 'to-date', activeNodeId: '80:674', inactiveNodeId: '80:676' },
      { label: 'On Day', value: 'on-day', activeNodeId: '80:676', inactiveNodeId: '80:674' },
    ],
  },
  {
    key: 'scale',
    wrapperNodeId: '80:679',
    options: [
      { label: 'Per 100k', value: 'per-100k', activeNodeId: '80:680', inactiveNodeId: '80:682' },
      { label: 'Total', value: 'total', activeNodeId: '80:682', inactiveNodeId: '80:680' },
    ],
  },
]

const containerClassName =
  'flex min-w-0 flex-1 items-center gap-px rounded-[4px] bg-grey-bg p-[3px] md:flex-none md:gap-1 md:p-1'

const itemBaseClassName =
  'min-w-0 flex-1 rounded-[4px] px-1 py-2 transition-colors duration-150 md:flex-none md:px-2'

function ToggleGroup({ group, value, onChange }) {
  const groupWidthClassName =
    group.key === 'scale'
      ? 'flex-[1.2] md:flex-none'
      : 'flex-1 md:flex-none'

  return (
    <div
      className={`${containerClassName} ${groupWidthClassName}`}
      data-node-id={group.wrapperNodeId}
    >
      {group.options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`${itemBaseClassName} ${
              isActive
                ? 'bg-white text-black shadow-[0_0_4px_0_rgba(0,0,0,0.15)]'
                : 'bg-transparent text-cold-grey hover:text-black'
            }`}
            aria-pressed={isActive}
            data-node-id={isActive ? option.activeNodeId : option.inactiveNodeId}
          >
            <span className="ty-small block whitespace-nowrap text-center leading-none md:text-[1.1rem]">
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const ViewSwitcher = ({ value, onChange }) => {
  return (
    <div className="flex w-full flex-nowrap items-center gap-1 md:w-auto md:gap-3">
      {controlGroups.map((group) => (
        <ToggleGroup
          key={group.key}
          group={group}
          value={value[group.key]}
          onChange={(nextValue) =>
            onChange({
              ...value,
              [group.key]: nextValue,
            })
          }
        />
      ))}
    </div>
  )
}

export default ViewSwitcher
