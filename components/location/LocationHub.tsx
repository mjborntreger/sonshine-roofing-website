import Image from 'next/image';
import { Star } from 'lucide-react';
import LandingHero from '@/components/marketing/landing-page/LandingHero';
import ProjectArchiveCard from '@/components/dynamic-content/project/ProjectArchiveCard';
import ProjectVideo from '@/components/dynamic-content/project/ProjectVideo';
import FaqInlineListClient from '@/components/dynamic-content/faq/FaqInlineListClient';
import ServiceAreaSection from '@/components/location/ServiceAreaSection';
import { SECTION_HEADING } from '@/components/location/sectionStyles';
import SmartLink from '@/components/utils/SmartLink';
import { allura } from '@/lib/ui/allura-font';
import { JsonLd } from '@/lib/seo/json-ld';
import { faqSchema } from '@/lib/seo/schema';
import { sanitizeFaqHtml } from '@/lib/content/directus-faq-html';
import { sanitizeSponsorHtml } from '@/lib/content/directus-sponsor-html';
import type { DirectusFaq } from '@/lib/content/directus-faqs';
import type { ServiceSummary } from '@/lib/content/directus-site';
import type {
  LocationGroups,
  LocationNeighborhood,
  LocationPage,
  LocationProject,
  LocationReview,
  LocationSponsor,
} from '@/lib/content/location-types';

export type LocationHubProps = {
  page: LocationPage;
  projects: LocationGroups<LocationProject>;
  reviews: LocationGroups<LocationReview>;
  sponsors: LocationGroups<LocationSponsor>;
  neighborhoods: LocationNeighborhood[];
  /** All local published projects, including those outside the six recent cards. */
  neighborhoodProjects?: LocationProject[];
  faqs: DirectusFaq[];
  services: ServiceSummary[];
};

