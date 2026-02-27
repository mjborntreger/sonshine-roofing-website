import { notFound } from "next/navigation";
import {
  getLocationBySlug,
  listFaqsWithContent,
  listRecentPostsPoolForFilters,
  listRecentProjectsByServiceArea,
  listLocationSlugs,
  listSponsorFeaturesByServiceArea,
} from "@/lib/content/wp";
import type { LocationRecord } from "@/lib/content/wp";
import Hero from "@/components/marketing/landing-page/LandingHero";
import LeadFormSection from "@/components/lead-capture/lead-form/LeadFormSection";
import ReviewsCarousel from "@/components/reviews-widget/ReviewsCarousel";
import type { Review } from "@/components/reviews-widget/types";
import WhyHomeownersChooseUs from "@/components/marketing/landing-page/WhyHomeownersChooseUs";
import LatestPostsFilter from "@/components/dynamic-content/latest-filters/LatestPostsFilter";
import ServicesQuickLinks from "@/components/global-nav/static-pages/ServicesQuickLinks";
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks";
import BestOfTheBest from "@/components/marketing/landing-page/BestOfTheBest";
import LatestProjectsByLocation from "@/components/dynamic-content/project/LatestProjectsByLocation";
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import Section from "@/components/layout/Section";
import LocalPartnershipsSection from "@/components/location/LocalPartnershipsSection";
import ServiceAreaSection from "@/components/location/ServiceAreaSection";
import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildReviewSchema, sponsorFeaturesItemListSchema, graphSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN, ensureAbsoluteUrl } from "@/lib/seo/site";
import HeroTrustBar from "@/components/marketing/landing-page/HeroTrustBar";

type OgImageRecord = {
  url?: unknown;
  secureUrl?: unknown;
  width?: unknown;
  height?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type Params = { slug: string };
export const revalidate = 600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await listLocationSlugs();
    return slugs.map((slug: string) => ({ slug }));
  } catch (error) {
    console.error("Failed to list location slugs", error);
    return [];
  }
}

// ===== STYLE CONSTANTS ===== //
const leadFormLayout = "mx-auto w-full";
const reviewsLayout = "mx-auto w-full bg-[#cef3ff]";
const narrowLayout = "bg-gradient-to-b from-[#cef3ff] via-[#cef3ff]/80 to-transparent mx-auto w-full";
const FALLBACK_REVIEW_INTERVAL_SECONDS = 60;
const MAX_LOCATION_REVIEWS = 10;
const SARASOTA_SLUG = "sarasota";
const RAW_GBP_URL = (process.env.NEXT_PUBLIC_GBP_URL ?? "").replace(/\u200B/g, "").trim();
const GBP_PROFILE_URL =
  RAW_GBP_URL || "https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958";
// =========================== //



const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const parseReviewDateToEpochSeconds = (input: string | null | undefined): number | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed.length) return null;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
};

const normalizeFeaturedReviews = (reviews: LocationRecord["featuredReviews"]): Review[] => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return reviews
    .map((review, index): Review | null => {
      const text = review.review?.trim();
      if (!text) return null;

      const author = review.reviewAuthor?.trim() || "Anonymous reviewer";
      const ownerReply = review.ownerReply?.trim();
      const relative = review.reviewDate?.trim();
      const parsedTime = parseReviewDateToEpochSeconds(review.reviewDate);
      const fallbackTime = nowSeconds - index * FALLBACK_REVIEW_INTERVAL_SECONDS;
      const safeTime = Math.max(parsedTime ?? fallbackTime, 0);
      const authorUrl = review.reviewUrl?.trim();

      const normalized: Review = {
        author_name: author,
        rating: 5,
        text,
        time: safeTime,
      };

      if (authorUrl) normalized.author_url = authorUrl;
      if (relative) normalized.relative_time_description = relative;
      if (ownerReply) normalized.ownerReply = ownerReply;

      return normalized;
    })
    .filter((item): item is Review => item !== null);
};

const buildReviewKey = (review: Review): string => {
  const author = review.author_name?.trim().toLowerCase() ?? "";
  const text = review.text.trim().replace(/\s+/g, " ").toLowerCase();
  const time = typeof review.time === "number" ? review.time : "";
  return `${author}|${text}|${time}`;
};

