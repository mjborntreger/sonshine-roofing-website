'use client';

import { useMemo, useState } from 'react';

// -----------------------------
// Types & Data
// -----------------------------

type Term = 1 | 2 | 3;

type PlanId = 'essentials' | 'plus' | 'ultra';

type BadgeKey = 'most-popular' | 'best-value' | 'most-features';

type Feature = {
  id: string;
  label: string;
  why?: string; // short helpful explainer
  includedIn: PlanId[];
};

type Plan = {
  id: PlanId;
  name: string;
  color: 'light-blue' | 'orange' | 'blue';
  prices: Record<Term, number>; // yearly pricing
  badges?: BadgeKey[];
  features: string[]; // feature ids in order for card view
};

// Feature registry (expand/edit copy freely)
const FEATURES: Feature[] = [
  {
    id: 'annual-checkup',
    label: 'Annual Tip Top Roof Checkup',
    why:
      'We catch small issues before they become big problems—protecting your roof and budget.',
    includedIn: ['essentials', 'plus', 'ultra'],
  },
  {
    id: 'priority-appt',
    label: 'Priority appointments',
    why: 'Skip the wait and get on the schedule faster when you need us most.',
    includedIn: ['essentials', 'plus', 'ultra'],
  },
  {
    id: 'discount-repair',
    label: '10% discount on future repair',
    why: 'Members-only pricing on eligible repairs saves money over the life of your roof.',
    includedIn: ['plus', 'ultra'],
  },
  {
    id: 'insurance-cert',
    label: 'Written roof certification for insurance',
    why: 'Documentation that your roof was professionally inspected can help with policies and claims.',
    includedIn: ['plus', 'ultra'],
  },
  {
    id: 'skylight',
    label: 'Skylight cleaning**',
    why: 'Keeps light clear and seals visible so we can spot issues early.',
    includedIn: ['ultra'],
  },
  {
    id: 'gutter',
    label: 'Gutter cleaning**',
    why: 'Clear flow prevents overflow and water intrusion at the fascia.',
    includedIn: ['ultra'],
  },
  {
    id: 'debris',
    label: 'Large debris removal**',
    why: 'Branches and heavy debris shorten a roof’s life—removal helps prevent damage.',
    includedIn: ['ultra'],
  },
];

const PLANS: Plan[] = [
  {
    id: 'essentials',
    name: 'The Essentials',
    color: 'light-blue',
    prices: { 1: 169, 2: 311, 3: 446 },
    features: ['annual-checkup', 'priority-appt'],
  },
    {
    id: 'plus',
    name: 'Essentials Plus',
    color: 'blue',
    prices: { 1: 275, 2: 522, 3: 726 },
    badges: ['most-popular'],
    features: ['annual-checkup', 'priority-appt', 'discount-repair', 'insurance-cert'],
  },
  {
    id: 'ultra',
    name: 'Essentials Ultra',
    color: 'orange',
    prices: { 1: 389, 2: 739, 3: 1027 },
    badges: ['best-value'],
    features: [
      'annual-checkup',
      'priority-appt',
      'discount-repair',
      'insurance-cert',
      'skylight',
      'gutter',
      'debris',
    ],
  },
];

const BADGE_LABEL: Record<BadgeKey, string> = {
  'most-popular': 'Most popular',
  'best-value': 'Best value',
  'most-features': 'Most features',
};

// -----------------------------
// Helpers
// -----------------------------

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function savingsVsOneYear(plan: Plan, term: Term) {
  if (term === 1) return null;
  const base = plan.prices[1];
  const chosen = plan.prices[term];
  const saved = base * term - chosen;
  const pct = saved > 0 ? Math.round((saved / (base * term)) * 100) : 0;
  return { saved, pct };
}

// -----------------------------
// Component
// -----------------------------

