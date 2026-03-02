import { useState } from 'react'
import ChartViewToggle from './chartConponents/ChartViewToggle.jsx'
import DataFilterBar from './chartConponents/DataFilterBar.jsx'
import ViewSwitcher from './chartConponents/ViewSwitcher.jsx'

const initialDisplayMode = {
  metric: 'cases',
  timeMode: 'to-date',
  scale: 'per-100k',
}

const MiddleChartArea = () => {
  const [chart, setChart] = useState(true)
  const [displayMode, setDisplayMode] = useState(initialDisplayMode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  //here I need a new js function fetchData_c_meta(), (not the fetchData_c_meta in dataFetchTest folder) and return the basic information of the data scope.

  return (
    <section className="w-full py-8 sm:py-10 bg-white">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-6 px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="ty-h2 max-w-4xl text-black">
            6,881,804 Worldwide Deaths to date 2023-03-09 - Uncover the Trends
          </h2>
        </div>
        <ChartViewToggle value={chart} onChange={setChart} />

        

        <div className="flex w-full max-w-[1200px] flex-col gap-7 rounded-xl p-4 shadow-[0_0_8px_0_rgba(0,0,0,0.15)]">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ViewSwitcher value={displayMode} onChange={setDisplayMode} />
            <DataFilterBar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={setIsSidebarOpen}
            />
          </div>
          {chart ? <p>linechart</p> : <p>map chart</p>}
          <p className="ty-small text-dark-grey">
            Debug: metric={displayMode.metric} | timeMode={displayMode.timeMode} |
            scale={displayMode.scale} | sidebarOpen={String(isSidebarOpen)}
          </p>
        </div>
      </div>
    </section>
  )
}

export default MiddleChartArea
