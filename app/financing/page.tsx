import Section from '@/components/layout/Section';
import UiLink from '@/components/UiLink';
import { ListChecks, ListOrdered, HelpCircle, Phone, ArrowRight, HandCoins, CircleDollarSign, Timer, Percent, MapPin, CheckCircle } from "lucide-react";
import ProgramCard from '@/components/ProgramCard';
import MonthlyEstimator from './MonthlyEstimator';
import PlanQuiz from './PlanQuiz';
import type { Metadata } from 'next';
import FaqInlineList from "@/components/FaqInlineList";
import { listFaqsWithContent, faqItemsToJsonLd } from "@/lib/wp";

// ===== STATIC SEO FOR /financing (EDIT HERE) =====
const SEO_TITLE_FINANCING = 'Roof Financing | SonShine Roofing';
const SEO_DESCRIPTION_FINANCING = 'Flexible roof financing options in Sarasota, Manatee, and Charlotte Counties. Equity‑based (PACE) and credit‑based plans available — including no money down, deferred payments, and fixed‑rate terms.';
const SEO_KEYWORDS_FINANCING = [
  'roof financing',
  'roof loans',
  'PACE financing',
  'YGrene',
  'affordable roof financing',
  'low interest rate',
  'fast approval',
  'Service Finance',
  'roof payment plans',
  'Sarasota roofing',
  'North Port Roofing',
  'Venice Roofing',
  'Manatee County roofing',
  'Charlotte County roofing'
];
const SEO_CANONICAL_FINANCING = '/financing';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_FINANCING,
    description: SEO_DESCRIPTION_FINANCING,
    keywords: SEO_KEYWORDS_FINANCING,
    alternates: { canonical: SEO_CANONICAL_FINANCING },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_FINANCING,
      description: SEO_DESCRIPTION_FINANCING,
      url: SEO_CANONICAL_FINANCING,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_FINANCING,
      description: SEO_DESCRIPTION_FINANCING,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

const h2 = 'text-xl md:text-2xl font-semibold text-slate-900';
const lead = 'text-lg text-slate-700';
const pill =
  'inline-flex items-center gap-2 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm text-slate-800';
const heroPillIcon = 'inline h-3 w-3 text-[--brand-blue]';

// Checklist icon style for the documents section (tweak once here)
const checkIcon = 'mt-0.5 h-4 w-4 text-[--brand-blue] flex-none';
// Icon style for section headings (fits me / expect / questions)
const sectionIcon = 'inline mr-2 h-5 w-5 text-[--brand-blue]';
const ctaSecondary = 'btn btn-press btn-brand-blue btn-lg';
const ctaPrimary = "btn btn-press btn-brand-orange btn-lg"
const contactInfoPillStyles = "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
const contactInfoIconStyles = "h-5 w-5 text-slate-500";

