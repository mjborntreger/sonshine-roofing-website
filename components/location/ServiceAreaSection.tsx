import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocationNeighborhood, WpImage } from "@/lib/content/wp";
import {
  FEATURE_LIST_CLASS,
  FEATURE_PILL_CLASS,
  SECTION_HEADING,
  SECTION_SUBTITLE,
} from "@/components/location/sectionStyles";
import { renderHighlight } from "@/components/utils/renderHighlight";

type ServiceAreaSectionProps = {
  mapImage: WpImage | null;
  neighborhoods: LocationNeighborhood[];
  landmarks: string[];
  fallbackLocationLabel: string;
  locationName?: string | null;
  heading?: string;
  headingHighlight?: string;
  eyebrow?: string;
  className?: string;
  emptyMapMessage?: string;
  emptyLandmarksMessage?: string;
  emptyNeighborhoodsMessage?: string;
};

export default function ServiceAreaSection({
  mapImage,
  neighborhoods,
  landmarks,
  fallbackLocationLabel,
  locationName,
  heading,
  headingHighlight = "Affordable Roofing Services",
  eyebrow,
  className,
  emptyMapMessage = "No map uploaded for this location yet.",
  emptyLandmarksMessage = "No landmarks captured yet.",
  emptyNeighborhoodsMessage = "No neighborhoods have been listed yet.",
}: ServiceAreaSectionProps) {
  const sectionClassName = className ? `mt-24 px-4 ${className}` : "mt-24 px-4";
  const locationLabel = locationName ?? fallbackLocationLabel;
  const computedHeading =
    heading ??
    (locationLabel ? `Affordable Roofing Services in ${locationLabel}` : "Affordable Roofing Services");
  const renderedHeading = renderHighlight(computedHeading, headingHighlight);
  const eyebrowText =
    eyebrow ??
    (locationLabel
      ? `During our 38-year tenure in ${locationLabel}, we've always kept prices competitive without sacrificing on a quality roofing experience. We adapt to your neighborhood, not the other way around.`
      : undefined);

  const mapImageUrl = mapImage?.url;
  const mapAltLabel = locationLabel ? `${locationLabel} Service Area Map` : "Service Area Map";
  const neighborhoodsEmpty = neighborhoods.length === 0;
  const landmarksEmpty = landmarks.length === 0;

  return (
    <section className={sectionClassName}>
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <h2 className={SECTION_HEADING}>{renderedHeading}</h2>
          {eyebrowText ? <p className={SECTION_SUBTITLE}>{eyebrowText}</p> : null}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {mapImageUrl ? (
            <>
              <div className="lg:row-span-2 col-span-full lg:col-span-2">
                <h3 className="mb-2"><span className="text-[--brand-blue]">{`${locationName}`} </span>Service Area Map</h3>
                <figure className="space-y-2">
                  <div
                    className="relative w-full overflow-hidden rounded-3xl bg-blue-200"
                    style={{ aspectRatio: "1080 / 907" }}
                  >
                    <Image
                      src={mapImageUrl}
                      alt={mapAltLabel}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 75vw, 960px"
                      className="rounded-3xl object-cover border-blue-200 shadow-2xl transition-transform duration-300 hover:scale-[1.06]"
                      loading="lazy"
                    />
                  </div>
                  {mapImage?.altText ? (
                    <figcaption className="ml-2 text-sm italic text-slate-500">{mapAltLabel}</figcaption>
                  ) : null}
                </figure>
                <div className="mt-4">
                  {landmarksEmpty ? (
                    <p className="text-center text-sm text-slate-600">{emptyLandmarksMessage}</p>
                  ) : (
                    <ul className={FEATURE_LIST_CLASS}>
                      {landmarks.map((landmark) => (
                        <li className={FEATURE_PILL_CLASS} key={landmark}>
                          <MapPin className="mr-2 inline h-4 w-4 text-[--brand-blue]" />
                          {landmark}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="col-span-full text-sm text-slate-600 lg:col-span-2 lg:row-span-2">
              {emptyMapMessage}
            </p>
          )}


          {neighborhoodsEmpty ? (
            <p className="col-span-full text-sm text-slate-600 lg:col-span-1">{emptyNeighborhoodsMessage}</p>
          ) : (
            neighborhoods.map((neighborhood, index) => {
              const title = neighborhood.neighborhood || `Neighborhood ${index + 1}`;
              const zipCodes = neighborhood.zipCodes ?? [];

              return (
                <div
                  key={`${neighborhood.neighborhood ?? "neighborhood"}-${index}`}
                  className="col-span-full lg:col-span-1"
                >
                  <Card className="h-fit overflow-hidden transition hover:shadow-lg">
                    <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                      <CardTitle className="font-bold">{title}</CardTitle>
                    </CardHeader>

                    {neighborhood.neighborhoodImage?.url ? (
                      <div
                        className="relative w-full overflow-hidden bg-blue-200"
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
                          className="object-cover transition-transform duration-300 hover:scale-[1.06]"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
                    )}

                    <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                      {zipCodes.length ? (
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">ZIP Code(s):</span> {zipCodes.join(", ")}
                        </p>
                      ) : null}
                    </CardContent>
                    <CardFooter className="flex border-t border-blue-200 bg-blue-50 px-5 py-4 sm:px-6">
                      <details className="ont-normal text-slate-800">
                        <summary
                          data-icon-affordance="down"
                          className="not-prose flex cursor-pointer select-none items-center gap-2 text-md font-semibold tracking-wide text-slate-700"
                        >
                          See Details
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
