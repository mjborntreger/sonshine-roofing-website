import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SmartLink from "@/components/utils/SmartLink";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/content/wp";
import { stripHtml } from "@/lib/content/wp";
import {
  lineClampStyle,
  PROJECT_PREVIEW_CARD_MIN_HEIGHT_CLASS,
  titleClampStyle,
  truncateText,
} from "@/components/dynamic-content/card-utils";
import { buildProjectHref, buildProjectHrefFromUri, ROUTES } from "@/lib/routes";
import ProjectReviewSnippet from "@/components/dynamic-content/project/ProjectReviewSnippet";
import { cn } from "@/lib/utils";

type Props = {
  project: ProjectSummary;
  style?: CSSProperties;
  className?: string;
};

const pillClass =
  "inline-flex min-w-0 max-w-full items-center rounded-xl font-semibold tracking-tight bg-blue-100 px-2.5 py-1 text-sm text-slate-600 sm:px-3 sm:py-1 sm:text-sm";
const pillLabelClass = "block max-w-[14rem] truncate";

export default function ProjectArchiveCard({ project, style, className }: Props) {
  const href =
    buildProjectHref(project.slug) ??
    buildProjectHrefFromUri(project.uri) ??
    project.uri ??
    ROUTES.project;
  const summary = truncateText(stripHtml(project.projectDescription ?? ""), 260);
  const pillItems = [
    ...(project.materialTypes ?? []).map((t) => ({
      key: `mat-${project.slug}-${t.slug}`,
      label: t.name,
    })),
    ...(project.serviceAreas ?? []).map((t) => ({
      key: `sa-${project.slug}-${t.slug}`,
      label: t.name,
    })),
    ...(project.roofColors ?? []).map((t) => ({
      key: `rc-${project.slug}-${t.slug}`,
      label: t.name,
    })),
  ].filter((pill): pill is { key: string; label: string } => Boolean(pill.label));
  const hasReview = typeof project.reviewSnippet === "string" && project.reviewSnippet.trim().length > 0;

  return (
    <div className={cn("h-full", className)} style={style}>
      <SmartLink
        href={href}
        className="block h-full rounded-3xl bg-amber-50/50 group focus-visible:outline-none"
        data-icon-affordance="right"
      >
        <Card
          className={cn(
            "proj-card flex h-full flex-col overflow-hidden transition hover:shadow-lg",
            PROJECT_PREVIEW_CARD_MIN_HEIGHT_CLASS,
          )}
        >
          <CardHeader className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
            <CardTitle className="min-h-[3.75rem] text-2xl font-bold leading-tight" style={titleClampStyle}>
              {project.title}
            </CardTitle>
          </CardHeader>

          <div
            className="relative w-full overflow-hidden bg-blue-200"
            style={{ aspectRatio: "16 / 10" }}
          >
            {project.heroImage?.url ? (
              <Image
                fill
                src={project.heroImage.url}
                alt={project.heroImage.altText ?? project.title}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 hover:scale-[1.06]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
            )}
          </div>

          <CardContent className="flex flex-1 flex-col px-5 pt-5 pb-4 sm:px-6 sm:pb-6">
            <div className="min-h-[5.25rem]">
              {summary ? (
                <p className="text-slate-600 leading-7" style={lineClampStyle}>
                  {summary}
                </p>
              ) : null}
            </div>

            <div className="mt-5 min-h-[8rem]">
              {hasReview ? (
                <ProjectReviewSnippet
                  review={project.reviewSnippet}
                  author={project.reviewAuthorName}
                  className="mt-0"
                />
              ) : null}
            </div>

            <div className="relative mt-4 min-h-[2.875rem] -mx-5 sm:-mx-6">
              <div className="flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 scrollbar-none sm:px-6">
                {pillItems.map((pill) => (
                  <span key={pill.key} className={pillClass}>
                    <span className={pillLabelClass}>{pill.label}</span>
                  </span>
                ))}
              </div>
              <div className="absolute left-0 w-6 pointer-events-none inset-y-1 bg-gradient-to-r from-white to-transparent" />
              <div className="absolute right-0 w-6 pointer-events-none inset-y-1 bg-gradient-to-l from-white to-transparent" />
            </div>
          </CardContent>

          <CardFooter className="mt-auto flex justify-end border-t border-blue-200 bg-blue-50 px-5 py-4 font-semibold text-slate-700 sm:px-6">
            <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-wide">
              View project
              <ArrowRight className="w-4 h-4 inline ml-2 icon-affordance" />
            </span>
          </CardFooter>
        </Card>
      </SmartLink>
    </div>
  );
}
