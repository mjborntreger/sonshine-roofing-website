import Section from "@/components/layout/Section";
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import SmartLink from "@/components/utils/SmartLink";
import Hero from "@/components/ui/Hero";
import { listFaqsWithContent } from "@/lib/content/wp";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import type { Metadata } from "next";
import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  HandCoins,
  Home,
  Mail,
  Smartphone,
  XCircle,
} from "lucide-react";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";

const SERVICE_PATH = "/homeowner-referral-program";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

const REFERRAL_PHONE_HREF = "tel:19418664320";
const REFERRAL_PHONE_DISPLAY = "(941) 866-4320";
const CONTACT_PATH = "/contact-us";
const TERMS_PATH = "/homeowner-referral-program/terms-and-conditions";

const CARD_BASE = "rounded-3xl border bg-white p-6 shadow-sm";
const PANEL_BASE = "rounded-3xl border bg-white shadow-sm";
const CARD_TITLE = "mt-4 text-lg font-semibold text-slate-900";
const CARD_TEXT = "mt-2 text-sm leading-6 text-slate-600";
const HERO_ACTION = "btn btn-lg";

type StepCard = {
  step: string;
  title: string;
  text: string;
};

const PROCESS_STEPS: StepCard[] = [
  {
    step: "Step 1",
    title: "Homeowner reaches out",
    text: "They can call SonShine Roofing during business hours or send a request through our contact page.",
  },
  {
    step: "Step 2",
    title: "They share your contact details",
    text: "The homeowner should provide your name, phone number, and preferred email address so SonShine can match the referral correctly.",
  },
  {
    step: "Step 3",
    title: "We mail you a check",
    text: "Once the roof replacement sale is made, SonShine mails your $250 reward check within 7 business days.",
  },
];

const QUALIFIES = [
  "Full roof replacements",
  "Within service area",
  "Job is approved and sales contract is signed",
];

const DOES_NOT_QUALIFY = [
  "Repairs, maintenance, or inspections",
  "Outside of service area",
  "Self-referrals",
];

const SERVICE_AREAS = ["Sarasota County", "Manatee County", "Charlotte County"];

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Homeowner Referral Program | SonShine Roofing",
      description:
        "Learn who can refer SonShine Roofing, what projects qualify, and how to earn $250 per qualified full roof replacement referral.",
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

