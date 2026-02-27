import type { Person } from '@/lib/content/wp';
import { stripHtml } from '@/lib/content/wp';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import SmartLink from "@/components/utils/SmartLink";
import MediaFrame from "@/components/ui/MediaFrame";
import { ArrowRight } from "lucide-react";
import { lineClampStyle, truncateText } from "@/components/dynamic-content/card-utils";
import { buildPersonHref, ROUTES } from "@/lib/routes";

export default function PersonGrid({ people }: { people: Person[] }) {
  if (!people?.length) return null;

  return (
    <div className="pb-16">
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 px-2 py-4">
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
                    <CardTitle className="font-semibold text-2xl">{p.title}</CardTitle>
                    {p.positionTitle && (
                      <p className="mt-1 text-slate-700">{p.positionTitle}</p>
                    )}
                  </CardHeader>

                  {p.featuredImage?.url ? (
                    <div
                      className="relative w-full overflow-hidden bg-blue-200"
                    >
                      <MediaFrame
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText || p.title}
                        ratio="4 / 3"
                        className="object-cover w-full transition-transform duration-300 hover:scale-[1.06]"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                        priority={false}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                  )}

                  <CardContent className="px-5 pb-4 pt-5 text-slate-600 sm:px-6 sm:pb-6">
                    {summary && (
                      <p style={{ ...lineClampStyle, WebkitLineClamp: 3 }}>{summary}</p>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-end border-t border-blue-200 bg-blue-50 font-semibold px-5 py-4 text-slate-700 sm:px-6">
                        <span className="items-center gap-2 text-md font-semibold tracking-wide">
                            See profile
                            <ArrowRight className="w-4 h-4 inline ml-2 icon-affordance" />
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