function ProjectGroup({ heading, projects }: { heading: string; projects: LocationProject[] }) {
  if (!projects.length) return null;
  return (
    <section className="space-y-8" aria-label={heading}>
      <h2 className={SECTION_HEADING}>{heading}</h2>
      <div className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(({ id, project }) => (
          <article key={id} className="space-y-4">
            <ProjectArchiveCard project={project} />
            {project.neighborhood?.name.trim() ? (
              <p className="px-2 text-sm text-slate-600" data-project-neighborhood>
                <span className="font-semibold">Neighborhood: </span>{project.neighborhood.name}
              </p>
            ) : null}
            {project.video ? (
              <div className="px-2">
                <ProjectVideo title={project.video.title} videoId={project.video.youtubeId}
                  posterUrl={project.video.thumbnailUrl} posterAlt={project.video.title} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ReviewGroup({ heading, reviews }: { heading: string; reviews: LocationReview[] }) {
  if (!reviews.length) return null;
  return (
    <section className="space-y-8" aria-label={heading}>
      <h2 className={SECTION_HEADING}>{heading}</h2>
      <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => {
          const date = review.date ? new Date(review.date) : null;
          const validDate = date && Number.isFinite(date.getTime()) ? date : null;
          return (
            <figure key={review.id} className="space-y-5 rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <div aria-label={`${review.rating} out of 5 stars`} className="flex gap-1 text-amber-500">
                {Array.from({ length: review.rating }, (_, index) => (
                  <Star key={index} aria-hidden="true" className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="whitespace-pre-line leading-relaxed text-slate-700">{review.text}</blockquote>
              <figcaption className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{review.authorName}</p>
                <p>{review.areaName}</p>
                {validDate ? (
                  <p><time dateTime={validDate.toISOString()}>{new Intl.DateTimeFormat('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
                  }).format(validDate)}</time></p>
                ) : null}
                {review.url ? (
                  <SmartLink href={review.url} className="inline-block text-brand-blue underline underline-offset-4">
                    Read original review
                  </SmartLink>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function SponsorGroup({ heading, sponsors }: { heading: string; sponsors: LocationSponsor[] }) {
  if (!sponsors.length) return null;
  return (
    <section className="space-y-8" aria-label={heading}>
      <h2 className={SECTION_HEADING}>{heading}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sponsors.map(({ id, feature, areaNames }) => (
          <article key={id} className="space-y-4 rounded-3xl border border-blue-200 bg-white p-6">
            {feature.featuredImage ? (
              <Image src={feature.featuredImage.url} alt={feature.featuredImage.altText || ''}
                width={96} height={96} sizes="96px" className="h-24 w-24 object-contain" />
            ) : null}
            <h3 className="text-2xl">{feature.title}</h3>
            <p className="text-sm text-slate-600">{Array.from(new Set(areaNames)).join(', ')}</p>
            {feature.contentHtml ? (
              <div className="space-y-3 text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeSponsorHtml(feature.contentHtml) }} />
            ) : null}
            {feature.links && (feature.links.websiteUrl || feature.links.facebookUrl || feature.links.instagramUrl) ? (
              <ul className="flex flex-wrap gap-4 text-sm font-semibold text-brand-blue">
                {feature.links.websiteUrl ? <li><SmartLink href={feature.links.websiteUrl}>Website</SmartLink></li> : null}
                {feature.links.facebookUrl ? <li><SmartLink href={feature.links.facebookUrl}>Facebook</SmartLink></li> : null}
                {feature.links.instagramUrl ? <li><SmartLink href={feature.links.instagramUrl}>Instagram</SmartLink></li> : null}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

/** All records arrive from the deployment snapshot. This component never fetches CMS content. */
export default function LocationHub({
  page, projects, reviews, sponsors, neighborhoods, neighborhoodProjects, faqs, services,
}: LocationHubProps) {
  const faqItems = faqs.map(({ id, title, contentHtml }) => ({ id, title, contentHtml: sanitizeFaqHtml(contentHtml) }));
  return (
    <>
      <LandingHero scriptFontClassName={allura.variable} title={page.title} />
      <div data-location-hub className="mx-auto max-w-[1280px] space-y-20 px-4 py-14 md:space-y-24 md:py-20">
        <div className="max-w-3xl space-y-6 text-lg leading-relaxed text-slate-700">
          <p>{page.introduction}</p>
          {page.overviewHtml ? <div className="space-y-4" dangerouslySetInnerHTML={{ __html: sanitizeFaqHtml(page.overviewHtml) }} /> : null}
        </div>

        <ProjectGroup heading={`Recent roofing projects in ${page.name}`} projects={projects.local} />
        <ProjectGroup heading="Roofing projects in nearby areas" projects={projects.nearby} />
        <ReviewGroup heading={`Reviews from ${page.name}`} reviews={reviews.local} />
        <ReviewGroup heading="Reviews from nearby areas" reviews={reviews.nearby} />

        {services.length ? (
          <section aria-labelledby="location-services" className="space-y-8">
            <h2 id="location-services" className={SECTION_HEADING}>Roofing services</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <SmartLink key={service.slug} href={service.href}
                  className="block space-y-3 rounded-3xl border border-blue-200 p-6 transition hover:bg-blue-50">
                  <h3 className="text-2xl text-brand-blue">{service.navLabel}</h3>
                  {service.intro ? <p className="text-slate-600">{service.intro}</p> : null}
                </SmartLink>
              ))}
            </div>
          </section>
        ) : null}

        <ServiceAreaSection areaId={page.id} locationName={page.name} mapImage={page.mapImage}
          neighborhoods={neighborhoods} projects={neighborhoodProjects ?? projects.local} />
        <SponsorGroup heading={`Partnerships in ${page.name}`} sponsors={sponsors.local} />
        <SponsorGroup heading="Partnerships in nearby areas" sponsors={sponsors.nearby} />

        {faqItems.length ? (
          <section aria-label="Roofing questions and answers">
            <FaqInlineListClient heading="Roofing questions and answers" seeMoreHref="/faq" items={faqItems} />
            <JsonLd data={faqSchema(faqItems.map((faq) => ({
              question: faq.title,
              answerHtml: faq.contentHtml,
              url: `/faq#faq-${faq.id}`,
            })), { url: `/locations/${page.slug}` })} />
          </section>
        ) : null}
      </div>
    </>
  );
}
