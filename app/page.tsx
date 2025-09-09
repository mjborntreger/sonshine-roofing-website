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

const sectionDividers = "my-18"


export default async function Page() {
  const projects = await listRecentProjectsPoolForFilters(4, 8);
  const posts = await listRecentPostsPoolForFilters(4, 4);
  return (
    <>
      <Hero />
      <div>
        <div className="container-edge py-4">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
            <div className="min-w-0">
              <WhyHomeownersChooseUs />
              {/* Quick Links | Mobile Only */}
              <div className="block md:hidden mt-12">
                <h2 className="text-center">
                  Quick Links
                </h2>
                <div className="gradient-divider my-8" />
                <ServicesQuickLinks />
                <ResourcesQuickLinks />
              </div>
              <ReviewsCarousel />
              <LatestProjectsFilter projects={projects} initial={4} />
              <BestOfTheBest />
              <LatestPostsFilters posts={posts} initial={4} />
            </div>

            {/* Sticky Section */}
            <div className="hidden lg:block min-w-0 lg:sticky lg:top-20 self-start">
              <ServicesQuickLinks />
              <ResourcesQuickLinks />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
