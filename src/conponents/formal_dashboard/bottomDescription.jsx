const contentBlocks = [
    {
        title: 'Code',
        items: ['Html', 'CSS', 'Javascript', 'Bash scripts'],
    },
    {
        title: 'Libraries',
        items: [
            { label: 'React.js', href: 'https://react.dev/' },
            { label: 'Vite', href: 'https://vite.dev/' },
            { label: 'Tailwindcss', href: 'https://tailwindcss.com/' },
            { label: 'Country-flag-icons', href: 'https://github.com/catamphetamine/country-flag-icons' },
            { label: 'Google icon', href: 'https://fonts.google.com/icons' },
            { label: 'World map svg', href: 'https://simplemaps.com/resources/svg-world' },
        ],
    },
    {
        title: 'Tools',
        items: [
            'Github',
            'Visual Studio Code',
            'nodejs',
            { label: 'Create React App', href: 'https://github.com/facebook/create-react-app' }
        ],
    },
    {
        title: 'Worldwide Data',
        items: [
            {
                label:
                    '2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE',
                href: 'https://github.com/CSSEGISandData/COVID-19',
            },
        ],
    },
    {
        title: 'New York City Data',
        items: [
            {
                label: 'NYC Coronavirus Disease 2019 (COVID-19) Data',
                href: 'https://github.com/nychealth/coronavirus-data/blob/master/totals/data-by-modzcta.csv',
            },
        ],
    },
    {
        title: 'Developed By',
        items: ['John Henry Thompson', 'Shindy Johnson', 'Shouyue(Luas) Wu'],
    }
];

function DescriptionItem({ item, hasTrailingComma }) {
    if (typeof item === 'string') {
        return <p>{item}{hasTrailingComma ? ',' : ''}</p>;
    }

    return (
        <p>
            <a
                className="underline decoration-transparent transition-colors duration-150 hover:decoration-white/70"
                href={item.href}
                target="_blank"
                rel="noreferrer"
            >
                {item.label}
            </a>
            {hasTrailingComma ? ',' : ''}
        </p>
    );
}

const BottomDescription = () => {
    return (
        <section className="bg-theme px-6 py-10 text-white">
            <div
                className="mx-auto flex w-full max-w-[1200px] flex-col gap-9"
                data-node-id="67:438"
            >
                <div className="space-y-5">
                    <h2
                        className="ty-h2 text-white"
                        data-node-id="67:439"
                    >
                        Dashboard Tools and Technologies&gt;&gt;
                    </h2>
                    <p
                        className="ty-body max-w-5xl text-white"
                        data-node-id="67:440"
                    >
                        Coding languages, libraries, and tools used to build the COVID-19
                        Dashboard
                    </p>
                </div>

                <div className="ty-body flex flex-col gap-9 text-white">
                    {contentBlocks.map((block, index) => (
                        <div
                            key={block.title}
                            className={index >= 3 ? 'lg:col-span-2' : ''}
                            data-node-id={`67:${441 + index}`}
                        >
                            <p className="font-bold">{block.title}</p>
                            <div className="mt-0 space-y-0">
                                {block.items.map((item, itemIndex) => (
                                    <DescriptionItem
                                        key={typeof item === 'string' ? item : item.label}
                                        item={item}
                                        hasTrailingComma={itemIndex < block.items.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default BottomDescription;
