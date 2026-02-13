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
import { ArrowLeftRight, CalendarDays, HandCoins, Phone } from "lucide-react";

const SERVICE_PATH = "/homeowner-referral-program";
const SERVICE_CONFIG = getServicePageConfig(SERVICE_PATH);

const STEP_CARD = "rounded-2xl border border-blue-200 bg-white p-6 shadow-sm";
const STEP_LABEL = "text-xs uppercase tracking-wide text-slate-500";
const STEP_TITLE = "mt-2 text-lg font-semibold text-slate-900";
const STEP_TEXT = "mt-2 text-sm text-slate-600";
const STEP_ICON = "h-8 w-8 mb-4 text-[--brand-blue]";

export async function generateMetadata(): Promise<Metadata> {
  const config = SERVICE_CONFIG;

  if (!config) {
    return buildBasicMetadata({
      title: "Homeowner Referral Program | SonShine Roofing",
      description:
        "Earn $250 per referral and give your friends, family, or neighbors the SonShine Roofing experience.",
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
        subtitle="Earn $250 per successful* referral and share the SonShine experience in 2026."
        badges={[
          { icon: HandCoins, label: "Earn $250 per referral" },
          { icon: Phone, label: "Simple phone referral" },
          { icon: ArrowLeftRight, label: "Paid by ACH transfer" },
        ]}
        justifyStart
      />
      <Section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start px-2">
          <div id="article-root" className="prose min-w-0">
            <JsonLd data={webPageLd} />
            <JsonLd data={breadcrumbsLd} />

            <h2 className="mt-0">Know Someone Who Needs a New Roof?</h2>
            <p>
              Introducing our new exciting Referral Program for 2026 - your opportunity to
              earn cash rewards and give others the SonShine experience.
            </p>

            <h2>How It Works</h2>
            <div className="not-prose my-6 grid gap-4 md:grid-cols-3">
              <div className={STEP_CARD}>
                <Phone className={STEP_ICON} aria-hidden="true" />
                <p className={STEP_LABEL}>Step 1</p>
                <p className={STEP_TITLE}>Call and mention your name</p>
                <p className={STEP_TEXT}>
                  Your friend, family member, or neighbor calls us and mentions your name.
                </p>
              </div>
              <div className={STEP_CARD}>
                <CalendarDays className={STEP_ICON} aria-hidden="true" />
                <p className={STEP_LABEL}>Step 2</p>
                <p className={STEP_TITLE}>Schedule a new roof estimate</p>
                <p className={STEP_TEXT}>
                  We schedule a new roof estimate with your referral.
                </p>
              </div>
              <div className={STEP_CARD}>
                <HandCoins className={STEP_ICON} aria-hidden="true" />
                <p className={STEP_LABEL}>Step 3</p>
                <p className={STEP_TITLE}>Get rewarded</p>
                <p className={STEP_TEXT}>
                  Once the sale is made and completed, you receive $250 via ACH transfer.
                </p>
              </div>
            </div>

            <h2>Start Earning Today</h2>
            <div className="not-prose mt-6 overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
              <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase font-semibold tracking-wide text-[--brand-blue]">
                    Earn $250 per referral
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    Call now to start earning and give others the SonShine experience.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <SmartLink
                    href="tel:19413779933"
                    className="btn btn-lg btn-brand-blue phone-affordance"
                    aria-label="Call SonShine Roofing to start earning referral rewards"
                    proseGuard
                  >
                    <Phone className="h-4 w-4 mr-2 phone-affordance-icon" />
                    (941) 377-9933
                  </SmartLink>
                  <SmartLink
                    href="/homeowner-referral-program/terms-and-conditions"
                    className="btn btn-lg btn-outline"
                    aria-label="View referral program terms and conditions"
                    proseGuard
                  >
                    View terms and conditions
                  </SmartLink>
                </div>
              </div>
              <div className="border-t border-blue-100 px-6 py-3 text-xs text-slate-500">
                Terms and conditions apply.
              </div>
            </div>
          </div>

          <ServicesAside activePath={SERVICE_PATH} />
        </div>
      </Section>
    </>
  );
}
