import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary } from "@/lib/wp";
import { stripHtml } from "@/lib/wp";
import { lineClampStyle, truncateText } from "@/components/archive/card-utils";
import { buildProjectHref, buildProjectHrefFromUri, ROUTES } from "@/lib/routes";

type Props = {
  project: ProjectSummary;
  style?: CSSProperties;
  className?: string;
};

const pillClass =
  "inline-flex min-w-0 max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:px-3 sm:py-1 sm:text-sm";
const pillLabelClass = "block max-w-full truncate";

export default function ProjectArchiveCard({ project, style, className }: Props) {
  const href =
    buildProjectHref(project.slug) ??
    buildProjectHrefFromUri(project.uri) ??
    project.uri ??
    ROUTES.project;
  const summary = truncateText(stripHtml(project.projectDescription ?? ""), 260);

  return (
    <div className={className} style={style}>
      <SmartLink
        href={href}
        className="group block rounded-3xl focus-visible:outline-none"
        data-icon-affordance="right"
      >
        <Card className="proj-card overflow-hidden hover:shadow-lg transition">
          <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-bold">{project.title}</CardTitle>
          </CardHeader>

          {project.heroImage?.url ? (
            <div
              className="relative w-full overflow-hidden bg-slate-100"
              style={{ aspectRatio: "16 / 10" }}
            >
              <Image
                fill
                src={project.heroImage.url}
                alt={project.heroImage.altText ?? project.title}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
          )}

          <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
            {summary && (
              <p className="text-sm text-slate-600" style={lineClampStyle}>
                {summary}
              </p>
            )}

            {(project.materialTypes?.length ?? 0) + (project.serviceAreas?.length ?? 0) + (project.roofColors?.length ?? 0) > 0 && (
              <div className="relative mt-4 -mx-5 sm:mx-0">
                <div className="flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 scrollbar-none sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {(project.materialTypes ?? []).map((t) => (
                    <span
                      key={`mat-${project.slug}-${t.slug}`}
                      className={pillClass}
                    >
                      <span className={pillLabelClass}>{t.name}</span>
                    </span>
                  ))}
                  {(project.serviceAreas ?? []).map((t) => (
                    <span
                      key={`sa-${project.slug}-${t.slug}`}
                      className={pillClass}
                    >
                      <span className={pillLabelClass}>{t.name}</span>
                    </span>
                  ))}
                  {(project.roofColors ?? []).map((t) => (
                    <span
                      key={`rc-${project.slug}-${t.slug}`}
                      className={pillClass}
                    >
                      <span className={pillLabelClass}>{t.name}</span>
                    </span>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-1 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden" />
                <div className="pointer-events-none absolute inset-y-1 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
            <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
              View project
              <ArrowRight className="icon-affordance h-4 w-4" />
            </span>
          </CardFooter>
        </Card>
      </SmartLink>
    </div>
  );
}
