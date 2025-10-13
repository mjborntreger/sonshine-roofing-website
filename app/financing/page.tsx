import SmartLink from "@/components/SmartLink";
import { ListChecks, ListOrdered, HelpCircle, Phone, ArrowDown, HandCoins, Timer, Percent, MapPin, CheckCircle, ArrowLeftRight, ListStart, ChevronRight } from "lucide-react";
import ProgramCard from '@/components/ProgramCard';
import MonthlyEstimator from './MonthlyEstimator';
import type { Metadata } from 'next';
import Image from "next/image";
import FaqInlineList from "@/components/FaqInlineList";
import { listFaqsWithContent } from "@/lib/wp";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, serviceSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";

const SERVICE_PATH = "/financing";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Roof Financing | SonShine Roofing",
      description: "Roof financing options from SonShine Roofing.",
      path: SERVICE_PATH,
    });
  }

  return buildBasicMetadata({
    title: config.title,
    description: config.description,
    path: SERVICE_PATH,
    keywords: config.keywords,
    image: config.image,
  });
}

const h2 = 'mb-16 mt-40 text-3xl md:text-4xl text-center font-semibold text-slate-900';
const h2Icon = "inline mr-4 h-7 w-7 md:h-10 md:w-10 text-[--brand-blue]";
const h3 = 'text-xl md:text-2xl font-semibold text-slate-900 flex items-center';
const lead = 'text-lg text-slate-700';
const pill =
  'inline-flex items-center gap-2 rounded-full border border-[--brand-orange] bg-white px-3 py-1 text-sm text-slate-800';
const heroPillIcon = 'inline h-3 w-3 text-[--brand-blue]';

const checkList = "flex items-start gap-2";
const checkIconYgrene = 'mt-0.5 h-4 w-4 text-[--brand-orange] flex-none';
const checkIconServiceFinance = 'mt-0.5 h-4 w-4 text-[--brand-cyan] flex-none';
// Icon style for section headings (fits me / expect / questions)
const sectionIcon = 'inline mr-2 h-5 w-5 text-[--brand-blue]';
const ctaSecondary = 'btn w-full btn-brand-blue btn-lg phone-affordance';
const ctaPrimary = "btn btn-brand-orange btn-lg"
const contactInfoPillStyles = "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
const contactInfoIconStyles = "h-5 w-5 text-slate-500";

