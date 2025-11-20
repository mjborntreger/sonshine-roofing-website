import type { Metadata } from 'next';
import Section from "@/components/layout/Section";
import ReviewsCarousel from "@/components/reviews-widget/ReviewsCarousel";
import ReviewsCatcher from '@/components/reviews-catcher/ReviewsCatcher';

const reviewsLayout = "mx-auto w-full mb-24"

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

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
    )
}
