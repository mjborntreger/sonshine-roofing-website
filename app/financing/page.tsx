import Section from '@/components/layout/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UiLink from '@/components/UiLink';
import { Phone, BadgeCheck } from "lucide-react";
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
  'Service Finance',
  'roof payment plans',
  'Sarasota roofing',
  'Manatee County roofing',
  'Charlotte County roofing',
];
const SEO_CANONICAL_FINANCING = '/financing';
const SEO_OG_IMAGE_DEFAULT = '/og-default.jpg';

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
const cta = 'btn btn-brand-blue btn-lg';
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
  return (
    <Section>
      <div className="container-edge py-10 md:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Roof Financing Made Simple
          </h1>
          <p className={`${lead} mt-4`}>
            Spread the cost of your roof over comfortable monthly payments. Choose from
            equity‑based (house‑secured) or credit‑based plans — both with fast approvals and
            clear terms.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className={pill}>No money down</span>
            <span className={pill}>Fast approval</span>
            <span className={pill}>Fixed‑rate options</span>
            <span className={pill}>Local &amp; trusted</span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <UiLink href="/contact-us" className={cta} title="Request Financing Details">
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

        {/* Two programs */}
        <Section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equity-based / PACE */}
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>YGrene Financing (Equity‑based)</CardTitle>
                <p className="text-sm text-slate-600">
                  House‑secured. Payments typically included in your property tax bill.
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                  <li>No money down</li>
                  <li>No credit score required</li>
                  <li>
                    Approval based on:
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>No bankruptcies in the last 3 years</li>
                      <li>No late payments on property taxes for 3 years</li>
                      <li>Enough home equity to cover the project</li>
                    </ul>
                  </li>
                  <li>Fixed rate: <strong>8.9%</strong></li>
                  <li>Deferred payments: <strong>18–24 months</strong> before first payment</li>
                  <li>
                    When payments begin, they’re typically included in escrow through your mortgage
                    company
                  </li>
                  <li>Secured by your home</li>
                </ul>
              </CardContent>
              <div className="px-6 pb-6 pt-0 mt-auto flex justify-end">
                <UiLink 
                  href="https://prequalification.ygrene.com/ContractorApply/XYFMHC" 
                  className="btn btn-brand-orange btn-lg" 
                  title="Ask about YGrene"
                  >
                  <BadgeCheck className="inline mr-2 h-4 w-4" />
                  Get approved
                </UiLink>
              </div>
            </Card>

            {/* Credit-based */}
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>Service Finance (Credit‑based)</CardTitle>
                <p className="text-sm text-slate-600">
                  Signature loan with flexible terms. No lien on your property.
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                  <li>Signature loan (not secured by your property)</li>
                  <li>Fast approval with credit check</li>
                  <li>
                    Choose from popular options:
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>12‑Month Same‑As‑Cash</li>
                      <li>18‑Month Deferred Interest</li>
                      <li>10‑Year term at <strong>9.99%</strong></li>
                      <li>
                        15‑Year term at <strong>7.9%</strong>
                        <span className="opacity-80"> — for every $10,000 financed, monthly is ~ $96</span>
                      </li>
                    </ul>
                  </li>
                </ul>
              </CardContent>
              <div className="px-6 pb-6 pt-0 mt-auto flex justify-end">
                <UiLink href="/contact-us" className="btn btn-outline btn-lg" title="Call for details">
                  <Phone className="inline mr-2 h-4 w-4" />
                  Call for details
                </UiLink>
              </div>
            </Card>
          </div>
        </Section>

        {/*Estimator + Quiz */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyEstimator />
          
          <PlanQuiz />
        </div>

        {/* Comparison / how it works */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className={h2}>Which option fits me?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-slate-700">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={h2}>What to expect</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                <li>We help you pick the best program for your situation</li>
                <li>Quick application (phone or online)</li>
                <li>Approval and documents</li>
                <li>We schedule your project</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className={h2}>Questions?</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-slate-700">
                Our team has helped Sarasota homeowners finance roofs for decades. We’ll walk you
                through monthly payments, timelines, and total costs — candidly and clearly.
              </p>
            </CardContent>
            <div className="px-6 pb-6 pt-0 mt-auto">
              <UiLink
                href="tel:19418664320"
                className={`${cta} w-full`}
                title="Call SonShine Roofing"
              >
                <Phone className="inline mr-2 h-4 w-4" />
                (941) 866‑4320
              </UiLink>
            </div>
          </Card>
        </div>

        {/* Documents checklist */}
        <div className="mt-16">
          <h2 className={h2} id="docs">What you’ll need</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-xl">YGrene (Equity-based)</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                  <li>Driver’s license (all property owners)</li>
                  <li>Property address & parcel details</li>
                  <li>Mortgage/escrow info (if applicable)</li>
                  <li>Property-tax history (no late payments in last 3 years)</li>
                  <li>Confirmation of sufficient home equity</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-xl">Service Financing (Credit-based)</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                  <li>Driver’s license</li>
                  <li>SSN (for credit application)</li>
                  <li>Estimated project total</li>
                  <li>Income / employment basics (quick verification)</li>
                  <li>Email + mobile for e-docs</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Not sure? We’ll walk you through it on a quick call.
          </p>
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
