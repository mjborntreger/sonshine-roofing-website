import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocationNeighborhood } from "@/lib/content/wp";
import { SECTION_HEADING, SECTION_SUBTITLE } from "@/components/location/sectionStyles";
import { renderHighlight } from "@/components/utils/renderHighlight";

type NeighborhoodsServedSectionProps = {
  neighborhoods: LocationNeighborhood[];
  heading?: string;
  eyebrow?: string;
  className?: string;
  emptyMessage?: string;
};

export default function NeighborhoodsServedSection({
  neighborhoods,
  heading = "We Work Where You Live",
  eyebrow = 'We take the word "local" seriously',
  className,
  emptyMessage = "No neighborhoods have been listed yet.",
}: NeighborhoodsServedSectionProps) {
  const sectionClassName = className ? `px-4 ${className}` : "px-4";
  const renderedHeading = renderHighlight(heading, "You");

  return (
    <section className={sectionClassName}>
      <div className="text-center">
        <h2 className={SECTION_HEADING}>{renderedHeading}</h2>
        <p className={SECTION_SUBTITLE}>{eyebrow}</p>
      </div>
      {neighborhoods.length ? (
        <div className="grid grid-cols-1 gap-6 space-y-6 md:grid-cols-3">
          {neighborhoods.map((neighborhood, index) => {
            const title = neighborhood.neighborhood || `Neighborhood ${index + 1}`;
            const zipCodes = neighborhood.zipCodes ?? [];

            return (
              <Card
                key={`${neighborhood.neighborhood ?? "neighborhood"}-${index}`}
                className="overflow-hidden transition hover:shadow-lg h-fit"
              >
                <CardHeader className="px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
                  <CardTitle className="font-bold">{title}</CardTitle>
                </CardHeader>

                {neighborhood.neighborhoodImage?.url ? (
                  <div
                    className="relative w-full overflow-hidden bg-slate-100"
                    style={{ aspectRatio: "16 / 9" }}
                  >
                    <Image
                      src={neighborhood.neighborhoodImage.url}
                      alt={
                        neighborhood.neighborhoodImage.altText ||
                        `${neighborhood.neighborhood ?? "Neighborhood"} image`
                      }
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                )}

                <CardContent className="px-5 pt-5 pb-4 sm:px-6 sm:pb-6">
                  {zipCodes.length ? (
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold">ZIP Code(s):</span> {zipCodes.join(", ")}
                    </p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex items-center justify-between px-5 py-4 border-t border-slate-100/60 bg-slate-50/40 sm:px-6">
                  <details>
                    <summary
                      data-icon-affordance="down"
                      className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-[--brand-blue] tracking-tight"
                    >
                      See Details
                      <ArrowDown className="w-4 h-4 icon-affordance" />
                    </summary>
                    <div className="mt-4">
                      {neighborhood.neighborhoodDescription ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: neighborhood.neighborhoodDescription,
                          }}
                        />
                      ) : (
                        <p className="text-sm text-slate-600">No description provided yet.</p>
                      )}
                    </div>
                  </details>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      )}
    </section>
  );
}