export default async function HomeownerReferralProgramPage() {
  const [faqs] = await Promise.all([
    listFaqsWithContent(8, "roof-replacement").catch(() => []),
  ]);

  const origin = SITE_ORIGIN;
  const config = SERVICE_CONFIG;

  const breadcrumbsConfig =
    config?.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Homeowner Referral Program", path: SERVICE_PATH },
    ];

  const webPageLd = webPageSchema({
    name: config?.title ?? "Homeowner Referral Program",
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

  return (
    <>
      <Hero
        title="Homeowner Referral Program"
        eyelash="SonShine Roofing Referral Program"
        subtitle="Are you a current or former SonShine customer who knows a homeowner who needs a full roof replacement? Refer them to SonShine Roofing and earn $250 for each qualified referral."
        badges={[
          { icon: HandCoins, label: "$250 per qualified referral" },
          { icon: Home, label: "Full roof replacement jobs only" },
          { icon: Smartphone, label: "Call or use our contact form" },
          { icon: ArrowLeftRight, label: "Paid via check in the mail" },
        ]}
        justifyStart
        imageSrc="https://next.sonshineroofing.com/wp-content/uploads/referral-program-hero-image.webp"
      >
        <div className="flex flex-wrap gap-3">
          <SmartLink
            href={REFERRAL_PHONE_HREF}
            className={`${HERO_ACTION} btn-brand-blue phone-affordance`}
            aria-label="Call SonShine Roofing about the homeowner referral program"
            proseGuard
          >
            <Smartphone className="h-4 w-4 mr-2 phone-affordance-icon" aria-hidden="true" />
            {REFERRAL_PHONE_DISPLAY}
          </SmartLink>
          <SmartLink
            href={CONTACT_PATH}
            className={`${HERO_ACTION} btn-secondary`}
            aria-label="Contact SonShine Roofing to submit a referral"
            proseGuard
          >
            <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
            Questions?
          </SmartLink>
          <SmartLink
            href={TERMS_PATH}
            className="inline-flex items-center text-sm font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline"
            aria-label="Read the referral program terms and conditions"
            proseGuard
          >
            Read full terms and conditions
          </SmartLink>
        </div>
      </Hero>

      <Section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start px-2">
          <div id="article-root" className="prose min-w-0">
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />

            <h2 className="mt-4 text-3xl">Refer a Homeowner <span className="text-[--brand-blue]">with Confidence</span></h2>
            <p>
              If you know a friend, family member, neighbor, or fellow homeowner who needs a
              full roof replacement in our Southwest Florida service area, <strong>you may be eligible for a <span className="text-[--brand-blue]">$250</span> cash prize.</strong>
            </p>
            <h2>How to Submit a Referral</h2>
            <p>
              The process is intentionally straightforward. The most important thing is making
              sure SonShine receives enough information to match the homeowner to the correct
              referrer before the sale is made.
            </p>

            <div className="not-prose my-6 grid gap-4 md:grid-cols-3">
              {PROCESS_STEPS.map(({ step, title, text }) => (
                <div
                  key={step}
                  className={`${CARD_BASE} border-blue-200`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--brand-blue] text-sm font-bold text-white">
                      {step.replace("Step ", "")}
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {step}
                    </p>
                  </div>
                  <p className={CARD_TITLE}>{title}</p>
                  <p className={CARD_TEXT}>{text}</p>
                </div>
              ))}
            </div>

            <div className="not-prose my-8 overflow-hidden rounded-3xl border border-blue-200 bg-blue-100/70 shadow-sm">
              <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                    Important timing note
                  </p>
                  <p className="mt-3 text-xl font-semibold text-slate-700">
                    The homeowner does not have to mention you only on the first call.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    If referral details are not shared at initial contact, SonShine can still
                    credit the referral later, provided we receive the referrer&apos;s name, phone
                    number, and preferred email address before the sale is made. Once the job is
                    approved, the referral-credit window closes.
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white p-5 text-slate-700 lg:max-w-sm">
                  <p className="text-sm font-semibold text-slate-900">Best practice</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ask the homeowner to share your name, phone number, and preferred email when
                    they call or submit their contact request.
                  </p>
                </div>
              </div>
            </div>

            <h2>What Counts as a Eligible Referral?</h2>
            <p>
              SonShine limits rewards to <strong>full roof replacement jobs</strong> that meet the program requirements below:
            </p>
            <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
              <div className={`${CARD_BASE} bg-emerald-100/20 border-emerald-200`}>
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="text-xl font-semibold text-emerald-600">Eligible</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </div>
                </div>
                <ul className="mt-5 space-y-3 leading-6 text-slate-600">
                  {QUALIFIES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${CARD_BASE} bg-red-100/50 border-red-200`}>
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="text-xl font-semibold text-red-600">Not Eligible</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center text-red-600">
                    <XCircle className="h-8 w-8" aria-hidden="true" />
                  </div>
                </div>
                <ul className="mt-5 space-y-3 leading-6 text-slate-700">
                  {DOES_NOT_QUALIFY.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`${PANEL_BASE} not-prose my-6 border-blue-200 bg-blue-100/70 p-6`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-700">Service Area</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The homeowner should be the legal owner of a property in one of the
                    following counties:
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {SERVICE_AREAS.map((county) => (
                      <span
                        key={county}
                        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        {county}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h2>Ready to Send a Referral?</h2>
            <div className={`${PANEL_BASE} not-prose mt-6 overflow-hidden border-blue-200`}>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="px-6 py-6 sm:px-8">
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    Use this page as your quick program guide, <span className="text-[--brand-blue]">then send the homeowner our way.</span>
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    For questions about eligibility, referral status, payout timing, duplicate
                    claims, or disputes, call SonShine Roofing directly Monday through Friday,
                    7:30 AM to 4:00 PM EST.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <SmartLink
                      href={REFERRAL_PHONE_HREF}
                      className="btn btn-lg btn-brand-blue phone-affordance"
                      aria-label="Call SonShine Roofing for referral program help"
                      proseGuard
                    >
                      <Smartphone className="h-4 w-4 mr-2 phone-affordance-icon" aria-hidden="true" />
                      {REFERRAL_PHONE_DISPLAY}
                    </SmartLink>
                    <SmartLink
                      href={CONTACT_PATH}
                      className="btn btn-lg btn-outline"
                      aria-label="Open the SonShine Roofing contact page"
                      proseGuard
                    >
                      <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                      Questions?
                    </SmartLink>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 lg:border-l lg:border-t-0">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[--brand-blue]" aria-hidden="true" />
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
                      Quick reminders
                    </p>
                  </div>
                  <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />
                      <span>The homeowner may call or submit a request through our contact page.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />
                      <span>They should share your name, phone number, and preferred email.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[--brand-blue]" aria-hidden="true" />
                      <span>Once the job is approved, the referral-credit window closes.</span>
                    </li>
                  </ul>
                  <SmartLink
                    href={TERMS_PATH}
                    className="mt-6 inline-flex items-center text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                    aria-label="View the referral program terms and conditions"
                    proseGuard
                  >
                    View full program terms and conditions
                  </SmartLink>
                </div>
              </div>
            </div>
          </div>
          <ServicesAside activePath={SERVICE_PATH} />
        </div>
        <FaqInlineList
          heading="Referral Program FAQs"
          topicSlug="referral-program"
          limit={8}
          initialItems={faqs}
          seeMoreHref="/faq"
        />
      </Section>
    </>
  );
}
