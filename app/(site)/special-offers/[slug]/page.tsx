import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowDown, BadgePercent, CalendarClock, Smartphone, Tag } from "lucide-react";

import Section from "@/components/layout/Section";
import SpecialOfferForm from "@/components/lead-capture/special-offer/SpecialOfferForm";
import ServicesAside from "@/components/global-nav/static-pages/ServicesAside";
import Hero from "@/components/ui/Hero";
import SmartLink from "@/components/utils/SmartLink";
import { getSpecialOfferBySlug, listSpecialOfferSlugs } from "@/lib/content/directus-special-offers";
import isExpired from "@/lib/lead-capture/isExpired";
import { formatSpecialOfferExpiration } from "@/lib/lead-capture/specialOfferDates";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbSchema, offerSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";

export const revalidate = 900;

const HERO_SUBTITLE_MAX_LENGTH = 180;

export async function generateStaticParams() {
  const slugs = await listSpecialOfferSlugs(200).catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

function buildRobotsMeta() {
  return {
    index: false,
    follow: true,
  } as const;
}

function collapseText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function splitParagraphs(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\n{2,}|\r\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildHeroSubtitle(value: string): string {
  if (!value) {
    return "Claim this special offer from SonShine Roofing.";
  }

  if (value.length <= HERO_SUBTITLE_MAX_LENGTH) {
    return value;
  }

  return `${value.slice(0, HERO_SUBTITLE_MAX_LENGTH - 3).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getSpecialOfferBySlug(slug).catch(() => null);

  if (!offer) {
    const metadata = buildBasicMetadata({
      title: "Special Offer · SonShine Roofing",
      description: "This special offer is not available right now.",
      path: `/special-offers/${slug}`,
    });
    metadata.robots = buildRobotsMeta();
    return metadata;
  }

  const description =
    collapseText(offer.description).slice(0, 160) ||
    "Claim this special offer from SonShine Roofing.";
  const metadata = buildBasicMetadata({
    title: `${offer.title} · SonShine Roofing`,
    description,
    path: `/special-offers/${offer.slug}`,
    image: {
      url: offer.featuredImage?.url || "/og-default.png",
      width: offer.featuredImage?.width || 1200,
      height: offer.featuredImage?.height || 630,
    },
  });
  metadata.robots = buildRobotsMeta();
  return metadata;
}

export default async function SpecialOfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getSpecialOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  const expired = isExpired(offer.expirationDate);
  const expirationLabel = formatSpecialOfferExpiration(offer.expirationDate);
  const description = collapseText(offer.description);
  const descriptionParagraphs = splitParagraphs(offer.description);
  const heroSubtitle = buildHeroSubtitle(description);
  const expirationBadge = expirationLabel
    ? `${expired ? "Expired on" : "Valid through"} ${expirationLabel}`
    : null;

  const cookieStore = await cookies();
  const cookieKey = `ss_offer_${offer.slug}`;
  const cookieValue = cookieStore.get(cookieKey)?.value ?? null;

  const origin = SITE_ORIGIN;
  const pagePath = `/special-offers/${offer.slug}`;

  const breadcrumbsLd = breadcrumbSchema(
    [
      { name: "Home", item: "/" },
      { name: "Special Offers", item: "/special-offers" },
      { name: offer.title, item: pagePath },
    ],
    { origin },
  );

  const offerSchemaData = offerSchema({
    name: offer.title,
    description: description.slice(0, 160),
    url: pagePath,
    origin,
    validThrough: offer.expirationDate || undefined,
    availability: expired ? "https://schema.org/Discontinued" : "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "SonShine Roofing",
      url: origin,
    },
  });

  let initialUnlock: { offerCode: string } | null = null;
  if (!expired && offer.offerCode && cookieValue) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      const code = typeof parsed?.code === "string" ? parsed.code : null;
      const expValue = parsed?.exp ? new Date(parsed.exp) : null;
      const stillValid = expValue ? expValue.getTime() >= Date.now() : true;
      if (code === offer.offerCode && stillValid) {
        initialUnlock = { offerCode: code };
      }
    } catch {
      // ignore malformed cookie
    }
  }

  return (
    <>
      <JsonLd data={breadcrumbsLd} />
      <JsonLd data={offerSchemaData} />

      <Hero
        title={offer.title}
        eyelash="Limited-Time Roofing Offer"
        subtitle={heroSubtitle}
        justifyStart
        imageSrc={offer.featuredImage?.url || undefined}
        badges={[
          { icon: Tag, label: "Limited-Time Offer" },
          ...(offer.discount ? [{ icon: BadgePercent, label: offer.discount }] : []),
          ...(expirationBadge ? [{ icon: CalendarClock, label: expirationBadge }] : []),
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <SmartLink
            href="#claim-offer"
            className="btn-brand-blue btn-lg rounded-lg px-3 py-2"
            aria-label="Claim this special offer"
            data-icon-affordance="down"
            proseGuard
          >
            <BadgePercent className="mr-2 inline h-4 w-4" aria-hidden="true" />
            Claim This Offer
            <ArrowDown className="icon-affordance ml-2 inline h-4 w-4" aria-hidden="true" />
          </SmartLink>
          <SmartLink
            href="tel:+19418664320"
            className="btn-outline phone-affordance btn-lg rounded-lg px-3 py-2 text-white hover:bg-transparent"
            aria-label="Call SonShine Roofing"
            proseGuard
          >
            <Smartphone className="phone-affordance-icon mr-2 inline h-4 w-4" aria-hidden="true" />
            Call (941) 866-4320
          </SmartLink>
        </div>
      </Hero>

      <Section className="pb-20">
        <div className="grid gap-4 overflow-visible px-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0 space-y-8">
            <section id="claim-offer" className="scroll-mt-24">
              {!expired && offer.offerCode ? (
                <Suspense
                  fallback={
                    <div className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
                      Loading offer form...
                    </div>
                  }
                >
                  <SpecialOfferForm
                    offerCode={offer.offerCode}
                    offerSlug={offer.slug}
                    offerTitle={offer.title}
                    offerDiscount={offer.discount ?? null}
                    offerExpiration={offer.expirationDate ?? null}
                    initialUnlock={initialUnlock}
                  />
                </Suspense>
              ) : (
                <div className="not-prose rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-red-700">Offer unavailable</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This special offer has expired. Reach out to our team for current promotions.
                  </p>
                  <a href="tel:+19418664320" className="btn btn-brand-blue btn-md mt-4 inline-flex justify-center">
                    Call (941) 866-4320
                  </a>
                </div>
              )}
            </section>

            {offer.legalDisclaimer !== null ? (
              <div className="not-prose text-xs italic leading-[1.3rem] text-slate-600 print:text-black">
                <strong className="font-semibold text-slate-800 print:text-black">Disclaimer:</strong>{" "}
                {offer.legalDisclaimer}
              </div>
            ) : null}

            <article className="prose prose-slate max-w-none print:prose">
              <h2 className="mt-0">Offer Details</h2>
              {descriptionParagraphs.length ? (
                descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>Claim this special offer from SonShine Roofing.</p>
              )}

              {expired ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                  <h2 className="text-xl font-semibold">This offer has expired.</h2>
                  <p>Please check back soon for future promotions from SonShine Roofing.</p>
                </div>
              ) : null}
            </article>
          </div>

          <ServicesAside activePath={pagePath} />
        </div>
      </Section>
    </>
  );
}
