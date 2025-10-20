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
import Hero from "@/components/marketing/landing-page/Hero";
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
import ServiceAreaMap from "@/components/location/ServiceAreaMap";
import NeighborhoodsServedSection from "@/components/location/NeighborhoodsServedSection";
import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildReviewSchema, sponsorFeaturesItemListSchema, graphSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN, ensureAbsoluteUrl } from "@/lib/seo/site";

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
const leadFormLayout = "w-full px-2";
const reviewsLayout = "mx-auto w-full bg-[#cef3ff]";
const narrowLayout = "mx-auto w-full max-w-[1280px]";
const FALLBACK_REVIEW_INTERVAL_SECONDS = 60;
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

  const toPossessive = (name: string | null) =>
    !name ? "" : name.endsWith("s") ? `${name}'` : `${name}'s`;
  const locationPossessive = toPossessive(location.locationName);
  const botbTitle = `Voted ${locationPossessive} Best Roofer for 5 Years`;
  const botbHighlight = `${locationPossessive} Best Roofer`;

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
  const locationSchemaUrl = ensureAbsoluteUrl(`/locations/${slug}`);
  const schemaBusinessName = location.locationName
    ? `SonShine Roofing — ${location.locationName}`
    : null;
  const globalBusinessId = `${SITE_ORIGIN}/#roofingcontractor`;

  const ratingAggregate = featuredReviews.reduce(
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

  const reviewSchema = featuredReviews.length
    ? buildReviewSchema({
        reviews: featuredReviews,
        averageRating,
        reviewCount: featuredReviews.length,
        ratingCount: ratingAggregate.count || featuredReviews.length,
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

  return (
    <>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <Hero title={`The Best Roofing Company in ${location.locationName} for Over 38 Years`} />

      <section className={leadFormLayout}>
        <div className="max-w-[1280px] mx-auto py-16 gap-8">
          <LeadFormSection />
        </div>
      </section>
      <section className={reviewsLayout}>
        {featuredReviews.length ? (
          <ReviewsCarousel
            reviews={featuredReviews}
            heading={`What Our ${location.locationName || location.title || slug} Customers Say`}
            highlightText={location.locationName ? `${location.locationName} Customers` : undefined}
            showBusinessProfileLink={true}
            showRatingSummary={true}
            showSeeAllButton={true}
            showDisclaimer={false}
            limit={featuredReviews.length}
            fallbackToRemote={true}
          />
        ) : (
          <p className="text-sm text-slate-600">No reviews highlighted yet.</p>
        )}
      </section>

      <main className={narrowLayout}>
        <div className="py-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          <div className="min-w-0">
            <div className="mx-2">
              <WhyHomeownersChooseUs
                title={`Why ${location.locationName} Homeowners Choose Us`}
                highlightText={location.locationName ? `${location.locationName} Homeowners` : undefined}
              />
              <LocalPartnershipsSection
                features={sponsorFeatures}
                emptyMessage="No sponsored partners yet."
              />
              <BestOfTheBest title={botbTitle} highlightText={botbHighlight} />
              <section className="p-6 prose bg-white border shadow-md max-w-none rounded-3xl border-slate-200">
                <h2 className="text-xl md:text-3xl">{`A Special Message to ${location.locationName} Homeowners:`}</h2>
                <p className="italic text-slate-400">{`Updated: ${modifiedDisplay}`}</p>

                {location.contentHtml ? (
                  <div className="mt-4" dangerouslySetInnerHTML={{ __html: location.contentHtml }} />
                ) : (
                  <p className="mt-4">No WordPress editor content provided for this location.</p>
                )}
              </section>
              <LatestProjectsByLocation
                projects={locationProjects}
                locationName={location.locationName}
              />
              <LatestPostsFilter posts={posts} initial={4} />
              <ServiceAreaMap
                mapImage={location.mapImage}
                landmarks={location.nearbyLandmarks}
                locationName={location.locationName}
                fallbackLocationLabel={location.title || slug}
              />
            </div>
          </div>

          {/* Sticky Section */}
          <aside className="self-start hidden min-w-0 px-4 lg:block lg:sticky lg:top-24">
            <ServicesQuickLinks activePath="/" />
            <ResourcesQuickLinks activePath="/" />
          </aside>

        </div>

        <NeighborhoodsServedSection neighborhoods={location.neighborhoodsServed} />
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
