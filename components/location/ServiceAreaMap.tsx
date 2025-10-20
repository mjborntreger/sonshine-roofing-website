import Image from "next/image";
import { MapPin } from "lucide-react";
import type { WpImage } from "@/lib/content/wp";
import {
  FEATURE_LIST_CLASS,
  FEATURE_PILL_CLASS,
  SECTION_HEADING,
  SECTION_SUBTITLE,
} from "@/components/location/sectionStyles";
import { renderHighlight } from "@/components/utils/renderHighlight";

type ServiceAreaMapProps = {
  mapImage: WpImage | null;
  landmarks: string[];
  locationName?: string | null;
  fallbackLocationLabel: string;
  heading?: string;
  eyebrow?: string;
  className?: string;
  emptyMapMessage?: string;
  emptyLandmarksMessage?: string;
};

export default function ServiceAreaMap({
  mapImage,
  landmarks,
  locationName,
  fallbackLocationLabel,
  heading = "Service Area Map",
  eyebrow,
  className,
  emptyMapMessage = "No map uploaded for this location yet.",
  emptyLandmarksMessage = "No landmarks captured yet.",
}: ServiceAreaMapProps) {
  const wrapperClassName = className
    ? `max-w-4xl px-2 mt-12 mx-auto space-y-2 ${className}`
    : "max-w-4xl px-2 mt-12 mx-auto space-y-2";
  const locationLabel = locationName ?? fallbackLocationLabel;
  const eyebrowText =
    eyebrow ?? (locationLabel ? `Nearby Landmarks in ${locationLabel}, FL` : "Nearby Landmarks");
  const renderedHeading = renderHighlight(heading, "Service Area");

  if (!mapImage?.url) {
    return <p className="text-sm text-slate-600">{emptyMapMessage}</p>;
  }

  return (
    <figure className={wrapperClassName}>
      <div className="text-center">
        <h2 className={SECTION_HEADING}>{renderedHeading}</h2>
        <p className={SECTION_SUBTITLE}>{eyebrowText}</p>
      </div>
      {landmarks.length ? (
        <ul className={FEATURE_LIST_CLASS}>
          {landmarks.map((landmark) => (
            <li className={FEATURE_PILL_CLASS} key={landmark}>
              <MapPin className="h-4 w-4 inline mr-2 text-[--brand-blue]" />
              {landmark}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">{emptyLandmarksMessage}</p>
      )}
      <div className="relative aspect-[1080/907]">
        <Image
          src={mapImage.url}
          alt={`${locationLabel} Service Area Map`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 75vw, 960px"
          className="object-cover shadow-md rounded-3xl"
          loading="lazy"
        />
      </div>
      {mapImage.altText ? (
        <figcaption className="ml-2 text-sm italic text-slate-500">
          {`${locationLabel} Service Area Map`}
        </figcaption>
      ) : null}
    </figure>
  );
}
