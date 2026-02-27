'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Accordion } from '@/components/ui/Accordion';
import { JsonLd } from '@/lib/seo/json-ld';
import { howToSchema, serviceSchema } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/seo/site';
import { ArrowRight, HandCoins, InfoIcon, Phone, ShieldCheck, SquareMousePointer } from 'lucide-react';
import SmartLink from '@/components/utils/SmartLink';

type Item = { label: string; why: string };

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
                <h2 className="mt-4 text-3xl md:text-4xl text-slate-700 font-semibold">The &quot;Tip Top Roof Check‑up&quot;</h2>
                <p className="text-slate-600">
                    Our 18‑point roof inspection helps catch small issues before they become big problems.
                </p>
            </header>
            <div id="how-it-works" className="my-6 max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-4 shadow-sm">
                <h3 className="mt-4 text-xl md:text-2xl">
                    <InfoIcon className="inline h-5 md:h-6 w-5 md:w-6 mr-2 align-middle text-[--brand-blue]" />
                    <span>How it Works</span>
                </h3>
                <p className="text-base md:text-lg text-slate-700">
                    1. You purchase a roof inspection <SmartLink href="INSERT_STRIPE_LINK">online</SmartLink> or by <SmartLink href="/contact-us">contacting our office</SmartLink>.
                    <br /><br />
                    2. We reach out to the provided phone/email to confirm scheduling.
                    <br /><br />
                    3. A Certified Roofing Specialist performs the roof inspection on the agreed-upon date and time.
                    <br /><br />
                    4. You receive a written summary of findings, photos where helpful, and a clear plan to
                    extend the life of your roof.
                </p>
            </div>

            <div className="bg-slate-200 h-[1px] my-6" />

            <div className="text-center text-lg sm:text-2xl font-semibold my-4">
                Book Your <span className="text-[--brand-blue]">Roof Inspection</span> Today
            </div>
            <div>
                <SmartLink className="flex-row flex-nowrap gap-1 not-prose w-full py-4 btn btn-md btn-brand-blue" href="STRIPE_PAYMENT_LINK_HERE" data-icon-affordance="right" target="_blank" rel="noopener noreferrer">
                    <span>Pay Securely with</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="55" height="30" fill-rule="evenodd" fill="#FFFFFF"><path d="M 50.7735 15.47 c 0 -2.9425 -1.425 -5.265 -4.15 -5.265 -2.735 0 -4.391 2.322 -4.391 5.2415 0 3.46 1.954 5.207 4.7585 5.207 1.368 0 2.4025 -0.31 3.184 -0.747 v -2.299 c -0.7815 0.391 -1.678 0.632 -2.816 0.632 -1.115 0 -2.1035 -0.391 -2.23 -1.747 h 5.62 c 0 -0.15 0.023 -0.747 0.023 -1.023 z M 45.1 14.3785 c 0 -1.299 0.793 -1.839 1.5175 -1.839 0.701 0 1.4485 0.54 1.4485 1.839 z m -7.2985 -4.1725 c -1.1265 0 -1.85 0.5285 -2.253 0.8965 l -0.15 -0.7125 H 32.865 v 13.4025 l 2.8735 -0.609 0.0115 -3.253 c 0.414 0.299 1.023 0.724 2.035 0.724 2.0575 0 3.931 -1.65 3.931 -5.299 -0.0115 -3.3335 -1.908 -5.15 -3.92 -5.15 z m -0.69 7.92 c -0.678 0 -1.08 -0.2415 -1.3565 -0.54 l -0.0115 -4.265 c 0.299 -0.3335 0.7125 -0.563 1.368 -0.563 1.046 0 1.77 1.1725 1.77 2.678 0 1.54 -0.7125 2.69 -1.77 2.69 z m -8.2 -8.598 l 2.885 -0.62 V 6.575 l -2.885 0.609 z m 0 0.8735 h 2.885 v 10.0575 h -2.885 z m -3.0925 0.85 l -0.184 -0.85 h -2.483 V 20.46 h 2.8735 V 13.643 c 0.678 -0.885 1.8275 -0.724 2.184 -0.5975 v -2.6435 c -0.368 -0.138 -1.7125 -0.391 -2.391 0.85 z m -5.747 -3.35 L 17.2675 8.5 l -0.0115 9.207 c 0 1.701 1.276 2.954 2.977 2.954 0.9425 0 1.632 -0.1725 2.0115 -0.38 v -2.3335 c -0.368 0.15 -2.184 0.678 -2.184 -1.023 V 12.85 h 2.184 v -2.4485 h -2.185 z m -7.77 5.414 c 0 -0.4485 0.368 -0.62 0.977 -0.62 a 6.425 6.425 0 0 1 2.85 0.735 V 10.735 c -0.954 -0.38 -1.8965 -0.5285 -2.85 -0.5285 -2.3335 0 -3.885 1.2185 -3.885 3.253 0 3.1725 4.368 2.6665 4.368 4.035 0 0.5285 -0.46 0.701 -1.1035 0.701 -0.954 0 -2.1725 -0.391 -3.138 -0.92 v 2.735 c 1.069 0.46 2.15 0.65 3.138 0.65 2.391 0 4.035 -1.184 4.035 -3.2415 -0.0115 -3.425 -4.391 -2.816 -4.391 -4.1035 z" /></svg>
                    <ArrowRight className="icon-affordance h-4 w-4 inline ml-2" />
                </SmartLink>
                <p className="mt-2 text-xs sm:text-sm text-center">
                    Takes you to a secure checkout page
                    <ShieldCheck className="h-4 w-4 text-green-600 ml-1 inline align-middle" />
                </p>
            </div>

            <div className="bg-slate-200 h-[1px] my-6" />

            <div className="my-6 rounded-xl border border-[#fb9216/5] bg-amber-50/50 p-4 shadow-sm" role="note" aria-label="Advisory">
                <strong className="uppercase text-[1rem] font-display block text-slate-800 mb-1">
                    <HandCoins className="text-[--brand-blue] h-4 w-4 mr-2 inline" />
                    Want it free instead?
                </strong>
                <p className="m-0 text-slate-700">
                    <span className="text-slate-600">Give us a call and mention you would like to join
                        the <SmartLink href="/roof-maintenance">Roof Care Club.</SmartLink>
                    </span>
                    <SmartLink className="phone-affordance mt-4 w-full not-prose" href="tel:+19418664320">
                        <div className="btn btn-md btn-outline w-full">
                            <Phone className="phone-affordance-icon inline h-4 w-4 mr-2" />
                            Call (941) 866-4320
                        </div>
                    </SmartLink>
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
