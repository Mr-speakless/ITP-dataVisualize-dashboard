const contentBlocks = [
    {
        title: 'Code',
        items: ['Html', 'CSS', 'Javascript', 'Bash scripts'],
    },
    {
        title: 'Libraries',
        items: [
            { label: 'React.js', href: 'https://reactjs.org/' },
            { label: 'React Semantic UI', href: 'https://react.semantic-ui.com/' },
            { label: 'Victory', href: 'https://formidable.com/open-source/victory/' },
        ],
    },
    {
        title: 'Tools',
        items: [
            'Github',
            'Visual Studio Code',
            'nodejs',
            { label: 'Create React App', href: 'https://github.com/facebook/create-react-app' },
            { label: 'Docusaurus 2', href: 'https://v2.docusaurus.io/' },
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
];

function DescriptionItem({ item }) {
    if (typeof item === 'string') {
        return <p>{item}</p>;
    }

    return (
        <a
            className="underline decoration-transparent transition-colors duration-150 hover:decoration-white/70"
            href={item.href}
            target="_blank"
            rel="noreferrer"
        >
            {item.label}
        </a>
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
                        className="font-display text-h2 font-bold text-white"
                        data-node-id="67:439"
                    >
                        Dashboard Tools and Technologies&gt;&gt;
                    </h2>
                    <p
                        className="max-w-5xl font-display text-body font-normal text-white"
                        data-node-id="67:440"
                    >
                        Coding languages, libraries, and tools used to build the COVID-19
                        Dashboard
                    </p>
                </div>

                <div className="flex flex-col gap-9 font-display text-body font-normal text-white">
                    {contentBlocks.map((block, index) => (
                        <div
                            key={block.title}
                            className={index >= 3 ? 'lg:col-span-2' : ''}
                            data-node-id={`67:${441 + index}`}
                        >
                            <p>{block.title}</p>
                            <div className="mt-0 space-y-0">
                                {block.items.map((item) => (
                                    <DescriptionItem
                                        key={typeof item === 'string' ? item : item.label}
                                        item={item}
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
