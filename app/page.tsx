import Hero from "@/components/Hero";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import WhyHomeownersChooseUs from "@/components/WhyHomeownersChooseUs";
import LatestProjectsFilter from "@/components/LatestProjectsFilter";
import { listRecentProjectsPoolForFilters } from '@/lib/wp';
import LatestPostsFilters from "@/components/LatestPostsFilter";
import { listRecentPostsPoolForFilters } from '@/lib/wp';
import ResourcesQuickLinks from "@/components/ResourcesQuickLinks"
import ServicesQuickLinks from "@/components/ServicesQuickLinks";
import BestOfTheBest from "@/components/BestOfTheBest";
import Section from "@/components/layout/Section";
import type { Metadata } from 'next';
import FaqInlineList from "@/components/FaqInlineList";
import { listFaqsWithContent, faqItemsToJsonLd } from "@/lib/wp";
import LeadFormSection from "@/components/LeadFormSection";

// ===== STYLE CONSTANTS ===== //
const leadFormLayout = "mx-auto w-full bg-slate-100";
const reviewsLayout = "mx-auto w-full bg-[#cef3ff]"
const narrowLayout = "mx-auto w-full max-w-[1280px]";
const layoutWide = "mx-auto w-full";

// ===== STATIC SEO FOR / (Home) — EDIT HERE =====
const SEO_TITLE_HOME = 'SonShine Roofing | Expert Roofing Contractor in Sarasota, Manatee, and Charlotte, FL';
const SEO_DESCRIPTION_HOME =
  'Your trusted local roofing contractor serving Sarasota, Manatee & Charlotte Counties. Affordable financing and industry-best warranties.';
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
  const projects = await listRecentProjectsPoolForFilters(4, 8);
  const posts = await listRecentPostsPoolForFilters(4, 4);
  const generalFaqs = await listFaqsWithContent(8, "general").catch(() => []);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const faqLd = faqItemsToJsonLd(
    generalFaqs.map(f => ({ question: f.title, answerHtml: f.contentHtml, url: `${base}/faq/${f.slug}` })),
    base
  );
  return (
    <>
      <Hero />
      <div className={leadFormLayout}>
        <div className="max-w-[1600px] mx-auto py-16">
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
            <ServicesQuickLinks />
            <ResourcesQuickLinks />
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
        {/* JSON-LD for FAQs on the home page */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </Section>
    </>
  );
}