export default function RoofCareClub() {
  // Default term: 1 year, per request
  const [term, setTerm] = useState<Term>(1);
  // Pricing display toggle
  const [mode, setMode] = useState<'year' | 'month'>('year');

  // Feature lookup for quick access
  const featureById = useMemo(() => {
    const map = new Map<string, Feature>();
    FEATURES.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  // JSON-LD (client-side): Service details for Roof Care Club (membership)
  const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://sonshineroofing.com');
  const pageUrl = `${base}/roof-maintenance`;
  const providerId = `${base}/#roofingcontractor`;

  const offerCatalog = useMemo(() => ({
    '@type': 'OfferCatalog',
    name: 'Roof Care Club Plans',
    itemListElement: PLANS.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      category: plan.id,
      priceCurrency: 'USD',
      offeredBy: { '@id': providerId },
      itemOffered: { '@type': 'Service', name: 'Roof Maintenance (Membership)' },
      additionalProperty: [
        { '@type': 'PropertyValue', name: '1-year', value: plan.prices[1] },
        { '@type': 'PropertyValue', name: '2-year', value: plan.prices[2] },
        { '@type': 'PropertyValue', name: '3-year', value: plan.prices[3] },
      ],
    })),
  }), [providerId]);

  const serviceLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${base}/#roof-care-club`,
    name: 'Roof Care Club',
    serviceType: 'Roof Maintenance',
    description: 'Membership maintenance plan with scheduled inspections, discounts, and member benefits.',
    url: pageUrl,
    provider: { '@id': providerId },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
      { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
      { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
    ],
    hasOfferCatalog: offerCatalog,
  }), [base, pageUrl, providerId, offerCatalog]);

  return (
    <div aria-labelledby="roof-care-club" className="mt-24 py-8 not-prose">
      <div className="text-center max-w-3xl mx-auto">
        <h2 id="roof-care-club" className="text-3xl md:text-4xl font-semibold tracking-tight">
          Roof Care Club
        </h2>
        <p className="mt-4 text-slate-600">
          Choose your plan and term. Switch to monthly view to see the equivalent cost—
          <span className="font-medium text-slate-800">plans are billed annually</span>.
        </p>
        {/* JSON-LD: Service (Roof Care Club) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
        />
      </div>

      {/* Toggles */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {/* Duration */}
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t as Term)}
              aria-pressed={term === t}
              className={[
                'px-4 py-1.5 text-sm rounded-full transition',
                term === t
                  ? 'bg-[var(--brand-blue,#0045d7)] text-white shadow'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {t}-year
            </button>
          ))}
        </div>

        {/* Display mode */}
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(['year', 'month'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={[
                'px-4 py-1.5 text-sm rounded-full transition',
                mode === m
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {m === 'year' ? 'Yearly' : 'Monthly'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">All plans are purchased on a yearly basis.</p>
      </div>

      {/* Cards */}
      <div className="not-prose mt-8 max-w-4xl mx-auto grid grid-cols-1 gap-8">
        {PLANS.map((plan) => {
          const yearly = plan.prices[term];
          const monthlyFromTerm = yearly / (term * 12);
          const monthlyLabel = monthlyFromTerm.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          });
          const priceLabel = mode === 'year' ? currency(yearly) : `${monthlyLabel}/mo`;
          const savings = savingsVsOneYear(plan, term);

          return (
            <div
              key={plan.id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm z-0 min-w-[280px]"
            >
              {/* Header */}
              <div
                className={[
                  'not-prose px-6 py-5',
                  plan.color === 'orange'
                    ? 'bg-[#ff8a00] text-white'
                    : plan.color === 'blue'
                    ? 'bg-[#0045d7] text-white'
                    : 'bg-[#316FE2] text-white',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={[
                      'text-xl md:text-2xl font-semibold leading-tight',
                      plan.color === 'orange' || plan.color === 'blue' ? '!text-white' : 'text-white'
                    ].join(' ')}
                  >
                    {plan.name}
                  </h3>
                  {plan.badges && plan.badges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {plan.badges.map((b) => (
                        <span
                          key={b}
                          className={[
                            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                            plan.color === 'light-blue' ? 'bg-black/10 text-white' : 'bg-white/15 text-white',
                          ].join(' ')}
                        >
                          {BADGE_LABEL[b]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="px-6 pt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight">{priceLabel}</span>
                  <span className="text-slate-500">{mode === 'year' ? 'total' : 'equivalent'}</span>
                </div>
                {term > 1 && savings && savings.saved > 0 && (
                  <div className="mt-1 text-sm text-emerald-600">
                    Save {currency(savings.saved)} ({savings.pct}%){' '}
                    with the {term}-year term
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="mt-4 flex-1 space-y-3 px-6 pb-6 list-none">
                {plan.features.map((fid) => {
                  const f = featureById.get(fid)!;
                  return (
                    <li key={fid} className="rounded-xl border border-slate-200">
                      <details className="group [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50/70 px-5 py-3.5 text-slate-900 hover:bg-slate-100">
                          <span className="font-medium leading-snug text-[15px] md:text-base">{f.label}</span>
                          <span
                            aria-hidden
                            className="text-slate-400 transition group-open:rotate-180"
                          >
                            ▾
                          </span>
                        </summary>
                        {f.why && (
                          <div className="accordion-motion px-4 pb-4 pt-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Why it matters: </span>
                            {f.why}
                          </div>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-slate-500 italic">
        <small>**Includes up to 90 minutes to perform any combination of these three services during your annual roof inspection.</small>
      </p>
    </div>
  );
}
