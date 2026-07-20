import Hero from '@/components/marketing/landing-page/LandingHero';
import HeroTrustBar from '@/components/marketing/landing-page/HeroTrustBar';
import ReviewsCarousel from '@/components/reviews-widget/ReviewsCarousel';
import WhyHomeownersChooseUs from '@/components/marketing/landing-page/WhyHomeownersChooseUs';
import LatestProjectsFilter from '@/components/dynamic-content/latest-filters/LatestProjectsFilter';
import {
  listRecentProjectsPoolForFilters,
  listSponsorFeaturesByServiceArea,
} from '@/lib/content/wp';
import { listRecentPostsPoolForFilters } from '@/lib/content/blog';
import { listFaqs } from '@/lib/content/directus-faqs';
import LatestPostsFilters from '@/components/dynamic-content/latest-filters/LatestPostsFilter';
import ServicesQuickLinks from '@/components/global-nav/static-pages/ServicesQuickLinks';
import BestOfTheBest from '@/components/marketing/landing-page/BestOfTheBest';
import Section from '@/components/layout/Section';
import type { Metadata } from 'next';
import FaqInlineList from '@/components/dynamic-content/faq/FaqInlineList';
import LeadFormSection from '@/components/lead-capture/lead-form/InitialNavigation';
import LocalPartnershipsSection from '@/components/location/LocalPartnershipsSection';
import SidebarCta from '@/components/cta/SidebarCta';
import { getSiteSettings, getWebsitePageMetadata } from '@/lib/content/directus-site';

// ===== STYLE CONSTANTS ===== //
const leadFormLayout = 'mx-auto w-full';
const reviewsLayout = 'mx-auto w-full bg-[#cef3ff]';
const narrowLayout =
  'bg-gradient-to-b from-[#cef3ff] via-[#cef3ff]/80 to-transparent mx-auto w-full';

// ===== STATIC SEO FOR / (Home) — EDIT HERE =====
const SEO_TITLE_HOME = 'SonShine Roofing | Best Roofing Company in Sarasota';
const SEO_CANONICAL_HOME = '/';
const SEO_OG_IMAGE_DEFAULT =
  'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return getWebsitePageMetadata({
    title: SEO_TITLE_HOME,
    description: `Fast, Friendly, & Reliable | ${settings?.phone ?? 'Call us'} | Licensed & Insured | Your trusted local roofing contractor serving Sarasota, Manatee & Charlotte Counties.`,
    path: SEO_CANONICAL_HOME,
    image: { url: SEO_OG_IMAGE_DEFAULT, width: 1200, height: 630 },
  });
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
    listFaqs({ pagePath: '/', limit: 8 }).catch(() => []),
    sponsorFeaturesPromise,
  ]);
  return (
    <>
      <Hero />
      <div className="bg-blue-200/50 border border-b-blue-300/70">
        <ReviewsCarousel showOwnerReplies={false} />
      </div>
      <LeadFormSection />
      <div className={reviewsLayout}>
        <HeroTrustBar />
      </div>
      <div className={narrowLayout}>
        <div className="py-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] max-w-[1280px] mx-auto items-start">
          <div className="min-w-0">
            <div className="mx-2">
              <WhyHomeownersChooseUs highlightText="Family-owned" />
              <LocalPartnershipsSection
                features={sponsorFeatures}
                emptyMessage="No sponsored partners yet."
              />
              <BestOfTheBest />
            </div>
          </div>

          {/* Sticky Section */}
          <div className="self-start hidden min-w-0 px-4 lg:block lg:sticky lg:top-16">
            <ServicesQuickLinks activePath="/" />
            <div className="h-[1px] w-full bg-blue-100 my-4" />
            <SidebarCta />
          </div>
        </div>
      </div>
      <div className={leadFormLayout}>
        <div className="max-w-[1280px] pt-16 mx-auto">
          <LatestProjectsFilter projects={projects} initial={4} />
          <LatestPostsFilters posts={posts} initial={4} />
        </div>
      </div>

      {/* General FAQs at bottom of the landing page */}
      <Section>
        <FaqInlineList
          heading="General FAQs"
          pagePath="/"
          limit={8}
          initialItems={generalFaqs}
          seeMoreHref="/faq"
        />
      </Section>
    </>
  );
}