export default async function FinancingPage() {
  // Dynamic FAQs for topic "financing-payment" (max 8)
  const faqs = await listFaqsWithContent(8, "financing-payment").catch(() => []);
  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;

  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Financing", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Roof Financing",
    description: config?.description,
    url: SERVICE_PATH,
    origin,
    primaryImage: config?.image?.url ?? "/og-default.png",
    isPartOf: { "@type": "WebSite", name: "SonShine Roofing", url: origin },
  });

  const breadcrumbsLd = breadcrumbSchema(
    breadcrumbsConfig.map((crumb) => ({
      name: crumb.name,
      item: crumb.path,
    })),
    { origin },
  );

  const serviceLd = serviceSchema({
    name: "Roof Financing",
    description:
      config?.description ??
      "Flexible roof financing options in Sarasota, Manatee, and Charlotte Counties.",
    url: SERVICE_PATH,
    origin,
    provider: {
      "@type": "Organization",
      name: "SonShine Roofing",
      url: origin,
      logo: { "@type": "ImageObject", url: `${origin}/icon.png` },
    },
    areaServed: [
      "Sarasota County, FL",
      "Manatee County, FL",
      "Charlotte County, FL",
    ],
    offers: [
      { "@type": "Offer", name: "YGrene (PACE, equity‑based)", url: "https://prequalification.ygrene.com/ContractorApply/XYFMHC" },
      { "@type": "Offer", name: "Service Finance (credit‑based)", url: SERVICE_PATH },
    ],
    serviceType: "Roof Financing",
  });
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
    <section className="mx-auto max-w-8xl">
      <div className="container-edge py-10 md:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl mt-12 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Roof Financing Made Simple
            <HandCoins className="h-7 w-7 md:h-12 md:w-12 text-[--brand-blue] inline ml-4"/>
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
            <SmartLink
              href="#get-started"
              className={ctaPrimary}
              title="Get Started"
              data-icon-affordance="down"
              proseGuard
            >
              Get Started
              <ArrowDown className="icon-affordance h-5 w-5 inline ml-2 text-white" aria-hidden="true" />
            </SmartLink>
            <SmartLink
              href="tel:+19418664320"
              className={`${contactInfoPillStyles} phone-affordance`}
              title="Call SonShine Roofing"
              proseGuard
              >
              <Phone className={`${contactInfoIconStyles} phone-affordance-icon`} aria-hidden="true" />
              <span className="font-semibold">(941) 866-4320</span>
              </SmartLink>
          </div>
        </div>

        <div className="gradient-divider mt-10" />

        <h2 id="get-started" className='my-16 text-3xl md:text-4xl text-center font-semibold text-slate-900'>
          <ListStart className={h2Icon} />
          1. Get Started
        </h2>
        <MonthlyEstimator />

        {/* Two programs (plan cards) */}
        <h2 className={h2} id="pick-a-plan">
          <ArrowLeftRight className={h2Icon} />
          2. Pick a Plan
        </h2>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgramCard
            id="ygrene-program-card"
            theme="orange"
            title="YGrene PACE Financing (Equity‑based)"
            subtitle="House‑secured. Payments typically included in your property‑tax bill."
            logoUrl="https://next.sonshineroofing.com/wp-content/uploads/ygrene-financing-logo.webp"
            chips={["No credit check", "Tax‑bill payments", "Equity‑based", "Fast approval"]}
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
            id="service-finance-program-card"
            theme="cyan"
            title="Service Finance (Credit‑based)"
            subtitle="Signature loan with flexible terms. No lien on your property."
            logoUrl="https://next.sonshineroofing.com/wp-content/uploads/service-finance-logo.png"
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
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Which option fits me? */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className={h3}>
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

          {/* What&rsquo;s Next */}
          <section id="whats-next" className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className={h3}>
              <ListOrdered className={sectionIcon} aria-hidden="true" />
              What&rsquo;s next?
            </h3>
            <ol className="mt-3 list-decimal pl-5 space-y-2 text-slate-700">
              <li>
                <SmartLink
                  href="#docs"
                  className="text-[--brand-blue]"
                  data-icon-affordance="right"
                  proseGuard
                >
                  Know what documents you&rsquo;ll need
                  <ChevronRight className="icon-affordance h-4 w-4 inline ml-1 text-slate-600" />
                </SmartLink>
              </li>
              <li>
                <SmartLink
                  href="/contact-us#book-an-appointment"
                  className="text-[--brand-blue]"
                  data-icon-affordance="right"
                  proseGuard
                >
                  Schedule an appointment with a Roofing Specialist
                  <ChevronRight className="icon-affordance h-4 w-4 inline ml-1 text-slate-600" />
                </SmartLink>
              </li>
              <li>We take care of the application</li>
              <li>Same-day Approval</li>
              <li>We schedule your project</li>
            </ol>
          </section>

          {/* Questions? */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 h-full flex flex-col">
            <h3 className={h3}>
              <HelpCircle className={sectionIcon} aria-hidden="true" />
              Questions?
            </h3>
            <p className="mt-3 text-slate-700 flex-1">
              Our team has helped Sarasota homeowners finance roofs for decades. We’ll walk you
              through monthly payments, timelines, and total costs — candidly and clearly.
            </p>
            <div className="pt-2">
              <SmartLink
                href="tel:19418664320"
                className={ctaSecondary}
                title="Call SonShine Roofing"
                proseGuard
              >
                <Phone className="phone-affordance-icon inline mr-2 h-4 w-4" />
                (941) 866‑4320
              </SmartLink>
            </div>
          </section>
        </div>

        {/* Documents checklist (non-interactive) */}
          <h2 className={h2} id="docs">
            <ListChecks className={h2Icon} />
            3. What You’ll Need
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section 
              aria-labelledby="ygrene-docs" 
              className="rounded-2xl shadow-md border border-[--brand-orange] bg-white p-4">
              <div className="flex justify-between">
                <h3 
                  id="ygrene-docs" 
                  className="text-xl font-semibold text-slate-900">YGrene PACE Financing (Equity‑based)
                </h3>
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/ygrene-financing-logo.webp"
                  title="Ygrene Financing Logo"
                  alt="Ygrene Financing Logo"
                  className="h-6 w-auto opacity-70"
                  width={160}
                  height={48}
                />
              </div>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li className={checkList}>
                  <CheckCircle className={checkIconYgrene} aria-hidden="true" />
                  <span>Driver’s license (all property owners)</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconYgrene} aria-hidden="true" />
                  <span>Property address &amp; parcel details</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconYgrene} aria-hidden="true" />
                  <span>Mortgage/escrow info (if applicable)</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconYgrene} aria-hidden="true" />
                  <span>Property‑tax history (no late payments in last 3 years)</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconYgrene} aria-hidden="true" />
                  <span>Confirmation of sufficient home equity</span>
                </li>
              </ul>
            </section>

            <section 
              aria-labelledby="service-docs" 
              className="rounded-2xl shadow-md border border-[--brand-cyan] bg-white p-4">
              <div className="flex justify-between">
                <h3 
                id="service-docs" 
                className="text-xl font-semibold text-slate-900"
                >
                Service Finance (Credit‑based)
              </h3>
              <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/service-finance-logo.png"
                  title="Service Finance Logo"
                  alt="Service Finance Logo"
                  className="h-8 w-auto opacity-70"
                  width={180}
                  height={64}
              />
              </div>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li className={checkList}>
                  <CheckCircle className={checkIconServiceFinance} aria-hidden="true" />
                  <span>Driver’s license</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconServiceFinance} aria-hidden="true" />
                  <span>SSN (for credit application)</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconServiceFinance} aria-hidden="true" />
                  <span>Estimated project total</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconServiceFinance} aria-hidden="true" />
                  <span>Income / employment basics (quick verification)</span>
                </li>
                <li className={checkList}>
                  <CheckCircle className={checkIconServiceFinance} aria-hidden="true" />
                  <span>Email + mobile for e‑docs</span>
                </li>
              </ul>
            </section>
          </div>

        {/* Compliance */}
        <p className="italic mt-10 text-xs text-slate-500">
          Rates, terms, and eligibility subject to change and based on lender approval. SonShine
          Roofing is not a lender. Program availability may vary by municipality. Final terms will be
          provided in your financing documents.
        </p>

        <FaqInlineList
          heading="Financing FAQs"
          topicSlug="financing-payment"
          limit={8}
          initialItems={faqs}
          seeMoreHref="/faq"
        />

        <JsonLd data={serviceLd} />
        <JsonLd data={breadcrumbsLd} />
        <JsonLd data={webPageLd} />
      </div>
    </section>
  );
}