const mergeReviewsWithBackfill = (primary: Review[], fallback: Review[], max: number): Review[] => {
  const seen = new Set<string>();
  const uniquePrimary = primary.filter((review) => {
    const key = buildReviewKey(review);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniquePrimary.length >= max) return uniquePrimary;

  const uniqueFallback = fallback.filter((review) => {
    const key = buildReviewKey(review);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const combined = uniquePrimary.concat(uniqueFallback);
  return combined.length > max ? combined.slice(0, max) : combined;
};


export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug).catch(() => null);
  if (!location) notFound();

  const seo = location.seo ?? {};
  const og = seo.openGraph ?? {};

  const rawDescription =
    seo.description || og.description || stripHtml(location.contentHtml || "") || "";

  const title = (seo.title || og.title || location.title || "Location · SonShine Roofing").trim();
  const description = rawDescription.trim().slice(0, 160);

  const ogImageRecord = isRecord(og.image) ? (og.image as OgImageRecord) : null;
  const ogUrl: string =
    (ogImageRecord && typeof ogImageRecord.secureUrl === "string" && ogImageRecord.secureUrl) ||
    (ogImageRecord && typeof ogImageRecord.url === "string" && ogImageRecord.url) ||
    location.mapImage?.url ||
    "/og-default.png";
  const ogWidth: number =
    (ogImageRecord && typeof ogImageRecord.width === "number" && ogImageRecord.width) || 1200;
  const ogHeight: number =
    (ogImageRecord && typeof ogImageRecord.height === "number" && ogImageRecord.height) || 630;

  return buildArticleMetadata({
    title,
    description,
    path: `/locations/${slug}`,
    image: { url: ogUrl, width: ogWidth, height: ogHeight },
    publishedTime: location.date ?? undefined,
    modifiedTime: location.modified ?? undefined,
  });
}

export default async function LocationPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const locationPromise = getLocationBySlug(slug).catch(() => null);
  const sponsorFeaturesPromise = listSponsorFeaturesByServiceArea(slug, {
    primaryLimit: 8,
    fallbackLimit: 6,
    minimum: 4,
  }).catch(() => []);

  const [location, posts, locationProjects, generalFaqs, sponsorFeatures] = await Promise.all([
    locationPromise,
    listRecentPostsPoolForFilters(4, 4).catch(() => []),
    listRecentProjectsByServiceArea(slug, 4).catch(() => []),
    listFaqsWithContent(8, "general").catch(() => []),
    sponsorFeaturesPromise,
  ]);

  if (!location) notFound();

  const botbTitle = `Voted Best Roofer in ${location.locationName} for 5 Years`;
  const botbHighlight = `Best Roofer in ${location.locationName}`;
  const heroTrustHeadingTarget = location.locationName || location.title || slug;
  const heroTrustHeading = heroTrustHeadingTarget
    ? `Top-rated Roofer in ${heroTrustHeadingTarget}? That's us.`
    : undefined;

  const formatDate = (input: string | null | undefined) => {
    if (!input) return null;
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const modifiedDisplay = formatDate(location.modified);

  const featuredReviews = normalizeFeaturedReviews(location.featuredReviews);
  let displayReviews = featuredReviews;
  if (slug !== SARASOTA_SLUG && featuredReviews.length < MAX_LOCATION_REVIEWS) {
    const sarasotaLocation = await getLocationBySlug(SARASOTA_SLUG).catch(() => null);
    const fallbackReviews = sarasotaLocation
      ? normalizeFeaturedReviews(sarasotaLocation.featuredReviews)
      : [];
    if (fallbackReviews.length) {
      displayReviews = mergeReviewsWithBackfill(
        featuredReviews,
        fallbackReviews,
        MAX_LOCATION_REVIEWS
      );
    }
  }
  const locationSchemaUrl = ensureAbsoluteUrl(`/locations/${slug}`);
  const schemaBusinessName = location.locationName
    ? `SonShine Roofing — ${location.locationName}`
    : null;
  const globalBusinessId = `${SITE_ORIGIN}/#roofingcontractor`;

  const ratingAggregate = displayReviews.reduce(
    (acc, review) => {
      if (typeof review.rating === "number" && Number.isFinite(review.rating)) {
        acc.sum += review.rating;
        acc.count += 1;
      }
      return acc;
    },
    { sum: 0, count: 0 }
  );
  const averageRating =
    ratingAggregate.count > 0 ? ratingAggregate.sum / ratingAggregate.count : null;

  const reviewSchema = displayReviews.length
    ? buildReviewSchema({
      reviews: displayReviews,
      averageRating,
      reviewCount: displayReviews.length,
      ratingCount: ratingAggregate.count || displayReviews.length,
      options: {
        businessName: schemaBusinessName ?? "SonShine Roofing",
        businessUrl: locationSchemaUrl,
        providerUrl: GBP_PROFILE_URL,
        origin: SITE_ORIGIN,
        id: `${locationSchemaUrl}#roofing-contractor`,
        address: {
          addressLocality: location.locationName ?? undefined,
        },
        telephone: "+1-941-866-4320",
        withContext: false,
      },
    })
    : null;

  const sponsorHeading = location.locationName
    ? `${location.locationName} Partnerships`
    : "Local Partnerships";

  const sponsorSchema = sponsorFeaturesItemListSchema({
    features: sponsorFeatures,
    name: sponsorHeading,
    description: "Who We Sponsor",
    origin: SITE_ORIGIN,
    providerId: globalBusinessId,
    id: `${locationSchemaUrl}#sponsor-itemlist`,
    withContext: false,
  });

  const structuredDataItems = [reviewSchema, sponsorSchema].filter(
    (item): item is Record<string, unknown> => Boolean(item)
  );

  const structuredData = structuredDataItems.length
    ? graphSchema({ items: structuredDataItems })
    : null;
  const hasDisplayReviews = displayReviews.length > 0;
  const carouselLimit =
    displayReviews.length >= MAX_LOCATION_REVIEWS ? displayReviews.length : MAX_LOCATION_REVIEWS;

  return (
    <>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <Hero title={`One of The Best Roofing Companies in ${location.locationName} for Over 38 Years`} />
      <div className={reviewsLayout}>
        <HeroTrustBar heading={heroTrustHeading} />
        <div className="bg-blue-200/50 border border-t-blue-200 border-b-blue-200">
          {hasDisplayReviews ? (
            <ReviewsCarousel
              reviews={displayReviews}
              showBusinessProfileLink={true}
              showDisclaimer={true}
              limit={carouselLimit}
              fallbackToRemote={true}
            />
          ) : (
            <p className="text-sm text-slate-600">No reviews highlighted yet.</p>
          )}
        </div>
        <LeadFormSection />
      </div>

      <main className={narrowLayout}>
        <div className="py-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] max-w-[1280px] mx-auto items-start">
          <div className="min-w-0">
            <div className="mx-2">
              <WhyHomeownersChooseUs
                title={`Family-owned ${location.locationName} Roofing Company`}
                highlightText={location.locationName ? `${location.locationName} Roofing Company` : undefined}
                description={`Since 1987, SonShine Roofing has been an integral part of the ${location.locationName} community. Over the past 38 years, we've always honored a tradition of honesty, respect, and integrity in everything we do.`}
              />
              <LocalPartnershipsSection
                features={sponsorFeatures}
                eyebrow={`As a pillar of the ${location.locationName} roofing community, we believe it is our duty to give back to organizations whose values align with ours. As you'll see, we proudly support law enforcement, youth sports, and more.`}
                emptyMessage="No sponsored partners yet."
              />
              <BestOfTheBest title={botbTitle} highlightText={botbHighlight} />
              <section className="mt-12 mx-2 p-6 prose bg-white border shadow-md max-w-none rounded-3xl border-blue-200">
                <h2 className="text-xl text-slate-700 md:text-3xl">{`A Special Message to ${location.locationName} Homeowners:`}</h2>
                <p className="italic text-slate-400">{`Updated: ${modifiedDisplay}`}</p>

                {location.contentHtml ? (
                  <div className="mt-4" dangerouslySetInnerHTML={{ __html: location.contentHtml }} />
                ) : (
                  <p className="mt-4">No WordPress editor content provided for this location.</p>
                )}
              </section>
            </div>
          </div>

          {/* Sticky Section */}
          <aside className="self-start hidden min-w-0 px-4 lg:block lg:sticky lg:top-16">
            <ServicesQuickLinks activePath="/" locationSlug={slug} />
            <ResourcesQuickLinks activePath="/" />
          </aside>

        </div>

        <div className={leadFormLayout}>
          <div className="max-w-[1280px] mx-auto pt-16 gap-8">
            <LatestProjectsByLocation
              projects={locationProjects}
              locationName={location.locationName}
            />
            <LatestPostsFilter posts={posts} initial={4} />
          </div>
        </div>

        <ServiceAreaSection
          mapImage={location.mapImage}
          neighborhoods={location.neighborhoodsServed}
          landmarks={location.nearbyLandmarks}
          locationName={location.locationName}
          fallbackLocationLabel={location.title || slug}
          heading={`Affordable Roofing Services in ${location.locationName}`}
          eyebrow={`During our 38-year tenure in ${location.locationName}, we've always kept prices competitive without sacrificing on a quality roofing experience. We adapt to your neighborhood, not the other way around.`}
          className="py-12"
        />
        <Section>
          <FaqInlineList
            heading="General FAQs"
            topicSlug="general"
            limit={8}
            initialItems={generalFaqs}
            seeMoreHref="/faq"
          />
        </Section>

      </main>
    </>
  );
}
