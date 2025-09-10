'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

type Item = { label: string; why: string };

type GroupKey = 'interior' | 'attic' | 'exterior';

const CHECKLIST: Record<GroupKey, { title: string; blurb: string; items: Item[] }> = {
    interior: {
        title: 'Interior Inspection',
        blurb:
            'We look for the earliest signs of moisture where it shows up first—ceilings, walls, and around penetrations.',
        items: [
            {
                label: 'Check for signs of water and moisture',
                why: 'Discoloration or damp spots inside often appear before exterior leaks are obvious. Catching it here can save drywall and insulation.',
            },
            {
                label: 'Stains in the ceiling, wall, and windows',
                why: 'Brown rings, bubbling paint, or warping trim are classic leak indicators and help us trace the source from inside to out.',
            },
        ],
    },
    attic: {
        title: 'Attic Inspection',
        blurb:
            'Heat, humidity, and hidden leaks start in the attic. Proper ventilation and dry decking add years to a roof.’s life.',
        items: [
            {
                label: 'Visual inspection for water damage',
                why: 'We look for darkened sheathing, moldy insulation, and rusted fasteners—early signs your decking has been wet.',
            },
            {
                label: 'Inspection of attic ventilation',
                why: 'Balanced intake and exhaust prevents heat buildup and moisture that can shorten shingle and underlayment lifespan.',
            },
            {
                label:
                    'Notify homeowner of any wood rot, insect activity, or fungus‑like growth we spot while inspecting',
                why: 'Structural or biological issues in the attic can spread and get expensive. Early awareness lets you plan repairs.',
            },
        ],
    },
    exterior: {
        title: 'Exterior Inspection',
        blurb:
            'This is the most thorough portion—everything from granule wear to flashing details and water pathways is reviewed.',
        items: [
            { label: 'Visible wood rot or insect damage', why: 'Compromised fascia/soffit invites leaks and pests and can undermine flashing.' },
            { label: 'Checkup of gutters and waterways for debris', why: 'Clogged gutters force water under shingles and against fascia, causing leaks and rot.' },
            { label: 'Damage caused by other trades', why: 'Dish mounts, cable fasteners, and old repairs can puncture the waterproofing layer.' },
            { label: 'Flashing around chimneys, vents, caps, etc.', why: 'Most leaks happen at transitions. Tight, sealed flashing is critical.' },
            { label: 'Nails and installation materials', why: 'Backed‑out or over‑driven fasteners create pathways for water.' },
            { label: 'Underlayment condition and material', why: 'The last defense against wind‑driven rain; damage here leads straight to the deck.' },
            { label: 'Gutter and downspout condition', why: 'We confirm water exits the roof system properly and away from the home.' },
            { label: 'Amount of granular wear and tear', why: 'Excess loss ages shingles quickly and exposes asphalt to UV damage.' },
            { label: 'Exposed fasteners and other roofing problems', why: 'Unsealed fasteners and open seams are quick wins to prevent leaks.' },
            { label: 'Moss, algae, and fungus‑like growth', why: 'Biological growth traps moisture and shortens roof life if left untreated.' },
            { label: 'Damaged caulking', why: 'Dried or cracked sealant fails under sun and rain. We note and recommend touch‑ups.' },
        ],
    },
};

const PILLS: { key: GroupKey; label: string }[] = [
    { key: 'interior', label: 'Interior' },
    { key: 'attic', label: 'Attic' },
    { key: 'exterior', label: 'Exterior' },
];

