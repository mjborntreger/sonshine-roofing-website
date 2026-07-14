import type { Metadata } from 'next';
import Section from '@/components/layout/Section';
import ReviewsCarousel from '@/components/reviews-widget/ReviewsCarousel';
import ReviewsCatcher from '@/components/reviews-catcher/ReviewsCatcher';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

const reviewsLayout = 'mx-auto w-full mb-24';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: 'Customer Reviews | SonShine Roofing',
    description:
      'Read customer reviews of SonShine Roofing for roof replacement, repair, inspection, and maintenance.',
    path: '/reviews',
    robots: { index: false, follow: true },
  });
}

export default function Page() {
  return (
    <>
      <Section>
        <ReviewsCatcher />
      </Section>
      <div className={reviewsLayout}>
        <ReviewsCarousel />
      </div>
    </>
  );
}
