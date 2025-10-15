import Hero from "@/components/marketing/landing-page/Hero";
import ReviewsCarousel from "@/components/reviews-widget/ReviewsCarousel";
import WhyHomeownersChooseUs from "@/components/marketing/landing-page/WhyHomeownersChooseUs";
import LatestProjectsFilter from "@/components/dynamic-content/latest-filters/LatestProjectsFilter";
import { listRecentProjectsPoolForFilters } from '@/lib/content/wp';
import LatestPostsFilters from "@/components/dynamic-content/latest-filters/LatestPostsFilter";
import { listRecentPostsPoolForFilters } from '@/lib/content/wp';
import ResourcesQuickLinks from "@/components/global-nav/static-pages/ResourcesQuickLinks"
import ServicesQuickLinks from "@/components/global-nav/static-pages/ServicesQuickLinks";
import BestOfTheBest from "@/components/marketing/landing-page/BestOfTheBest";
import Section from "@/components/layout/Section";
import type { Metadata } from 'next';
import FaqInlineList from "@/components/dynamic-content/faq/FaqInlineList";
import { listFaqsWithContent } from "@/lib/content/wp";
import LeadFormSection from "@/components/lead-capture/lead-form/LeadFormSection";

// ===== STYLE CONSTANTS ===== //
const leadFormLayout = "mx-auto w-full";
const reviewsLayout = "mx-auto w-full bg-[#cef3ff]"
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

export default async function Page() {
  const [projects, posts, generalFaqs] = await Promise.all([
    listRecentProjectsPoolForFilters(4, 8),
    listRecentPostsPoolForFilters(4, 4),
    listFaqsWithContent(8, "general").catch(() => []),
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
        <ReviewsCarousel />
      </div>
      <div className={narrowLayout}>
        <div className="py-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start max-w-full">
          <div className="min-w-0">
            <div className="mx-2">
              <WhyHomeownersChooseUs />
              <BestOfTheBest />
              <LatestProjectsFilter projects={projects} initial={4} />
              <LatestPostsFilters posts={posts} initial={4} />
            </div>
          </div>

          {/* Sticky Section */}
          <div className="hidden lg:block min-w-0 lg:sticky lg:top-24 self-start px-4">
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
