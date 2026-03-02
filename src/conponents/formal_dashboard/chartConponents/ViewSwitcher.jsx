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
  'flex items-center gap-1 rounded-[4px] bg-grey-bg p-1'

const itemBaseClassName =
  'rounded-[4px] px-2 py-2 transition-colors duration-150'

function ToggleGroup({ group, value, onChange }) {
  return (
    <div className={containerClassName} data-node-id={group.wrapperNodeId}>
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
            <span className="ty-body whitespace-nowrap leading-none">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const ViewSwitcher = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
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
