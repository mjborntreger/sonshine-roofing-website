import ProjectArchiveCard from "@/components/dynamic-content/project/ProjectArchiveCard";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowRight } from "lucide-react";
import type { ProjectSummary } from "@/lib/content/wp";
import { renderHighlight } from "@/components/utils/renderHighlight";

type Props = {
  projects: ProjectSummary[];
  locationName?: string | null;
  heading?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
};

const baseWrapperClass = "px-4 pb-24 md:px-12 max-w-[1600px] mx-auto overflow-hidden";
const lessFatCta = "btn btn-brand-blue btn-lg w-full sm:w-auto";
const SECTION_SUBTITLE = "mt-2 mb-8 text-sm text-slate-500";
const SECTION_HEADING = "text-3xl md:text-5xl text-slate-700";

export default function LatestProjectsByLocation({
  projects,
  locationName,
  heading,
  description,
  ctaHref = "/project",
  ctaLabel = "See All Projects",
  className,
}: Props) {
  if (!Array.isArray(projects) || projects.length === 0) return null;

  const resolvedHeading =
    heading ?? (locationName ? `Recent Projects in ${locationName}` : "Recent Projects");

  const resolvedDescription =
    description ??
    (locationName
      ? `Our latest roof replacements in ${locationName}, FL`
      : "Our latest roof replacements for Southwest Florida homeowners");

  const wrapperClass = [baseWrapperClass, className].filter(Boolean).join(" ");
  const renderedHeading = renderHighlight(resolvedHeading, locationName);

  return (
    <section className={wrapperClass} aria-labelledby="projects-by-location-heading">
      <div className="text-center">
        <h2 id="projects-by-location-heading" className={SECTION_HEADING}>
          {renderedHeading}
        </h2>
        <p className={SECTION_SUBTITLE}>{resolvedDescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
        {projects.map((project, index) => (
          <div
            key={project.slug}
            className="motion-safe:animate-lp-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <ProjectArchiveCard project={project} />
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <SmartLink
          href={ctaHref}
          className={lessFatCta}
          title={ctaLabel}
          data-icon-affordance="right"
          proseGuard
        >
          {ctaLabel}
          <ArrowRight className="inline w-4 h-4 ml-2 icon-affordance" />
        </SmartLink>
      </div>
    </section>
  );
}
