'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Accordion } from '@/components/ui/Accordion';
import { JsonLd } from '@/lib/seo/json-ld';
import { howToSchema, serviceSchema } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/seo/site';
import { InfoIcon, SquareMousePointer } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';

type Item = { label: string; why: string };

export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/28E28r98Ja2ncbS8Y89bO06"

type GroupKey = 'interior' | 'attic' | 'exterior' | 'safety';

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
    safety: {
        title: 'Other Safety Concerns',
        blurb:
            'We note non-roof issues that could affect safety or the home, so you can address them early.',
        items: [
            {
                label: 'Noticeable structural and/or environmental concerns',
                why: 'We flag visible issues like sagging framing, storm damage, or unsafe access conditions so you can address them quickly.',
            },
            {
                label: 'Noticeable evidence of any non-roof related concerns',
                why: 'If we see problems outside the roof scope, we document them so you can route them to the right trade.',
            },
        ],
    },
};

const PILLS: { key: GroupKey; label: string }[] = [
    { key: 'interior', label: 'Interior' },
    { key: 'attic', label: 'Attic' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'safety', label: 'Safety' },
];

type TipTopRoofCheckupProps = {
    className?: string;
    origin?: string;
};

export default function TipTopRoofCheckup({ className, origin }: TipTopRoofCheckupProps) {
    const [tab, setTab] = useState<GroupKey>('interior');

    const resolvedOrigin = origin ?? SITE_ORIGIN;

    const sections = useMemo(
        () =>
            (Object.values(CHECKLIST) as { title: string; blurb: string; items: Item[] }[]).map((group) => ({
                name: group.title,
                steps: group.items.map((it) => ({
                    name: it.label,
                    text: it.why,
                })),
            })),
        [],
    );

    const howToLd = useMemo(
        () =>
            howToSchema({
                name: 'Tip Top Roof Check‑up',
                description: 'What we inspect during a roof check‑up to catch issues early and extend roof life.',
                sections,
                url: '/roof-inspection',
                origin: resolvedOrigin,
            }),
        [resolvedOrigin, sections],
    );

    const serviceLd = useMemo(
        () =>
            serviceSchema({
                name: 'Tip Top Roof Check‑up',
                description: 'An in‑depth multi‑point inspection covering interior, attic, and exterior roof systems.',
                url: '/roof-inspection',
                origin: resolvedOrigin,
                provider: `${resolvedOrigin}/#roofingcontractor`,
                areaServed: [
                    'Sarasota County, FL',
                    'Manatee County, FL',
                    'Charlotte County, FL',
                ],
                serviceType: 'Roof Inspection',
                id: `${resolvedOrigin}/#roof-checkup`,
            }),
        [resolvedOrigin],
    );

    return (
        <div className={clsx(className)}>
            <header id="tip-top-roof-checkup">
                <h2 className="mt-4 text-3xl md:text-4xl text-slate-700 font-semibold">What is a <span className="text-[--brand-blue]">Tip Top Roof Check‑up</span>?</h2>
                <p className="text-slate-600">
                    The <strong>Tip Top Roof Check-up</strong> is our 18‑point roof inspection that helps catch small issues before they become big problems.
                </p>
            </header>
            <div id="how-it-works" className="my-6 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-4 shadow-sm">
                <h3 className="mt-4 text-xl md:text-2xl">
                    <InfoIcon className="inline h-5 md:h-6 w-5 md:w-6 mr-2 align-middle text-[--brand-blue]" />
                    <span>How it Works</span>
                </h3>
                <p className="text-base md:text-lg text-slate-700">
                    1. You schedule a roof inspection <SmartLink href={STRIPE_PAYMENT_LINK}>online</SmartLink> or by <SmartLink href="/contact-us">contacting our office</SmartLink>.
                    <br /><br />
                    2. We reach out to the provided phone/email to confirm date/time.
                    <br /><br />
                    3. A Certified Roofing Specialist performs the roof inspection on the agreed-upon date and time.
                    <br /><br />
                    4. You receive a written summary of findings, photos where helpful, and a clear plan to
                    extend the life of your roof.
                </p>
            </div>

            <div className="bg-slate-200 h-[1px] my-6" />

            <div className="mb-3">
                <h3 className="mt-0 text-xl md:text-2xl">What do we look for?</h3>
                <p className="text-slate-500 text-sm leading-none uppercase font-semibold">
                    Select a Category
                    <SquareMousePointer className="h-4 w-4 ml-2 text-[--brand-blue] inline" />
                </p>
            </div>

            {/* JSON-LD: HowTo + Service for Tip Top Roof Check‑up */}
            <JsonLd data={howToLd} />
            <JsonLd data={serviceLd} />

            <div className="flex w-fit flex-row items-center justify-start border overflow-hidden shadow-sm rounded-lg">
                {PILLS.map(({ key, label }) => {
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
                                'inline-flex items-center gap-2 text-base px-3 py-1 md:px-4 md:py-2 transition',
                                active
                                    ? 'bg-[var(--brand-orange)] font-sans font-semibold text-white border-transparent'
                                    : 'bg-white font-sans text-slate-700 border-blue-200 hover:bg-slate-50'
                            )}
                            data-active={active}
                        >
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6">
                {PILLS.map(({ key }) => (
                    <div
                        key={key}
                        role="tabpanel"
                        id={`panel-${key}`}
                        aria-labelledby={`tab-${key}`}
                        hidden={tab !== key}
                    >
                        <h3 className="mt-0 text-xl text-slate-700 md:text-2xl">{CHECKLIST[key].title}</h3>
                        <p className="mt-1 text-lg text-slate-600">{CHECKLIST[key].blurb}</p>

                        <ul className="space-y-3 list-none not-prose p-0">
                            {CHECKLIST[key].items.map((it, idx) => {
                                const id = `${key}-${idx}`;
                                return (
                                    <li key={id} className="not-prose">
                                        <Accordion
                                            summary={<h4 className="text-xl text-slate-700">{it.label}</h4>}
                                            radius="xl"
                                            tone="soft"
                                            size="md"
                                            proseBody={false}
                                            summaryClassName='bg-cyan-50/30'
                                        >
                                            <p className="m-0">
                                                <strong className="text-slate-700">Why we check this:</strong> {it.why}
                                            </p>
                                        </Accordion>
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