export default function TipTopRoofCheckup({ className }: { className?: string }) {
    const [tab, setTab] = useState<GroupKey>('interior');
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [showSticky, setShowSticky] = useState(false);

    const current = useMemo(() => CHECKLIST[tab], [tab]);

    // JSON-LD (client-side): HowTo + page-specific Service for Tip Top Roof Check‑up
    const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://sonshineroofing.com');
    const pageUrl = `${base}/roof-inspection`;
    const providerId = `${base}/#roofingcontractor`;

    const howToSections = useMemo(() => {
        return (Object.values(CHECKLIST) as { title: string; blurb: string; items: Item[] }[]).map((group) => ({
            '@type': 'HowToSection',
            name: group.title,
            itemListElement: group.items.map((it) => ({
                '@type': 'HowToStep',
                name: it.label,
                text: it.why,
            })),
        }));
    }, []);

    const howToLd = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Tip Top Roof Check‑up',
        description: 'What we inspect during a roof check‑up to catch issues early and extend roof life.',
        step: howToSections,
        url: pageUrl,
    }), [howToSections, pageUrl]);

    const serviceLd = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${base}/#roof-checkup`,
        name: 'Tip Top Roof Check‑up',
        serviceType: 'Roof Inspection',
        description: 'An in‑depth multi‑point inspection covering interior, attic, and exterior roof systems.',
        url: pageUrl,
        provider: { '@id': providerId },
        areaServed: [
            { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
            { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
            { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
        ],
    }), [base, pageUrl, providerId]);

    useEffect(() => {
        const el = rootRef.current;
        if (!el || typeof window === 'undefined') return;
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                setShowSticky(e.isIntersecting);
            },
            { rootMargin: '0px 0px -60%' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const toggle = (id: string) =>
        setOpenMap((m) => ({ ...m, [id]: !m[id] }));

    return (
        <div className={clsx('scroll-mt-24', className)}>
            <header className="text-center">
                <h2 id="tip-top-roof-checkup" className="text-3xl font-semibold">Tip Top Roof Check‑up</h2>
                <p className="mt-3 text-slate-600">
                    Our 18‑point inspection helps catch small issues before they become big problems.
                    Choose a category below to see what we check and why it matters.
                </p>
                <div className="mx-auto my-6 h-[3px] w-40 bg-gradient-to-r from-[#0045d7] to-[#00e3fe] rounded-full" />
            </header>

            {/* JSON-LD: HowTo + Service for Tip Top Roof Check‑up */}
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
            />
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
            />

            <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-slate-400 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-700">
                    You’ll get a written summary of findings, photos where helpful, and a clear plan to
                    extend the life of your roof—or a straight‑shooting estimate if replacement makes more sense.
                </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {PILLS.map(({ key, label }) => {
                    const count = CHECKLIST[key].items.length;
                    const active = tab === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-controls={`panel-${key}`}
                            id={`tab-${key}`}
                            onClick={() => setTab(key)}
                            className={clsx(
                                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition',
                                active
                                    ? 'bg-[var(--brand-blue)] text-white border-transparent'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            )}
                            data-active={active}
                        >
                            <span>{label}</span>
                            <span
                                className={clsx(
                                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs',
                                    active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
                                )}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div ref={rootRef} className="mx-auto mt-6 max-w-4xl">
                {PILLS.map(({ key }) => (
                    <div
                        key={key}
                        role="tabpanel"
                        id={`panel-${key}`}
                        aria-labelledby={`tab-${key}`}
                        hidden={tab !== key}
                        className="rounded-2xl border border-slate-400 bg-white p-4 shadow-sm"
                    >
                        <h3 className="text-lg font-semibold text-slate-900">{CHECKLIST[key].title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{CHECKLIST[key].blurb}</p>

                        <ul className="mt-4 space-y-3 list-none p-0">
                            {CHECKLIST[key].items.map((it, idx) => {
                                const id = `${key}-${idx}`;
                                const open = Boolean(openMap[id]);
                                return (
                                    <li key={id} className="rounded-lg border border-slate-300 overflow-hidden transition-colors hover:bg-slate-50">
                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            onClick={() => toggle(id)}
                                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                                        >
                                            <span className="font-medium text-slate-900">• {it.label}</span>
                                            <span className={clsx('shrink-0 transition', open ? 'rotate-180' : '')}>▾</span>
                                        </button>
                                        {open && (
                                            <div className="px-4 pb-4 text-sm text-slate-700">
                                                <strong className="text-slate-900">Why we check this:</strong> {it.why}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
