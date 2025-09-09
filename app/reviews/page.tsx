import Section from "@/components/layout/Section";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ReviewsCatcher from "@/components/ReviewsCatcher";

export default function Page() {
    return (
        <Section>
            <ReviewsCatcher />
            <ReviewsCarousel />
        </Section>

    )
}