const typographySamples = [
  {
    label: 'Title / Header 1',
    preview: 'TITLE/HEADER 1',
    classes: 'font-display text-display font-bold uppercase',
    spec: 'JetBrains Mono 80 / 100, 700',
  },
  {
    label: 'Header 2',
    preview: 'Header2',
    classes: 'font-display text-h2 font-bold',
    spec: 'JetBrains Mono 28 / 1.083, 700',
  },
  {
    label: 'Body Text',
    preview: 'text',
    classes: 'font-display text-body font-normal',
    spec: 'JetBrains Mono 20 / 20, 400',
  },
  {
    label: 'Top Bar Text',
    preview: 'TopBarText',
    classes: 'font-display text-topbar font-extrabold',
    spec: 'JetBrains Mono 17.3 / 17.3, 800',
  },
  {
    label: 'Small Text',
    preview: 'small_text',
    classes: 'font-display text-small-label font-medium',
    spec: 'JetBrains Mono 16 / 1.083, 500',
  },
];

const colorSamples = [
  { name: 'Theme', hex: '#00779F', utility: 'bg-theme / text-theme' },
  { name: 'Black', hex: '#000000', utility: 'bg-black / text-black' },
  { name: 'dark_grey', hex: '#4E4E4E', utility: 'bg-dark-grey / text-dark-grey' },
  { name: 'medium_grey', hex: '#8D8D8D', utility: 'bg-medium-grey / text-medium-grey' },
  { name: 'cold_grey', hex: '#94A1B0', utility: 'bg-cold-grey / text-cold-grey' },
  { name: 'grey', hex: '#DCDCDC', utility: 'bg-grey / border-grey' },
  { name: 'grey_bg', hex: '#F3F5F7', utility: 'bg-grey-bg' },
  { name: 'accent', hex: '#ECF1F4', utility: 'bg-accent' },
  { name: 'white', hex: '#FFFFFF', utility: 'bg-white' },
];

const tokenGroups = [
  'font-display',
  'text-display',
  'text-h2',
  'text-body',
  'text-topbar',
  'text-small-label',
  'rounded-panel',
  'rounded-block',
  'shadow-card',
];

function TypographyCard({ label, preview, classes, spec }) {
  return (
    <div className="rounded-block border border-grey bg-grey-bg px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className={classes}>{preview}</p>
          <p className="mt-2 font-display text-small-label text-dark-grey">{spec}</p>
        </div>
        <div className="shrink-0 rounded-full border border-theme/20 bg-white px-3 py-1 font-display text-small-label text-theme">
          {label}
        </div>
      </div>
    </div>
  );
}

function ColorCard({ name, hex, utility }) {
  return (
    <div className="flex items-center gap-4 rounded-block border border-grey bg-grey-bg px-4 py-4">
      <div
        className="h-16 w-20 shrink-0 rounded-lg shadow-swatch"
        style={{ backgroundColor: hex }}
      />
      <div className="min-w-0">
        <p className="font-sans text-2xl font-bold tracking-[-0.05em] text-black">{name}</p>
        <p className="mt-1 font-display text-small-label text-dark-grey">{hex}</p>
        <p className="mt-1 font-display text-small-label text-theme">{utility}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPreview({ children }) {
  return (
    <main className="min-h-screen bg-grey-bg text-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-panel border border-grey bg-white px-6 py-8 shadow-card sm:px-8">
          <div className="inline-flex rounded-full border border-theme/20 bg-accent px-4 py-2 font-display text-small-label font-medium uppercase tracking-[0.18em] text-theme">
            Tailwind v4 Preset
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="font-display text-topbar font-extrabold uppercase tracking-[0.18em] text-theme">
                Figma nodes 60:224 and 60:722
              </p>
              <h1 className="mt-4 max-w-4xl font-display text-display font-bold uppercase">
                COVID-19 Dashboard
              </h1>
              <p className="mt-4 max-w-3xl font-display text-body text-dark-grey">
                Base typography, colors, radius, and shadow tokens are now defined in
                Tailwind and ready to be reused by incoming components.
              </p>
            </div>
            <div className="rounded-block border border-grey bg-grey-bg p-5">
              <p className="font-sans text-2xl font-bold tracking-[-0.05em] text-black">
                Available Tokens
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tokenGroups.map((token) => (
                  <span
                    key={token}
                    className="rounded-full border border-grey bg-white px-3 py-1 font-display text-small-label text-dark-grey"
                  >
                    {token}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-panel border border-grey bg-white p-6 shadow-card sm:p-8">
            <div className="border-b border-grey pb-6">
              <p className="font-display text-topbar font-extrabold uppercase tracking-[0.18em] text-theme">
                Typography
              </p>
              <h2 className="mt-3 font-sans text-h2 font-bold tracking-[-0.05em] text-black">
                JetBrains Mono Scale
              </h2>
            </div>
            <div className="mt-6 space-y-4">
              {typographySamples.map((sample) => (
                <TypographyCard key={sample.label} {...sample} />
              ))}
            </div>
          </article>

          <article className="rounded-panel border border-grey bg-white p-6 shadow-card sm:p-8">
            <div className="border-b border-grey pb-6">
              <p className="font-display text-topbar font-extrabold uppercase tracking-[0.18em] text-theme">
                Color System
              </p>
              <h2 className="mt-3 font-sans text-h2 font-bold tracking-[-0.05em] text-black">
                Dashboard Palette
              </h2>
            </div>
            <div className="mt-6 grid gap-4">
              {colorSamples.map((sample) => (
                <ColorCard key={sample.name} {...sample} />
              ))}
            </div>
          </article>
        </section>

        {children ? (
          <section className="rounded-panel border border-grey bg-white p-6 shadow-card sm:p-8">
            <div className="border-b border-grey pb-6">
              <p className="font-display text-topbar font-extrabold uppercase tracking-[0.18em] text-theme">
                Sandbox
              </p>
              <h2 className="mt-3 font-sans text-h2 font-bold tracking-[-0.05em] text-black">
                Existing Data Fetch Prototype
              </h2>
              <p className="mt-3 max-w-3xl font-display text-small-label text-dark-grey">
                The current request form is still mounted below so theme work and data
                work can continue in parallel.
              </p>
            </div>
            <div className="mt-6 rounded-block border border-grey bg-accent p-4 sm:p-6">
              {children}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
