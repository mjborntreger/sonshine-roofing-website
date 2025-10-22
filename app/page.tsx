import Hero from "@/components/marketing/landing-page/Hero";
import ReviewsCarousel from "@/components/reviews-widget/ReviewsCarousel";
import WhyHomeownersChooseUs from "@/components/marketing/landing-page/WhyHomeownersChooseUs";
import LatestProjectsFilter from "@/components/dynamic-content/latest-filters/LatestProjectsFilter";
import { listRecentProjectsPoolForFilters, listRecentPostsPoolForFilters, listFaqsWithContent, listSponsorFeaturesByServiceArea } from '@/lib/content/wp';
import LatestPostsFilters from "@/components/dynamic-content/latest-filters/LatestPostsFilter";
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks"
import ServicesQuickLinks from "@/components/global-nav/static-pages/ServicesQuickLinks";
import BestOfTheBest from "@/components/marketing/landing-page/BestOfTheBest";
import Section from "@/components/layout/Section";
import type { Metadata } from 'next';
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import LeadFormSection from "@/components/lead-capture/lead-form/LeadFormSection";
import LocalPartnershipsSection from "@/components/location/LocalPartnershipsSection";

// ===== STYLE CONSTANTS ===== //
const leadFormLayout = "mx-auto w-full";
const reviewsLayout = "mx-auto w-full bg-[#cef3ff]";
const narrowLayout = "mx-auto w-full max-w-[1280px]";

// ===== STATIC SEO FOR / (Home) — EDIT HERE =====
const SEO_TITLE_HOME = 'SonShine Roofing | Expert Roofing Contractor in Sarasota, Manatee, and Charlotte, FL';
const SEO_DESCRIPTION_HOME =
  'Fast, Friendly, & Reliable | (941) 866-4320 | Licensed & Insured | Your trusted local roofing contractor serving Sarasota, Manatee & Charlotte Counties.';
const SEO_KEYWORDS_HOME = [
  'Sarasota roofing',
  'North Port roofing',
  'Bradenton roofing',
  'venice roofing',
  'nokomis roofing',
  'palmetto roofing',
  'parrish roofing',
  'port charlotte roofing',
  'metal roof',
  'tile roof',
  'shingle roof',
  'roof replacement',
  'financing',
  'GAF Master Elite',
  'Licensed and Insured',
  'warranty',
  'roof repair',
  'roof inspection',
  'roof maintenance',
  'Manatee County roofing',
  'Charlotte County roofing',
  'roofing contractor'
];
const SEO_CANONICAL_HOME = '/';
const SEO_OG_IMAGE_DEFAULT = '/og-default.png';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE_HOME,
    description: SEO_DESCRIPTION_HOME,
    keywords: SEO_KEYWORDS_HOME,
    alternates: { canonical: SEO_CANONICAL_HOME },
    openGraph: {
      type: 'website',
      title: SEO_TITLE_HOME,
      description: SEO_DESCRIPTION_HOME,
      url: SEO_CANONICAL_HOME,
      images: [{ url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_TITLE_HOME,
      description: SEO_DESCRIPTION_HOME,
      images: [SEO_OG_IMAGE_DEFAULT],
    },
  };
}

type Params = { slug: string };
export const revalidate = 600;

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const sponsorFeaturesPromise = listSponsorFeaturesByServiceArea(slug, {
      primaryLimit: 8,
      fallbackLimit: 6,
      minimum: 4,
    }).catch(() => []);
  const [projects, posts, generalFaqs, sponsorFeatures] = await Promise.all([
    listRecentProjectsPoolForFilters(4, 8),
    listRecentPostsPoolForFilters(4, 4).catch(() => []),
    listFaqsWithContent(8, "general").catch(() => []),
    sponsorFeaturesPromise,
  ]);
  return (
    <>
      <Hero />
      <div className={leadFormLayout}>
        <div className="max-w-[1280px] mx-auto py-16">
          <LeadFormSection />
        </div>
      </div>
      <div className={reviewsLayout}>
        <ReviewsCarousel highlightText="Our Customers" />
      </div>
      <div className={narrowLayout}>
        <div className="py-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          <div className="min-w-0">
            <div className="mx-2">
              <LatestProjectsFilter projects={projects} initial={4} />
              <WhyHomeownersChooseUs highlightText="Homeowners" />
              <LocalPartnershipsSection
                features={sponsorFeatures}
                emptyMessage="No sponsored partners yet."
              />
              <BestOfTheBest />
              <LatestPostsFilters posts={posts} initial={4} />
            </div>
          </div>

          {/* Sticky Section */}
          <div className="self-start hidden min-w-0 px-4 lg:block lg:sticky lg:top-24">
            <ServicesQuickLinks activePath="/" />
            <ResourcesQuickLinks activePath="/" />
          </div>

        </div>
      </div>


      {/* General FAQs at bottom of the landing page */}
      <Section>
        <FaqInlineList
          heading="General FAQs"
          topicSlug="general"
          limit={8}
          initialItems={generalFaqs}
          seeMoreHref="/faq"
        />
      </Section>
    </>
  );
}
