import type { Person } from '@/lib/wp';
import { stripHtml } from '@/lib/wp';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import SmartLink from "@/components/SmartLink";
import MediaFrame from "@/components/MediaFrame";
import { ArrowRight } from "lucide-react";
import { lineClampStyle, truncateText } from "@/components/archive/card-utils";
import { buildPersonHref, ROUTES } from "@/lib/routes";

export default function PersonGrid({ people }: { people: Person[] }) {
  if (!people?.length) return null;

  return (
    <div className="pb-16">
      <ul className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-w-0 px-2 py-4">
        {people.map((p) => {
          const summary = getSummary(p.contentHtml);
          return (
            <li key={p.slug} className="min-w-0">
              <SmartLink
                href={buildPersonHref(p.slug) ?? ROUTES.about}
                className="group block rounded-2xl focus-visible:outline-none"
                data-icon-affordance="right"
              >
                <Card className="overflow-hidden hover:shadow-lg transition">
                  <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                    <CardTitle className="font-semibold">{p.title}</CardTitle>
                    {p.positionTitle && (
                      <p className="mt-1 text-sm text-slate-600">{p.positionTitle}</p>
                    )}
                  </CardHeader>

                  {p.featuredImage?.url ? (
                    <MediaFrame
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText || p.title}
                      ratio="4 / 3"
                      className="w-full"
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                      priority={false}
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                  )}

                  <CardContent className="px-5 pb-4 pt-5 text-sm text-slate-600 sm:px-6 sm:pb-6">
                    {summary && (
                      <p style={{ ...lineClampStyle, WebkitLineClamp: 2 }}>{summary}</p>
                    )}
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
                      View profile
                      <ArrowRight className="icon-affordance h-4 w-4" />
                    </span>
                  </CardFooter>
                </Card>
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getSummary(html: string) {
  const source = stripHtml(html);
  return truncateText(source, 180);
}