export default async function FinancingPage() {
  // Dynamic FAQs for topic "financing-payment" (max 8)
  const faqs = await listFaqsWithContent(8, "financing-payment").catch(() => []);

  // JSON-LD objects (Service, Breadcrumbs, WebPage)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const pageUrl = `${base}${SEO_CANONICAL_FINANCING}`;
  const faqLd = faqItemsToJsonLd(
    faqs.map((f) => ({ question: f.title, answerHtml: f.contentHtml, url: `${base}/faq/${f.slug}` })),
    pageUrl
  );
  const org = {
    '@type': 'Organization',
    name: 'SonShine Roofing',
    url: base,
    logo: { '@type': 'ImageObject', url: `${base}/icon.png` },
  } as const;

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Roof Financing',
    description: SEO_DESCRIPTION_FINANCING,
    provider: org,
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Sarasota County, FL' },
      { '@type': 'AdministrativeArea', name: 'Manatee County, FL' },
      { '@type': 'AdministrativeArea', name: 'Charlotte County, FL' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Financing Programs',
      itemListElement: [
        { '@type': 'Offer', name: 'YGrene (PACE, equity‑based)', url: 'https://prequalification.ygrene.com/ContractorApply/XYFMHC' },
        { '@type': 'Offer', name: 'Service Finance (credit‑based)', url: pageUrl },
      ],
    },
    url: pageUrl,
  } as const;

  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Financing', item: pageUrl },
    ],
  } as const;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: SEO_TITLE_FINANCING,
    description: SEO_DESCRIPTION_FINANCING,
    url: pageUrl,
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${base}${SEO_OG_IMAGE_DEFAULT}`,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'SonShine Roofing',
      url: base,
    },
  } as const;
  // Local helpers for examples
  const currency = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const pmt = (principal: number, annualRate: number, months: number) => {
    const r = annualRate / 12; if (r === 0) return principal / months; return (principal * r) / (1 - Math.pow(1 + r, -months));
  };
  const defaultAmount = 15000;
  const sampleMonthly79 = currency(Math.round(pmt(defaultAmount, 0.079, 180))) + '/mo';
  const sampleMonthly849 = currency(Math.round(pmt(defaultAmount, 0.0849, 180))) + "/mo";
  const per10kService = '$96/mo per $10k';
  const per10kYgrene = "$124/mo per $10k";
  return (
    <Section>
      <div className="container-edge py-10 md:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Roof Financing Made Simple
            <HandCoins className="h-7 w-7 md:h-11 md:w-11 text-[--brand-blue] inline ml-4"/>
          </h1>
          <p className={`${lead} mt-4`}>
            Spread the cost of your roof over comfortable monthly payments. Choose from
            equity‑based (house‑secured) or credit‑based plans — both with fast approvals and
            clear terms.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {/* Hero benefit pills with icons */}
            <span className={pill}>
              <Timer className={heroPillIcon} aria-hidden="true" />
              Fast approval
            </span>
            <span className={pill}>
              <Percent className={heroPillIcon} aria-hidden="true" />
              Fixed‑rate options
            </span>
            <span className={pill}>
              <MapPin className={heroPillIcon} aria-hidden="true" />
              Local &amp; trusted
            </span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <UiLink href="/contact-us" className={ctaPrimary} title="Request Financing Details">
              Request financing details
            </UiLink>
            <UiLink
              href="tel:+19418664320"
              className={contactInfoPillStyles}
              title="Call SonShine Roofing"
              >
              <Phone className={contactInfoIconStyles} aria-hidden="true" />
              <span className="font-semibold">(941) 866-4320</span>
              </UiLink>
          </div>
        </div>

        <div className="gradient-divider my-10" />

        {/* Two programs (plan cards) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgramCard
            theme="blue"
            recommended
            title="YGrene Financing (Equity‑based)"
            subtitle="House‑secured. Payments typically included in your property‑tax bill."
            chips={["No credit check", "Tax‑bill payments", "Equity‑based"]}
            keyFigures={["From 8.49% APR", "18–24 mo deferral", per10kYgrene]}
            sampleMonthly={`${sampleMonthly849} on ${currency(defaultAmount)} (15yr @ 8.49%)`}
            bullets={[
              "Fixed rate throughout the term",
              "Simple escrow alignment when payments begin",
              "Fast approvals with property‑tax history",
              "Secured by your home",
            ]}
            eligibility={[
              "No bankruptcies in the last 3 years",
              "No late property‑tax payments in the last 3 years",
              "Sufficient home equity to cover the project",
            ]}
            finePrint="Subject to approval and municipal availability. Terms may vary."
            cta={{ href: "https://prequalification.ygrene.com/ContractorApply/XYFMHC", label: "Get pre-approved", title: "Ask about YGrene", className: "btn-brand-blue" }}
          />

          <ProgramCard
            theme="cyan"
            title="Service Finance (Credit‑based)"
            subtitle="Signature loan with flexible terms. No lien on your property."
            chips={["Signature loan", "Fixed term", "Fast approval"]}
            keyFigures={["0% for 12 months", "From 7.9% fixed", per10kService]}
            sampleMonthly={`${sampleMonthly79} on ${currency(defaultAmount)} (15yr @ 7.9%)`}
            bullets={[
              "No property lien",
              "Same‑as‑cash and deferred‑interest promos",
              "Popular 10‑ and 15‑year fixed terms",
              "Quick application with credit check",
            ]}
            eligibility={["Basic identity + credit", "Estimated project total", "Income/employment basics"]}
            finePrint="Final terms provided in loan documents. Promos subject to lender programs."
            cta={{ href: "/contact-us", label: "Call for details", title: "Call for details", className: "btn-outline" }}
          />
        </div>

        {/* Comparison / how it works (custom panels with icons) */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Which option fits me? */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className={`${h2} flex items-center`}>
              <ListChecks className={sectionIcon} aria-hidden="true" />
              Which option fits me?
            </h3>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
              <li>
                <strong>Want no credit check?</strong> YGrene’s equity‑based program focuses on your
                home equity and tax payment history.
              </li>
              <li>
                <strong>Prefer a traditional loan?</strong> Service Financing offers same‑as‑cash and
                fixed‑term choices.
              </li>
              <li>
                <strong>Need time before payments start?</strong> YGrene offers 18–24 month deferral.
              </li>
            </ul>
          </section>

          {/* What to expect */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className={`${h2} flex items-center`}>
              <ListOrdered className={sectionIcon} aria-hidden="true" />
              What to expect
            </h3>
            <ol className="mt-3 list-decimal pl-5 space-y-2 text-slate-700">
              <li>We help you pick the best program for your situation</li>
              <li>Quick application (phone or online)</li>
              <li>Approval and documents</li>
              <li>We schedule your project</li>
            </ol>
          </section>

          {/* Questions? */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 h-full flex flex-col">
            <h3 className={`${h2} flex items-center`}>
              <HelpCircle className={sectionIcon} aria-hidden="true" />
              Questions?
            </h3>
            <p className="mt-3 text-slate-700 flex-1">
              Our team has helped Sarasota homeowners finance roofs for decades. We’ll walk you
              through monthly payments, timelines, and total costs — candidly and clearly.
            </p>
            <div className="pt-2">
              <UiLink
                href="tel:19418664320"
                className={`${ctaSecondary} w-full`}
                title="Call SonShine Roofing"
              >
                <Phone className="inline mr-2 h-4 w-4" />
                (941) 866‑4320
              </UiLink>
            </div>
          </section>
        </div>

        {/*Estimator + Quiz */}
        <div className="items-start mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyEstimator />
          <div>
            <PlanQuiz />
          </div>
        </div>

        {/* Documents checklist (non-interactive) */}
        <div className="mt-24">
          <h2 className='mb-16 text-3xl md:text-5xl text-center font-semibold text-slate-900' id="docs">
            <ListChecks className="inline mr-4 h-7 w-7 md:h-11 md:w-11 text-[--brand-blue]" />
            What you’ll need
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section aria-labelledby="ygrene-docs" className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 id="ygrene-docs" className="text-xl font-semibold text-slate-900">YGrene (Equity‑based)</h3>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Driver’s license (all property owners)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Property address &amp; parcel details</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Mortgage/escrow info (if applicable)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Property‑tax history (no late payments in last 3 years)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Confirmation of sufficient home equity</span></li>
              </ul>
            </section>

            <section aria-labelledby="service-docs" className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 id="service-docs" className="text-xl font-semibold text-slate-900">Service Financing (Credit‑based)</h3>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Driver’s license</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>SSN (for credit application)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Estimated project total</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Income / employment basics (quick verification)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className={checkIcon} aria-hidden="true" /><span>Email + mobile for e‑docs</span></li>
              </ul>
            </section>
          </div>
          <p className="mt-3 text-sm text-slate-600">Not sure? We’ll walk you through it on a quick call.</p>
        </div>

        {/* Compliance */}
        <p className="italic mt-10 text-xs text-slate-500">
          Rates, terms, and eligibility subject to change and based on lender approval. SonShine
          Roofing is not a lender. Program availability may vary by municipality. Final terms will be
          provided in your financing documents.
        </p>

        <FaqInlineList heading="Financing FAQs" items={faqs} seeMoreHref="/faq" />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        {/* Service Schema */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
        />
        {/* BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
        />
        {/* WebPage Schema (mirrors SEO metadata) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
        />
      </div>
    </Section>
  );
}
