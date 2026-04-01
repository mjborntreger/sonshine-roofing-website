import Section from "@/components/layout/Section";
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import SmartLink from "@/components/utils/SmartLink";
import Hero from "@/components/ui/Hero";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { getServicePageConfig } from "@/lib/seo/service-pages";
import { SITE_ORIGIN } from "@/lib/seo/site";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  HandCoins,
  Home,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const SERVICE_PATH = "/homeowner-referral-program";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

const REFERRAL_PHONE_HREF = "tel:19418664320";
const REFERRAL_PHONE_DISPLAY = "(941) 866-4320";
const CONTACT_PATH = "/contact-us";
const TERMS_PATH = "/homeowner-referral-program/terms-and-conditions";

const CARD_BASE = "rounded-3xl border bg-white p-6 shadow-sm";
const PANEL_BASE = "rounded-3xl border bg-white shadow-sm";
const SUBTLE_CARD = "rounded-2xl border border-slate-200 bg-slate-50 p-5";
const ICON_WRAP = "flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[--brand-blue]";
const CARD_TITLE = "mt-4 text-lg font-semibold text-slate-900";
const CARD_TEXT = "mt-2 text-sm leading-6 text-slate-600";
const HERO_ACTION = "btn btn-lg";

type IconCard = {
  icon: LucideIcon;
  title: string;
  text: string;
};

type StepCard = {
  icon: LucideIcon;
  step: string;
  title: string;
  text: string;
};

const ELIGIBLE_REFERRERS: IconCard[] = [
  {
    icon: BadgeCheck,
    title: "Past Paying Customers",
    text: "If you have completed and paid for past work with SonShine Roofing, you can participate in the referral program.",
  },
  {
    icon: Home,
    title: "Current Customers",
    text: "Current SonShine Roofing customers may refer homeowners while their project or service relationship is active.",
  },
  {
    icon: ShieldCheck,
    title: "Roof Care Club Members",
    text: "Roof Care Club membership also qualifies you to participate and earn referral rewards for good-faith referrals.",
  },
];

const PROCESS_STEPS: StepCard[] = [
  {
    icon: Phone,
    step: "Step 1",
    title: "Have the homeowner reach out",
    text: "They can call SonShine Roofing during business hours or send a request through our contact page.",
  },
  {
    icon: Mail,
    step: "Step 2",
    title: "Share your referral details",
    text: "The homeowner should provide your name, phone number, and preferred email address so SonShine can match the referral correctly.",
  },
  {
    icon: HandCoins,
    step: "Step 3",
    title: "Earn your reward",
    text: "Once the qualifying roof replacement is approved, completed, and paid in full, SonShine mails your $250 reward check.",
  },
];

const QUALIFIES = [
  "A full roof replacement project",
  "The legal owner of the property receiving the roof replacement",
  "A property located in Sarasota, Manatee, or Charlotte County",
  "A job that is approved, completed, and paid in full",
];

const DOES_NOT_QUALIFY = [
  "Roof repairs",
  "Roof inspections",
  "Maintenance services",
  "Partial roofing projects",
  "Self-referrals",
];

