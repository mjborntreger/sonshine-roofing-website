import Image from "next/image";
import { Facebook, Globe, Instagram } from "lucide-react";
import type { SponsorFeature } from "@/lib/content/wp";
import { SECTION_HEADING, SECTION_SUBTITLE } from "@/components/location/sectionStyles";
import { renderHighlight } from "@/components/utils/renderHighlight";
import { Accordion } from "@/components/ui/Accordion";
import SmartLink from "../utils/SmartLink";

type LocalPartnershipsSectionProps = {
  features: SponsorFeature[];
  heading?: string;
  eyebrow?: string;
  className?: string;
  emptyMessage?: string;
};

export default function LocalPartnershipsSection({
  features,
  heading = "Community-driven Values",
  eyebrow = "As a pillar of the Sarasota roofing community, we believe it is our duty to give back to organizations whose values align with ours. As you'll see, we proudly support law enforcement, youth sports, and more.",
  className,
  emptyMessage = "No partnerships recorded yet.",
}: LocalPartnershipsSectionProps) {
  const sectionClassName = className ? `mx-2 mt-24 ${className}` : "mx-2 mt-24";
  const renderedHeading = renderHighlight(heading, "Community-driven");

  return (
    <section className={sectionClassName}>
      <div className="flex flex-col max-w-3xl mx-auto text-center">
        <h2 className={SECTION_HEADING}>{renderedHeading}</h2>
        <p className={SECTION_SUBTITLE}>{eyebrow}</p>
      </div>
      {features.length ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={`${feature.title ?? "sponsor"}-${index}`}
              className="flex flex-col h-full gap-4 p-6 group"
            >
              <div className="flex items-start gap-4 mt-2">
                {feature.featuredImage?.url ? (
                  <div className="flex items-center justify-center w-16 h-16">
                    <div className="relative w-16 h-16">
                      <Image
                        src={feature.featuredImage.url}
                        alt={feature.featuredImage.altText || `${feature.title ?? "Sponsor"} logo`}
                        fill
                        className="object-cover border rounded-full border-blue-200"
                        sizes="48px"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : null}
                <h3 className="text-xl md:text-2xl">
                  {feature.title || `Sponsor ${index + 1}`}
                </h3>
              </div>
              {feature.links ? (
                <ul className="flex flex-wrap gap-5 text-sm">
                  {feature.links.facebookUrl ? (
                    <li>
                      <SmartLink
                        href={feature.links.facebookUrl}
                        className="flex items-center gap-2 font-medium transition-colors text-brand-blue hover:text-brand-blue/80"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Facebook aria-hidden="true" className="h-4 w-4 text-[#1877F2]" />
                        Facebook
                      </SmartLink>
                    </li>
                  ) : null}
                  {feature.links.instagramUrl ? (
                    <li>
                      <SmartLink
                        href={feature.links.instagramUrl}
                        className="flex items-center gap-2 font-medium transition-colors text-brand-blue hover:text-brand-blue/80"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Instagram aria-hidden="true" className="h-4 w-4 text-[#E4405F]" />
                        Instagram
                      </SmartLink>
                    </li>
                  ) : null}
                  {feature.links.websiteUrl ? (
                    <li>
                      <SmartLink
                        href={feature.links.websiteUrl}
                        className="flex items-center gap-2 font-medium transition-colors text-brand-blue hover:text-brand-blue/80"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Globe aria-hidden="true" className="h-4 w-4 text-[#E4405F]" />
                        Website
                      </SmartLink>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {feature.contentHtml ? (
                <Accordion
                  summary="See details"
                  proseBody={false}
                  contentClassName="space-y-2 mb-4 bg-sky-50 text-lg text-slate-600 max-h-56 overflow-y-auto"
                  summaryClassName="bg-sky-50"
                >
                  <div dangerouslySetInnerHTML={{ __html: feature.contentHtml }} />
                </Accordion>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      )}
    </section>
  );
}
