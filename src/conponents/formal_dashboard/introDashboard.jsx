const IntroDashboard = () => {
  return (
    <section className="flex w-full flex-col items-center gap-6 bg-[var(--color-theme)] px-4 py-8 sm:gap-10 sm:px-6 sm:pt-10 sm:pb-10">
      <div className="w-full max-w-[1300px]">
        <div className="ty-title text-[var(--color-white)] sm:pl-[50px]">
          covid-19 dashboard
        </div>
        <div className="mb-6 mt-3 h-[3px] w-full max-w-[75%] bg-[var(--color-white)] sm:mb-[50px] sm:mt-[18px]" />
      </div>
      <div className="ty-body w-full max-w-[1200px] text-[var(--color-white)]">
        The COVID-19 Impact Dashboard provides a simple, digestible portal
        into the data on cases and deaths worldwide for the COVID-19 pandemic
        beginning in January 2020 when the first deaths were reported in
        China. This dashboard is at the heart of the COVID-19 Impact Project.
        Beginning with country-level statistics in 2020, it now allows for the
        disaggregation of data into geographic granularity, revealing local
        impact and trends.
      </div>
    </section>
  )
}

export default IntroDashboard
