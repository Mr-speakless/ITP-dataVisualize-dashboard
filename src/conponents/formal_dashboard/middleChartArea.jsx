import { useState } from 'react'
import ChartViewToggle from './chartConponents/ChartViewToggle.jsx'

const MiddleChartArea = () => {
  const [chart, setChart] = useState(true)

  return (
    <section className="w-full py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1240px] items-start flex-col gap-6 px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="ty-h2 max-w-4xl text-black">
            6,881,804 Worldwide Deaths to date 2023-03-09 - Uncover the Trends
          </h2>
        </div>
        <ChartViewToggle value={chart} onChange={setChart} />

        {chart ? <p>linechart</p> : <p>map chart</p>}
      </div>
    </section>
  )
}

export default MiddleChartArea
