import type { Metadata } from 'next';
import Section from "@/components/layout/Section";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ReviewsCatcher from "@/components/ReviewsCatcher";

const reviewsLayout = "mx-auto w-full bg-slate-200"

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
