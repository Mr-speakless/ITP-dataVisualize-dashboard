const IntroDashboard = () => {
  return (
    <div className="flex w-full flex-col items-center bg-[var(--color-theme)] gap-10 pt-10 pb-10">
      <div className="w-full max-w-[1300px] ">
        <div className="ty-title text-[var(--color-white)]">
          covid-19 dashboard
        </div>
        <div className="mt-[18px] h-[3px] w-[75%] bg-[var(--color-white)]" />
      </div>
      <div className="ty-body w-full max-w-[1200px]  text-[var(--color-white)]">
        The COVID-19 Impact Dashboard provides a simple, digestible portal
        into the data on cases and deaths worldwide for the COVID-19 pandemic
        beginning in January 2020 when the first deaths were reported in
        China. This dashboard is at the heart of the COVID-19 Impact Project.
        Beginning with country-level statistics in 2020, it now allows for the
        disaggregation of data into geographic granularity, revealing local
        impact and trends.
      </div>
    </div>
  )
}

export default IntroDashboard