const FAQS = [
  {
    title: "Does the homeowner have to be brand new to SonShine Roofing?",
    text: "No. The program does not require the referred homeowner to be a brand-new SonShine customer.",
  },
  {
    title: "Does the referral have to be mentioned on the very first call?",
    text: "Not necessarily. Referral credit can still be added after initial contact, as long as SonShine receives the referral details before the sale is made.",
  },
  {
    title: "Is there a limit to how many rewards I can earn?",
    text: "There is no fixed cap, but the program is limited to legitimate, good-faith referrals. SonShine may deny spammy, abusive, manipulated, suspicious, or otherwise illegitimate activity.",
  },
  {
    title: "What happens if more than one person claims the same referral?",
    text: "Duplicate or disputed claims are reviewed by SonShine case by case. Eligibility and credit decisions remain in SonShine's sole discretion.",
  },
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

export default function HomeownerReferralProgramPage() {
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
        subtitle="Know a homeowner who needs a full roof replacement? Refer them to SonShine Roofing and earn $250 for each qualified referral in 2026."
        badges={[
          { icon: HandCoins, label: "$250 per qualified referral" },
          { icon: Home, label: "Full roof replacement jobs only" },
          { icon: Phone, label: "Call or use our contact form" },
          { icon: ArrowLeftRight, label: "Paid via check in the mail" },
        ]}
        justifyStart
      >
        <div className="flex flex-wrap gap-3">
          <SmartLink
            href={REFERRAL_PHONE_HREF}
            className={`${HERO_ACTION} btn-brand-blue phone-affordance`}
            aria-label="Call SonShine Roofing about the homeowner referral program"
            proseGuard
          >
            <Phone className="h-4 w-4 mr-2 phone-affordance-icon" aria-hidden="true" />
            {REFERRAL_PHONE_DISPLAY}
          </SmartLink>
          <SmartLink
            href={CONTACT_PATH}
            className={`${HERO_ACTION} btn-secondary`}
            aria-label="Contact SonShine Roofing to submit a referral"
            proseGuard
          >
            <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
            Send a referral
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

            <h2 className="mt-0">Refer a Homeowner With Confidence</h2>
            <p>
              This page is the public guide to SonShine Roofing&apos;s 2026 Homeowner Referral
              Program. It explains who can participate, what kind of project qualifies, how
              referral credit works, and when reward checks are mailed.
            </p>
            <p>
              If you know a friend, family member, neighbor, or fellow homeowner who needs a
              full roof replacement in our Southwest Florida service area, this is the easiest
              way to understand how to refer them properly.
            </p>

            <div className={`${PANEL_BASE} not-prose my-8 border-blue-200 p-6`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={SUBTLE_CARD}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Reward
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">$250</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    For each qualified referral that leads to a completed and paid-in-full full
                    roof replacement.
                  </p>
                </div>
                <div className={SUBTLE_CARD}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Qualified Project
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">Full replacement</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Repairs, inspections, maintenance services, and partial roofing projects do
                    not qualify.
                  </p>
                </div>
                <div className={SUBTLE_CARD}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Credit Window
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">Before the sale</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Referral credit can still be added after initial contact, but it must be in
                    place before the sale is made.
                  </p>
                </div>
                <div className={SUBTLE_CARD}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Payout Timing
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">7 business days</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Reward checks are mailed within 7 business days after the referred job
                    reaches paid in full status.
                  </p>
                </div>
              </div>
            </div>

            <h2>Who Can Refer SonShine Roofing?</h2>
            <p>
              The program is open to eligible homeowners and members who already have an
              established relationship with SonShine Roofing.
            </p>
            <div className="not-prose my-6 grid gap-4 md:grid-cols-3">
              {ELIGIBLE_REFERRERS.map(({ icon: Icon, title, text }) => (
                <div key={title} className={`${CARD_BASE} border-slate-200`}>
                  <div className={ICON_WRAP}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className={CARD_TITLE}>{title}</p>
                  <p className={CARD_TEXT}>{text}</p>
                </div>
              ))}
            </div>

            <h2>How Referral Credit Works</h2>
            <p>
              The process is intentionally straightforward. The most important thing is making
              sure SonShine receives enough information to match the homeowner to the correct
              referrer before the sale is made.
            </p>
            <div className="not-prose my-6 grid gap-4 md:grid-cols-3">
              {PROCESS_STEPS.map(({ icon: Icon, step, title, text }) => (
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
                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-slate-50 text-[--brand-blue] shadow-sm">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className={CARD_TITLE}>{title}</p>
                  <p className={CARD_TEXT}>{text}</p>
                </div>
              ))}
            </div>

            <div className="not-prose my-8 overflow-hidden rounded-3xl border border-blue-200 bg-[var(--brand-blue)] shadow-sm">
              <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                    Important timing note
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    The homeowner does not have to mention you only on the first call.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-blue-50">
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

            <h2>What Counts as a Qualified Referral?</h2>
            <p>
              To keep the program fair and easy to administer, SonShine limits rewards to full
              roof replacement jobs that meet the program requirements below.
            </p>
            <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
              <div className={`${CARD_BASE} border-emerald-200`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-slate-50 text-emerald-600 shadow-sm">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Qualifies</p>
                    <p className="text-sm text-slate-600">These are the standard program requirements.</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  {QUALIFIES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${CARD_BASE} border-slate-200`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
                    <XCircle className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Does not qualify</p>
                    <p className="text-sm text-slate-600">These scenarios fall outside the program.</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                  {DOES_NOT_QUALIFY.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2>Service Area</h2>
            <p>
              Referred properties must be located within SonShine Roofing&apos;s residential
              service area for this program.
            </p>
            <div className={`${PANEL_BASE} not-prose my-6 border-slate-200 p-6`}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[--brand-blue]">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-900">Covered counties</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
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

            <h2>Common Questions</h2>
            <div className="not-prose my-6 grid gap-4 md:grid-cols-2">
              {FAQS.map(({ title, text }) => (
                <div key={title} className={`${CARD_BASE} border-slate-200`}>
                  <p className="text-lg font-semibold text-slate-900">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>

            <h2>Ready to Send a Referral?</h2>
            <div className={`${PANEL_BASE} not-prose mt-6 overflow-hidden border-blue-200`}>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="px-6 py-6 sm:px-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[--brand-blue]">
                    Earn $250 per qualified referral
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    Use this page as your quick program guide, then send the homeowner our way.
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
                      <Phone className="h-4 w-4 mr-2 phone-affordance-icon" aria-hidden="true" />
                      {REFERRAL_PHONE_DISPLAY}
                    </SmartLink>
                    <SmartLink
                      href={CONTACT_PATH}
                      className="btn btn-lg btn-outline"
                      aria-label="Open the SonShine Roofing contact page"
                      proseGuard
                    >
                      <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                      Contact us online
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
      </Section>
    </>
  );
}
