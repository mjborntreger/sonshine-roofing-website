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

// ===== STATIC SEO FOR / (Home) — EDIT HERE =====
const SEO_TITLE_HOME = 'SonShine Roofing | Sarasota Roof Replacement & Repair Since 1987';
const SEO_DESCRIPTION_HOME =
  'Local roofing contractor serving Sarasota, Manatee & Charlotte Counties. Expert roof replacement, repair, and maintenance with honest guidance and dependable warranties.';
const SEO_KEYWORDS_HOME = [
  'Sarasota roofing',
  'roof replacement',
  'roof repair',
  'roof maintenance',
  'Manatee County roofing',
  'Charlotte County roofing',
  'roofing contractor'
];
const SEO_CANONICAL_HOME = '/';
const SEO_OG_IMAGE_DEFAULT = '/og-default.jpg';

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

const sectionDivider = "h-1.5 w-full my-16 bg-gradient-to-r from-[#0045d7] via-[#00e3fe] to-[#0045d7]"

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
      <div className="bg-neutral-50">
        <div className="grid gap-1 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
          <div className="min-w-0">
            <Section>
              <WhyHomeownersChooseUs />
            </Section>
            {/* Quick Links | Mobile Only */}
            <div className="block px-4 md:hidden">
              <ServicesQuickLinks />
              <ResourcesQuickLinks />
            </div>
            <Section>
              <BestOfTheBest />
            </Section>
          </div>

          {/* Sticky Section */}
          <div className="hidden lg:block min-w-0 lg:sticky lg:top-16 self-start p-4">
            <ServicesQuickLinks />
            <ResourcesQuickLinks />
          </div>
        </div>
        <div className="bg-[#fb9216]/30">
          <ReviewsCarousel />
        </div>
      <div>
        <LatestProjectsFilter projects={projects} initial={4} />
        <LatestPostsFilters posts={posts} initial={4} />
        {/* General FAQs at bottom of the landing page */}
        <Section>
          <FaqInlineList heading="General FAQs" items={generalFaqs} seeMoreHref="/faq" />
          {/* JSON-LD for FAQs on the home page */}
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
          />
        </Section>
      </div>
      </div>

    </>
  );
}
